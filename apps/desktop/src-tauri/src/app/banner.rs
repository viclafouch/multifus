use std::thread;
use std::time::Duration;

use tauri::AppHandle;
use tauri::Emitter;
use tauri::LogicalSize;
use tauri::Manager;
use tauri::Monitor;
use tauri::PhysicalPosition;
use tauri::PhysicalRect;
use tauri::PhysicalSize;
use tauri::WebviewWindow;

use crate::app::journal::JournalEvent;
use crate::app::journal::Work;
use crate::app::overlay::Generation;
use crate::app::overlay::Overlay;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::app::view::BannerCharacter;
use crate::app::view::BannerStep;
use crate::app::view::DisplayView;
use crate::config::Banner;
use crate::config::BannerCorner;
use crate::platform::WindowManager;

const STEP_EVENT: &str = "multifus://banner";

const WIDTH: f64 = 250.0;
const HEIGHT: f64 = 64.0;

const PREVIEW: Duration = Duration::from_millis(2500);

const OVERLAY: Overlay = Overlay {
    label: "banner",
    page: "banner.html",
    thread: "multifus-banner",
    work: Work::Banner,
    failed: |detail| JournalEvent::BannerFailed { detail },
    accepts_first_mouse: false,
};

#[derive(Debug, Default)]
struct BannerGeneration(Generation);

pub fn setup(app: &AppHandle) {
    app.manage(BannerGeneration::default());
}

pub fn follow_walk(app: &AppHandle, enabled: bool, inside_game: bool) {
    let generation = next_generation(app);

    if enabled {
        raise_apart(app, generation, inside_game);

        return;
    }

    lock(app).set_banner_character(None);

    close(app);
}

pub fn follow_foreground(app: &AppHandle, inside_game: bool) {
    let Some(window) = OVERLAY.window(app) else {
        return;
    };

    if inside_game == window.is_visible().unwrap_or(false) {
        return;
    }

    let followed = if inside_game {
        place(app, &window).and_then(|()| window.show())
    } else {
        window.hide()
    };

    OVERLAY.said(app, followed);
}

pub fn step(app: &AppHandle, character: Option<BannerCharacter>) {
    let step = {
        let mut state = lock(app);

        state.set_banner_character(character);

        state.banner_step()
    };

    tell(app, step);
}

fn tell(app: &AppHandle, step: BannerStep) {
    OVERLAY.said(app, app.emit_to(OVERLAY.target(), STEP_EVENT, step));
}

pub fn preview(app: &AppHandle) {
    let generation = next_generation(app);

    OVERLAY.apart(app, move |app| {
        raise(app, generation, true);

        thread::sleep(PREVIEW);

        if !matches_current(app, generation) {
            return;
        }

        if lock(app).is_walk_enabled() {
            follow_foreground(app, matches_inside_game(windows(app)));
        } else {
            close(app);
        }
    });
}

fn matches_inside_game(windows: &dyn WindowManager) -> bool {
    windows
        .foreground_game_window()
        .is_ok_and(|found| found.is_some())
}

fn raise_apart(app: &AppHandle, generation: u64, inside_game: bool) {
    OVERLAY.apart(app, move |app| {
        raise(app, generation, inside_game);
    });
}

fn next_generation(app: &AppHandle) -> u64 {
    app.state::<BannerGeneration>().0.next()
}

fn matches_current(app: &AppHandle, generation: u64) -> bool {
    app.state::<BannerGeneration>().0.matches_latest(generation)
}

fn raise(app: &AppHandle, generation: u64, inside_game: bool) {
    if !matches_current(app, generation) {
        return;
    }

    let Some(window) = OVERLAY.window(app).or_else(|| build(app)) else {
        return;
    };

    if !matches_current(app, generation) {
        close(app);

        return;
    }

    let raised = place(app, &window).and_then(|()| {
        if inside_game {
            window.show()
        } else {
            window.hide()
        }
    });

    if let Err(error) = raised {
        OVERLAY.complain(app, error.to_string());

        return;
    }

    if !matches_current(app, generation) {
        close(app);

        return;
    }

    let step = lock(app).banner_step();

    tell(app, step);
}

fn close(app: &AppHandle) {
    let Some(window) = OVERLAY.window(app) else {
        return;
    };

    OVERLAY.said(app, window.close());
}

fn build(app: &AppHandle) -> Option<WebviewWindow> {
    let window = OVERLAY.build(app, LogicalSize::new(WIDTH, HEIGHT))?;

    OVERLAY.said(app, window.set_ignore_cursor_events(true));

    Some(window)
}

