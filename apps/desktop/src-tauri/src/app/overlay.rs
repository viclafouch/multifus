use std::ffi::c_void;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::AtomicU64;
use std::sync::atomic::Ordering;
use std::thread;
use std::time::Duration;
use std::time::Instant;

use tauri::AppHandle;
use tauri::EventTarget;
use tauri::LogicalSize;
use tauri::Manager;
use tauri::Monitor;
use tauri::WebviewUrl;
use tauri::WebviewWindow;
use tauri::WebviewWindowBuilder;
use tauri::Window;

use crate::app::alarm::Alarm;
use crate::app::journal::JournalEvent;
use crate::app::journal::Work;
use crate::app::panics;
use crate::app::state::lock;
use crate::platform;
use crate::platform::Keyboard;
use crate::platform::PlatformError;
use crate::platform::ScreenFrame;
use crate::platform::WindowId;

const FOLLOW: Duration = Duration::from_millis(100);

const FOLLOW_IN_MOTION: Duration = Duration::from_millis(16);

const MOTION_LINGERS: Duration = Duration::from_millis(500);

const EDGE_GRAIN: f64 = 1.0;

#[derive(Debug, Default)]
pub struct Generation {
    latest: AtomicU64,
}

impl Generation {
    pub fn next(&self) -> u64 {
        self.latest.fetch_add(1, Ordering::AcqRel) + 1
    }

    pub fn matches_latest(&self, generation: u64) -> bool {
        self.latest.load(Ordering::Acquire) == generation
    }
}

#[derive(Debug, Default)]
pub struct Acknowledged {
    seen: AtomicU64,
}

impl Acknowledged {
    pub fn acknowledge(&self, generation: u64) {
        self.seen.fetch_max(generation, Ordering::AcqRel);
    }

    pub fn matches_acknowledged(&self, generation: u64) -> bool {
        self.seen.load(Ordering::Acquire) >= generation
    }
}

pub fn held<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

#[derive(Debug, Default)]
pub struct Hand {
    holding: AtomicBool,
}

impl Hand {
    pub fn take(&self) {
        self.holding.store(true, Ordering::Release);
    }

    pub fn let_go(&self) {
        self.holding.store(false, Ordering::Release);
    }

    pub fn matches_holding(&self) -> bool {
        self.holding.load(Ordering::Acquire)
    }
}

#[derive(Debug, Default)]
pub struct Motion {
    stirred_at: Mutex<Option<Instant>>,
}

impl Motion {
    pub fn stir(&self) {
        *held(&self.stirred_at) = Some(Instant::now());
    }

    pub fn stir_waking(&self, alarm: &Alarm) {
        let was_still = self.matches_still();

        self.stir();

        if was_still {
            alarm.wake();
        }
    }

    pub fn pace(&self) -> Duration {
        pace(self.since_stirred())
    }

    fn matches_still(&self) -> bool {
        self.pace() == FOLLOW
    }

    fn since_stirred(&self) -> Duration {
        held(&self.stirred_at).map_or(Duration::MAX, |stirred_at| stirred_at.elapsed())
    }
}

fn pace(since_stirred: Duration) -> Duration {
    if since_stirred < MOTION_LINGERS {
        FOLLOW_IN_MOTION
    } else {
        FOLLOW
    }
}