fn place(app: &AppHandle, window: &WebviewWindow) -> tauri::Result<()> {
    let Banner { corner, screen } = lock(app).banner_place();

    let Some(screen) = screen_of(app, screen.as_deref())? else {
        return Ok(());
    };

    let size =
        PhysicalSize::<u32>::from_logical(LogicalSize::new(WIDTH, HEIGHT), screen.scale_factor());

    window.set_size(size)?;
    window.set_position(corner_of(screen.work_area(), size, corner))
}

fn corner_of(
    area: &PhysicalRect<i32, u32>,
    size: PhysicalSize<u32>,
    corner: BannerCorner,
) -> PhysicalPosition<i32> {
    let width = i32::try_from(area.size.width).unwrap_or(i32::MAX);
    let height = i32::try_from(area.size.height).unwrap_or(i32::MAX);
    let banner_width = i32::try_from(size.width).unwrap_or(i32::MAX);
    let banner_height = i32::try_from(size.height).unwrap_or(i32::MAX);

    let x = if corner.matches_left() {
        area.position.x
    } else {
        area.position.x + width - banner_width
    };

    let y = if corner.matches_top() {
        area.position.y
    } else {
        area.position.y + height - banner_height
    };

    PhysicalPosition::new(x, y)
}

fn screen_of(app: &AppHandle, wanted: Option<&str>) -> tauri::Result<Option<Monitor>> {
    let primary = app.primary_monitor()?;

    let Some(wanted) = wanted else {
        return Ok(primary);
    };

    let found = app
        .available_monitors()?
        .into_iter()
        .find(|screen| screen.name().is_some_and(|name| name == wanted));

    Ok(found.or(primary))
}

pub fn screens(app: &AppHandle) -> Vec<DisplayView> {
    let Ok(screens) = app.available_monitors() else {
        return Vec::new();
    };

    let primary = app.primary_monitor().ok().flatten();
    let primary = primary.as_ref().and_then(Monitor::name);

    screens
        .iter()
        .map(|screen| display_of(screen, screen.name() == primary))
        .collect()
}

pub fn display_of(screen: &Monitor, primary: bool) -> DisplayView {
    let size = screen.size().to_logical::<f64>(screen.scale_factor());

    DisplayView {
        name: screen.name().cloned(),
        width: size.width.round() as u32,
        height: size.height.round() as u32,
        primary,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_doubles::Desktop;
    use crate::test_doubles::FakeWindowManager;
    use crate::test_doubles::game_window;

    const SCALE: f64 = 1.0;

    fn work_area() -> PhysicalRect<i32, u32> {
        PhysicalRect {
            position: PhysicalPosition::new(1920, 0),
            size: PhysicalSize::new(1920, 1040),
        }
    }

    fn banner() -> PhysicalSize<u32> {
        PhysicalSize::from_logical(LogicalSize::new(WIDTH, HEIGHT), SCALE)
    }

    #[test]
    fn the_banner_only_shows_itself_over_a_window_of_the_game() {
        let windows = FakeWindowManager::showing(Desktop {
            foreground: Some(game_window(1, "Alpha")),
            ..Desktop::default()
        });

        assert!(matches_inside_game(windows.as_ref()));

        windows.show(Desktop::default());

        assert!(
            !matches_inside_game(windows.as_ref()),
            "the player left the game, so the banner has nothing to sit on"
        );
    }

    #[test]
    fn a_corner_is_taken_on_the_screen_it_was_chosen_on() {
        let placed = corner_of(&work_area(), banner(), BannerCorner::TopLeft);

        assert_eq!(placed, PhysicalPosition::new(1920, 0));
    }

    #[test]
    fn the_far_corners_leave_room_for_the_banner_itself() {
        let area = work_area();
        let size = banner();

        assert_eq!(
            corner_of(&area, size, BannerCorner::BottomRight),
            PhysicalPosition::new(1920 + 1920 - 250, 1040 - 64)
        );
        assert_eq!(
            corner_of(&area, size, BannerCorner::TopRight),
            PhysicalPosition::new(1920 + 1920 - 250, 0)
        );
        assert_eq!(
            corner_of(&area, size, BannerCorner::BottomLeft),
            PhysicalPosition::new(1920, 1040 - 64)
        );
    }

    #[test]
    fn the_work_area_is_what_keeps_the_banner_off_the_taskbar() {
        let whole_screen = PhysicalRect {
            position: PhysicalPosition::new(0, 0),
            size: PhysicalSize::new(1920, 1080),
        };
        let above_taskbar = corner_of(&work_area(), banner(), BannerCorner::BottomLeft);
        let over_taskbar = corner_of(&whole_screen, banner(), BannerCorner::BottomLeft);

        assert!(above_taskbar.y < over_taskbar.y);
    }
}