#[must_use]
pub fn holds_point(edge: f64, room: f64, at: f64) -> bool {
    at >= edge && at < edge + room
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Screen {
    pub area: WorkArea,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WorkArea {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

pub fn screen_under(app: &AppHandle, frame: ScreenFrame) -> Option<Screen> {
    let screens = app.available_monitors().ok()?;
    let middle_x = frame.origin.x + frame.width / 2.0;
    let middle_y = frame.origin.y + frame.height / 2.0;

    let under = screens
        .into_iter()
        .filter_map(|screen| logical_screen(&screen))
        .find(|screen| {
            holds_point(screen.area.x, screen.area.width, middle_x)
                && holds_point(screen.area.y, screen.area.height, middle_y)
        });

    under.or_else(|| {
        app.primary_monitor()
            .ok()
            .flatten()
            .and_then(|screen| logical_screen(&screen))
    })
}

fn logical_screen(screen: &Monitor) -> Option<Screen> {
    let scale = screen.scale_factor();

    if !scale.is_finite() || scale <= 0.0 {
        return None;
    }

    let area = screen.work_area();
    let at = screen.position();
    let whole = screen.size();

    Some(Screen {
        area: WorkArea {
            x: f64::from(area.position.x) / scale,
            y: f64::from(area.position.y) / scale,
            width: f64::from(area.size.width) / scale,
            height: f64::from(area.size.height) / scale,
        },
        x: f64::from(at.x) / scale,
        y: f64::from(at.y) / scale,
        width: f64::from(whole.width) / scale,
        height: f64::from(whole.height) / scale,
    })
}

#[must_use]
pub fn matches_full_screen(frame: ScreenFrame, screen: Screen) -> bool {
    matches_same_edge(frame.origin.x, screen.x)
        && matches_same_edge(frame.origin.y, screen.y)
        && matches_same_edge(frame.width, screen.width)
        && matches_same_edge(frame.height, screen.height)
}

fn matches_same_edge(one: f64, other: f64) -> bool {
    (one - other).abs() <= EDGE_GRAIN
}

#[cfg(target_os = "windows")]
pub fn native_handle(window: &Window) -> tauri::Result<*mut c_void> {
    Ok(window.hwnd()?.0)
}

#[cfg(target_os = "macos")]
pub fn native_handle(window: &Window) -> tauri::Result<*mut c_void> {
    window.ns_window()
}

pub fn stacked_above(overlay: &Window, carrier: WindowId) -> Result<(), String> {
    let handle = native_handle(overlay).map_err(|error| error.to_string())?;

    match platform::lay_above(handle, carrier) {
        Ok(()) | Err(PlatformError::WindowGone) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

pub struct Overlay {
    pub label: &'static str,
    pub page: &'static str,
    pub thread: &'static str,
    pub work: Work,
    pub failed: fn(String) -> JournalEvent,
    pub accepts_first_mouse: bool,
    pub keyboard: Keyboard,
}

impl Overlay {
    pub fn target(&self) -> EventTarget {
        EventTarget::webview_window(self.label)
    }

    pub fn window(&self, app: &AppHandle) -> Option<WebviewWindow> {
        app.get_webview_window(self.label)
    }

    pub fn said(&self, app: &AppHandle, told: tauri::Result<()>) {
        if let Err(error) = told {
            self.complain(app, error.to_string());
        }
    }

    pub fn complain(&self, app: &AppHandle, detail: String) {
        lock(app).log_unless_repeated((self.failed)(detail));
    }

    pub fn build(&self, app: &AppHandle, size: LogicalSize<f64>) -> Option<WebviewWindow> {
        if let Some(window) = self.window(app) {
            return Some(window);
        }

        let built = WebviewWindowBuilder::new(app, self.label, WebviewUrl::App(self.page.into()))
            .title("Multifus")
            .inner_size(size.width, size.height)
            .decorations(false)
            .transparent(true)
            .always_on_top(true)
            .skip_taskbar(true)
            .focusable(self.lends_keyboard())
            .focused(false)
            .accept_first_mouse(self.accepts_first_mouse)
            .resizable(false)
            .shadow(false)
            .visible(false)
            .visible_on_all_workspaces(true)
            .build();

        match built {
            Ok(window) => Some(window),
            Err(error) => {
                self.complain(app, error.to_string());

                None
            }
        }
    }

    pub fn lends_keyboard(&self) -> bool {
        self.keyboard == Keyboard::LentOnClick
    }

    #[cfg(target_os = "macos")]
    pub fn hold_back_activation(&'static self, app: &AppHandle, window: Window) {
        let keyboard = self.keyboard;
        let held_back = self.through_the_handle(app, window, move |handle| {
            platform::hold_back_activation(handle, keyboard)
        });

        self.said(app, held_back);
    }

    #[cfg(not(target_os = "macos"))]
    pub fn hold_back_activation(&'static self, _app: &AppHandle, _window: Window) {}

    #[cfg(target_os = "macos")]
    pub fn show(&'static self, app: &AppHandle, window: &Window) -> tauri::Result<()> {
        if !self.lends_keyboard() {
            return window.show();
        }

        self.through_the_handle(app, window.clone(), platform::show_without_keyboard)
    }

    #[cfg(not(target_os = "macos"))]
    pub fn show(&'static self, _app: &AppHandle, window: &Window) -> tauri::Result<()> {
        window.show()
    }

    #[cfg(target_os = "macos")]
    fn through_the_handle(
        &'static self,
        app: &AppHandle,
        window: Window,
        work: impl FnOnce(*mut c_void) -> platform::Result<()> + Send + 'static,
    ) -> tauri::Result<()> {
        app.run_on_main_thread({
            let app = app.clone();

            move || {
                let done = native_handle(&window)
                    .map_err(|error| error.to_string())
                    .and_then(|handle| work(handle).map_err(|error| error.to_string()));

                if let Err(detail) = done {
                    self.complain(&app, detail);
                }
            }
        })
    }

    pub fn apart(&self, app: &AppHandle, work: impl FnOnce(&AppHandle) + Send + 'static) -> bool {
        let panicked = self.work;
        let spawned = thread::Builder::new().name(self.thread.to_owned()).spawn({
            let app = app.clone();

            move || {
                if let Err(detail) = panics::guard(|| work(&app)) {
                    lock(&app).log_unless_repeated(JournalEvent::Panicked {
                        work: panicked,
                        detail,
                    });
                }
            }
        });

        if let Err(error) = spawned {
            self.complain(app, error.to_string());

            return false;
        }

        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::platform::ScreenPoint;

    fn work_area() -> WorkArea {
        WorkArea {
            x: 0.0,
            y: 0.0,
            width: 1920.0,
            height: 1040.0,
        }
    }

    fn screen() -> Screen {
        Screen {
            area: work_area(),
            x: 0.0,
            y: 0.0,
            width: 1920.0,
            height: 1080.0,
        }
    }

    #[test]
    fn a_client_that_fills_the_whole_screen_carries_no_overlay() {
        let filling = ScreenFrame {
            origin: ScreenPoint { x: 0.0, y: 0.0 },
            width: 1920.0,
            height: 1080.0,
        };

        assert!(matches_full_screen(filling, screen()));
    }

    #[test]
    fn a_client_grown_to_the_work_area_still_carries_the_overlay() {
        let grown_wide = ScreenFrame {
            origin: ScreenPoint { x: 0.0, y: 0.0 },
            width: 1920.0,
            height: 1040.0,
        };

        assert!(
            !matches_full_screen(grown_wide, screen()),
            "a window grown to the work area is not a window in full screen"
        );
    }

    #[test]
    fn a_screen_that_reserves_nothing_still_reads_a_client_in_full_screen() {
        let bare = Screen {
            area: WorkArea {
                x: 0.0,
                y: 0.0,
                width: 1920.0,
                height: 1080.0,
            },
            ..screen()
        };
        let filling = ScreenFrame {
            origin: ScreenPoint { x: 0.0, y: 0.0 },
            width: 1920.0,
            height: 1080.0,
        };

        assert!(
            matches_full_screen(filling, bare),
            "a taskbar that hides itself reserves nothing, and the client is in full screen all the same"
        );
    }

    #[test]
    fn a_client_grown_past_the_edges_of_the_screen_still_carries_the_overlay() {
        let grown = ScreenFrame {
            origin: ScreenPoint { x: -8.0, y: -8.0 },
            width: 1936.0,
            height: 1056.0,
        };

        assert!(
            !matches_full_screen(grown, screen()),
            "a window grown on Windows hangs over the screen by its invisible border"
        );
    }

    #[test]
    fn a_client_on_the_second_screen_reads_against_that_screen() {
        let beside = Screen {
            x: 1920.0,
            y: 0.0,
            area: WorkArea {
                x: 1920.0,
                ..work_area()
            },
            ..screen()
        };
        let filling = ScreenFrame {
            origin: ScreenPoint { x: 1920.0, y: 0.0 },
            width: 1920.0,
            height: 1080.0,
        };

        assert!(matches_full_screen(filling, beside));
        assert!(
            !matches_full_screen(
                ScreenFrame {
                    origin: ScreenPoint { x: 0.0, y: 0.0 },
                    ..filling
                },
                beside
            ),
            "a client filling the first screen is not in full screen on the second"
        );
    }

    #[test]
    fn the_hand_on_an_overlay_holds_the_thread_that_follows_the_game() {
        let hand = Hand::default();

        assert!(!hand.matches_holding());

        hand.take();

        assert!(hand.matches_holding());

        hand.let_go();

        assert!(!hand.matches_holding());
    }

    #[test]
    fn a_first_stir_wakes_the_follower_and_the_next_ones_ride_along() {
        let motion = Motion::default();
        let alarm = Alarm::new();

        motion.stir_waking(&alarm);

        let woken = Instant::now();

        alarm.wait(Duration::ZERO, Duration::from_secs(1));

        assert!(
            woken.elapsed() < Duration::from_millis(500),
            "a hand that starts moving must not wait for the resting beat"
        );
    }

    #[test]
    fn an_overlay_nobody_stirred_follows_at_the_resting_pace() {
        let motion = Motion::default();

        assert_eq!(motion.pace(), FOLLOW);
        assert!(motion.matches_still());

        motion.stir();

        assert_eq!(motion.pace(), FOLLOW_IN_MOTION);
        assert!(!motion.matches_still());
    }

    #[test]
    fn an_overlay_follows_at_the_pace_of_the_screen_while_its_window_moves() {
        assert_eq!(pace(Duration::ZERO), FOLLOW_IN_MOTION);
        assert_eq!(
            pace(MOTION_LINGERS / 2),
            FOLLOW_IN_MOTION,
            "a hand that pauses mid drag must not find the overlay ten beats behind when it moves on"
        );
        assert_eq!(pace(MOTION_LINGERS), FOLLOW);
    }

    #[test]
    fn a_screen_holds_its_first_point_and_leaves_the_first_of_the_next_one() {
        assert!(holds_point(1920.0, 1920.0, 1920.0));
        assert!(!holds_point(1920.0, 1920.0, 3840.0));
        assert!(!holds_point(1920.0, 1920.0, 1919.0));
    }

    #[test]
    fn an_overlay_that_a_newer_one_replaced_no_longer_speaks_for_itself() {
        let generation = Generation::default();
        let first = generation.next();
        let second = generation.next();

        assert_ne!(first, second);
        assert!(generation.matches_latest(second));
        assert!(
            !generation.matches_latest(first),
            "the opening that was asked for first must not close the one showing now"
        );
    }

    #[test]
    fn an_acknowledgement_stands_for_every_generation_before_it() {
        let wiped = Acknowledged::default();

        assert!(!wiped.matches_acknowledged(2));

        wiped.acknowledge(2);

        assert!(wiped.matches_acknowledged(2));
        assert!(
            wiped.matches_acknowledged(1),
            "a window wiped for a newer opening is wiped for the older one too"
        );
        assert!(!wiped.matches_acknowledged(3));
    }

    #[test]
    fn an_acknowledgement_that_arrives_late_does_not_undo_a_newer_one() {
        let wiped = Acknowledged::default();

        wiped.acknowledge(5);
        wiped.acknowledge(2);

        assert!(
            wiped.matches_acknowledged(5),
            "the answer of an older opening must not take the newer one back"
        );
    }
}
