use std::sync::Mutex;
use std::time::Duration;

use serde::Deserialize;
use tauri::AppHandle;
use tauri::LogicalPosition;
use tauri::LogicalSize;
use tauri::Manager;
use tauri::Rect;
use tauri::Url;
use tauri::Webview;
use tauri::WebviewBuilder;
use tauri::WebviewUrl;
use tauri::Window;
use tauri::WindowBuilder;
use tauri::webview::NewWindowResponse;
use tauri::webview::PageLoadEvent;

use crate::app::alarm::Alarm;
use crate::app::journal::JournalEvent;
use crate::app::journal::Work;
use crate::app::overlay::Generation;
use crate::app::overlay::Hand;
use crate::app::overlay::Motion;
use crate::app::overlay::Overlay;
use crate::app::overlay::held;
use crate::app::overlay::matches_full_screen;
use crate::app::overlay::screen_under;
use crate::app::overlay::stacked_above;
use crate::app::panics;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::config::CompanionSite;
use crate::config::Language;
use crate::platform::Keyboard;
use crate::platform::PlatformError;
use crate::platform::ScreenFrame;
use crate::platform::ScreenPoint;
use crate::platform::WindowId;

const OVERLAY: Overlay = Overlay {
    label: "companion",
    page: "companion.html",
    thread: "multifus-companion",
    work: Work::Companion,
    failed: |detail| JournalEvent::CompanionFailed { detail },
    accepts_first_mouse: true,
    keyboard: Keyboard::LentOnClick,
};

const FRAME: &str = "companion-frame";

const SITE: &str = "companion-site";

const ASLEEP: &str = "location.replace('about:blank')";

const FIRST_SIZE: LogicalSize<f64> = LogicalSize {
    width: 480.0,
    height: 720.0,
};

const MARGIN: f64 = 24.0;

const NARROWEST: f64 = 320.0;

const SHORTEST: f64 = 240.0;

const WIDEST_INSET: f64 = 120.0;

const GUESSED_HOLE: Hole = Hole {
    top: 38.0,
    right: 1.0,
    bottom: 18.0,
    left: 1.0,
};

static NEXT_FOLLOW: Alarm = Alarm::new();

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
pub struct Hole {
    top: f64,
    right: f64,
    bottom: f64,
    left: f64,
}

impl Default for Hole {
    fn default() -> Self {
        GUESSED_HOLE
    }
}

impl Hole {
    fn matches_plausible(self) -> bool {
        [self.top, self.right, self.bottom, self.left]
            .into_iter()
            .all(|inset| inset.is_finite() && (0.0..=WIDEST_INSET).contains(&inset))
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct Placement {
    offset: LogicalPosition<f64>,
    size: LogicalSize<f64>,
}

impl Placement {
    fn beside(frame: ScreenFrame) -> Self {
        let height = FIRST_SIZE
            .height
            .min(frame.height - 2.0 * MARGIN)
            .max(SHORTEST);

        Self {
            offset: LogicalPosition::new(
                (frame.width - FIRST_SIZE.width - MARGIN).max(0.0),
                (frame.height - height) / 2.0,
            ),
            size: LogicalSize::new(FIRST_SIZE.width, height),
        }
    }

    fn moved(self, by_x: f64, by_y: f64) -> Self {
        Self {
            offset: LogicalPosition::new(self.offset.x + by_x, self.offset.y + by_y),
            ..self
        }
    }

    fn stretched(self, by_x: f64, by_y: f64) -> Self {
        Self {
            size: LogicalSize::new(
                (self.size.width + by_x).max(NARROWEST),
                (self.size.height + by_y).max(SHORTEST),
            ),
            ..self
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct Posed {
    from: ScreenPoint,
    placement: Placement,
    hole: Hole,
}

impl Posed {
    fn at(self) -> LogicalPosition<f64> {
        LogicalPosition::new(
            self.from.x + self.placement.offset.x,
            self.from.y + self.placement.offset.y,
        )
    }

    fn site_bounds(self) -> (LogicalPosition<f64>, LogicalSize<f64>) {
        let Self {
            placement, hole, ..
        } = self;

        (
            LogicalPosition::new(hole.left, hole.top),
            LogicalSize::new(
                (placement.size.width - hole.left - hole.right).max(0.0),
                (placement.size.height - hole.top - hole.bottom).max(0.0),
            ),
        )
    }

    fn matches_same_shape(self, other: Self) -> bool {
        self.placement.size == other.placement.size && self.hole == other.hole
    }
}

#[derive(Debug, PartialEq, Eq)]
enum Strike {
    Open,
    Carry,
    Close,
}

fn strike(carrier: Option<WindowId>, here: WindowId) -> Strike {
    match carrier {
        None => Strike::Open,
        Some(carrier) if carrier == here => Strike::Close,
        Some(_) => Strike::Carry,
    }
}

#[derive(Debug, Default)]
struct Companion {
    carrier: Mutex<Option<WindowId>>,
    placement: Mutex<Option<Placement>>,
    left_on: Mutex<Option<Url>>,
    hole: Mutex<Hole>,
    posed: Mutex<Option<Posed>>,
    posing: Mutex<()>,
    motion: Motion,
    hand: Hand,
    generation: Generation,
}

impl Companion {
    fn carrier(&self) -> Option<WindowId> {
        *held(&self.carrier)
    }

    fn lay(&self, carrier: Option<WindowId>) -> u64 {
        *held(&self.carrier) = carrier;

        self.hand.let_go();

        self.generation.next()
    }
}

fn home(site: CompanionSite, language: Language) -> tauri::Result<Url> {
    let address = match (site, language) {
        (CompanionSite::DofusRetroTools, Language::Fr) => "https://dofusretrotools.com/",
        (CompanionSite::DofusRetroTools, Language::En) => "https://dofusretrotools.com/en",
        (CompanionSite::DofusRetroTools, Language::Es) => "https://dofusretrotools.com/es",
        (CompanionSite::Solomonk, Language::Fr) => "https://solomonk.fr/fr/",
        (CompanionSite::Solomonk, Language::En) => "https://solomonk.fr/en/",
        (CompanionSite::Solomonk, Language::Es) => "https://solomonk.fr/es/",
    };

    Url::parse(address).map_err(tauri::Error::InvalidUrl)
}

fn chosen_home(app: &AppHandle) -> tauri::Result<Url> {
    let state = lock(app);

    home(state.companion_site(), state.language())
}

pub fn setup(app: &AppHandle) {
    app.manage(Companion::default());
}

pub fn toggle(app: &AppHandle, here: WindowId) {
    match strike(app.state::<Companion>().carrier(), here) {
        Strike::Open => open_on(app, here),
        Strike::Carry => carry_to(app, here),
        Strike::Close => close(app),
    }
}

fn open_on(app: &AppHandle, here: WindowId) {
    let opened = match app.get_webview(SITE) {
        Some(site) => wake(app, &site),
        None => built(app),
    };

    match opened {
        Ok(()) => carry_to(app, here),
        Err(error) => OVERLAY.complain(app, error.to_string()),
    }
}

fn carry_to(app: &AppHandle, here: WindowId) {
    let generation = app.state::<Companion>().lay(Some(here));

    follow(app);
    follow_apart(app, generation);
}

pub fn close(app: &AppHandle) {
    let companion = app.state::<Companion>();

    companion.lay(None);

    let _posing = held(&companion.posing);

    put_to_sleep(app);
}

fn put_to_sleep(app: &AppHandle) {
    if let Some(site) = app.get_webview(SITE) {
        if let Some(page) = site.url().ok().filter(matches_awake) {
            *held(&app.state::<Companion>().left_on) = Some(page);
        }

        OVERLAY.said(app, site.eval(ASLEEP));
    }

    veil(app);
}

fn wake(app: &AppHandle, site: &Webview) -> tauri::Result<()> {
    site.hide()?;
    site.eval(awake_on(&first_page(app)?))
}

fn matches_awake(page: &Url) -> bool {
    page.scheme() != "about"
}

fn awake_on(page: &Url) -> String {
    format!(
        "location.replace({})",
        serde_json::Value::from(page.as_str())
    )
}

pub fn choose(app: &AppHandle, site: CompanionSite) {
    {
        let mut state = lock(app);

        state.set_companion_site(site);
        state.save();
    }

    start_over(app);
}

pub fn follow_language(app: &AppHandle) {
    if let Some(frame) = app.get_webview(FRAME) {
        OVERLAY.said(app, frame.reload());
    }

    start_over(app);
}

fn start_over(app: &AppHandle) {
    let companion = app.state::<Companion>();

    *held(&companion.left_on) = None;

    if companion.carrier().is_some() {
        go_home(app);
    }
}

pub fn go_home(app: &AppHandle) {
    let Some(site) = app.get_webview(SITE) else {
        return;
    };

    OVERLAY.said(app, chosen_home(app).and_then(|url| site.navigate(url)));
}

pub fn go_back(app: &AppHandle) {
    let Some(site) = app.get_webview(SITE) else {
        return;
    };

    OVERLAY.said(app, site.eval("history.back()"));
}

pub fn note_windows() {
    NEXT_FOLLOW.wake();
}

pub fn note_drag(app: &AppHandle) {
    app.state::<Companion>().motion.stir_waking(&NEXT_FOLLOW);
}

fn follow_apart(app: &AppHandle, generation: u64) {
    OVERLAY.apart(app, move |app| {
        let companion = app.state::<Companion>();

        loop {
            NEXT_FOLLOW.wait(Duration::ZERO, companion.motion.pace());

            if !companion.generation.matches_latest(generation) || companion.carrier().is_none() {
                return;
            }

            let before = *held(&companion.posed);

            follow(app);

            if *held(&companion.posed) != before {
                companion.motion.stir();
            }
        }
    });
}

fn follow(app: &AppHandle) {
    let companion = app.state::<Companion>();

    if companion.hand.matches_holding() {
        return;
    }

    let _posing = held(&companion.posing);

    if let Err(detail) = panics::guard(|| follow_carrier(app)) {
        lock(app).log_unless_repeated(JournalEvent::Panicked {
            work: Work::Companion,
            detail,
        });
    }
}

fn follow_carrier(app: &AppHandle) {
    let Some(carrier) = app.state::<Companion>().carrier() else {
        return;
    };

    match windows(app).window_frame(carrier) {
        Ok(Some(frame)) if matches_on_full_screen(app, frame) => veil(app),
        Ok(Some(frame)) => {
            pose_on(app, frame);
            stack_above(app, carrier);
        }
        Ok(None) => veil(app),
        Err(PlatformError::WindowGone) => {
            app.state::<Companion>().lay(None);
            put_to_sleep(app);
        }
        Err(error) => {
            OVERLAY.complain(app, error.to_string());
            veil(app);
        }
    }
}

fn matches_on_full_screen(app: &AppHandle, frame: ScreenFrame) -> bool {
    screen_under(app, frame).is_some_and(|screen| matches_full_screen(frame, screen))
}

fn pose_on(app: &AppHandle, frame: ScreenFrame) {
    let companion = app.state::<Companion>();
    let placement = *held(&companion.placement).get_or_insert_with(|| Placement::beside(frame));
    let hole = *held(&companion.hole);

    pose(
        app,
        Posed {
            from: frame.origin,
            placement,
            hole,
        },
    );
}

fn pose(app: &AppHandle, wanted: Posed) {
    let Some(window) = app.get_window(OVERLAY.label) else {
        return;
    };

    let companion = app.state::<Companion>();
    let last_posed = *held(&companion.posed);
    let is_visible = window.is_visible().unwrap_or(false);

    if is_visible && last_posed == Some(wanted) {
        return;
    }

    let shown = laid(app, &window, wanted, last_posed).and_then(|()| {
        if is_visible {
            Ok(())
        } else {
            OVERLAY.show(app, &window)
        }
    });

    *held(&companion.posed) = shown.is_ok().then_some(wanted);

    OVERLAY.said(app, shown);
}

fn laid(
    app: &AppHandle,
    window: &Window,
    wanted: Posed,
    last_posed: Option<Posed>,
) -> tauri::Result<()> {
    if !last_posed.is_some_and(|last| last.matches_same_shape(wanted)) {
        reshape(app, window, wanted)?;
    }

    window.set_position(wanted.at())
}

fn reshape(app: &AppHandle, window: &Window, posed: Posed) -> tauri::Result<()> {
    let size = posed.placement.size;

    window.set_size(size)?;

    if let Some(frame) = app.get_webview(FRAME) {
        frame.set_bounds(Rect {
            position: LogicalPosition::new(0.0, 0.0).into(),
            size: size.into(),
        })?;
    }

    if let Some(site) = app.get_webview(SITE) {
        let (position, size) = posed.site_bounds();

        site.set_bounds(Rect {
            position: position.into(),
            size: size.into(),
        })?;
    }

    Ok(())
}

fn stack_above(app: &AppHandle, carrier: WindowId) {
    let Some(window) = app.get_window(OVERLAY.label) else {
        return;
    };

    let stacked = app.run_on_main_thread({
        let app = app.clone();

        move || {
            if app.state::<Companion>().carrier() != Some(carrier) {
                return;
            }

            if let Err(detail) = stacked_above(&window, carrier) {
                OVERLAY.complain(&app, detail);
            }
        }
    });

    OVERLAY.said(app, stacked);
}

fn veil(app: &AppHandle) {
    let Some(window) = app.get_window(OVERLAY.label) else {
        return;
    };

    *held(&app.state::<Companion>().posed) = None;

    if window.is_visible().unwrap_or(false) {
        OVERLAY.said(app, window.hide());
    }
}

pub fn shift(app: &AppHandle, by_x: f64, by_y: f64) {
    if by_x.is_finite() && by_y.is_finite() {
        rearrange(app, |placement| placement.moved(by_x, by_y));
    }
}

pub fn stretch(app: &AppHandle, by_x: f64, by_y: f64) {
    if by_x.is_finite() && by_y.is_finite() {
        rearrange(app, |placement| placement.stretched(by_x, by_y));
    }
}

fn rearrange(app: &AppHandle, change: impl FnOnce(Placement) -> Placement) {
    let companion = app.state::<Companion>();

    let (Some(posed), Some(placement)) = (*held(&companion.posed), *held(&companion.placement))
    else {
        return;
    };

    let Some(window) = app.get_window(OVERLAY.label) else {
        return;
    };

    companion.hand.take();

    let wanted = Posed {
        placement: change(placement),
        ..posed
    };
    let rearranged = laid(app, &window, wanted, Some(posed));

    if rearranged.is_ok() {
        *held(&companion.posed) = Some(wanted);
        *held(&companion.placement) = Some(wanted.placement);
    }

    OVERLAY.said(app, rearranged);
}

pub fn settled(app: &AppHandle) {
    app.state::<Companion>().hand.let_go();
}

pub fn measured(app: &AppHandle, hole: Hole) {
    if !hole.matches_plausible() {
        return;
    }

    {
        let companion = app.state::<Companion>();
        let mut kept = held(&companion.hole);

        if *kept == hole {
            return;
        }

        *kept = hole;
    }

    follow(app);
}

fn built(app: &AppHandle) -> tauri::Result<()> {
    match build_window(app) {
        Ok(window) => {
            OVERLAY.hold_back_activation(app, window);

            Ok(())
        }
        Err(error) => {
            if let Some(window) = app.get_window(OVERLAY.label) {
                OVERLAY.said(app, window.destroy());
            }

            Err(error)
        }
    }
}

fn build_window(app: &AppHandle) -> tauri::Result<Window> {
    let window = WindowBuilder::new(app, OVERLAY.label)
        .title("Multifus")
        .inner_size(FIRST_SIZE.width, FIRST_SIZE.height)
        .decorations(false)
        .transparent(true)
        .skip_taskbar(true)
        .focusable(OVERLAY.lends_keyboard())
        .focused(false)
        .resizable(false)
        .shadow(false)
        .visible(false)
        .visible_on_all_workspaces(true)
        .build()?;

    let corner = LogicalPosition::new(0.0, 0.0);
    let frame = WebviewBuilder::new(FRAME, WebviewUrl::App(OVERLAY.page.into()))
        .transparent(true)
        .focused(false)
        .accept_first_mouse(OVERLAY.accepts_first_mouse);

    window.add_child(frame, corner, FIRST_SIZE)?;

    let site = WebviewBuilder::new(SITE, WebviewUrl::External(first_page(app)?))
        .focused(false)
        .accept_first_mouse(OVERLAY.accepts_first_mouse)
        .general_autofill_enabled(false)
        .on_new_window({
            let app = app.clone();

            move |url, _features| {
                if let Some(site) = app.get_webview(SITE) {
                    OVERLAY.said(&app, site.navigate(url));
                }

                NewWindowResponse::Deny
            }
        })
        .on_page_load(|site, loaded| {
            if loaded.event() == PageLoadEvent::Finished && matches_awake(loaded.url()) {
                OVERLAY.said(site.app_handle(), site.show());
            }
        });

    window.add_child(site, corner, FIRST_SIZE)?.hide()?;

    Ok(window)
}

fn first_page(app: &AppHandle) -> tauri::Result<Url> {
    let left_on = held(&app.state::<Companion>().left_on).take();

    match left_on {
        Some(page) => Ok(page),
        None => chosen_home(app),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn frame() -> ScreenFrame {
        ScreenFrame {
            origin: ScreenPoint { x: 100.0, y: 60.0 },
            width: 1280.0,
            height: 800.0,
        }
    }

    fn placement() -> Placement {
        Placement {
            offset: LogicalPosition::new(40.0, 30.0),
            size: LogicalSize::new(480.0, 640.0),
        }
    }

    fn hole() -> Hole {
        Hole {
            top: 38.0,
            right: 1.0,
            bottom: 18.0,
            left: 1.0,
        }
    }

    fn posed() -> Posed {
        Posed {
            from: frame().origin,
            placement: placement(),
            hole: hole(),
        }
    }

    fn here() -> WindowId {
        WindowId::from_raw(1)
    }

    fn there() -> WindowId {
        WindowId::from_raw(2)
    }

    fn home_of(site: CompanionSite, language: Language) -> Option<String> {
        home(site, language).ok().map(String::from)
    }

    #[test]
    fn both_sites_open_their_home_page_in_the_language_of_multifus() {
        assert_eq!(
            Language::ALL.map(|language| home_of(CompanionSite::DofusRetroTools, language)),
            [
                Some("https://dofusretrotools.com/".to_owned()),
                Some("https://dofusretrotools.com/en".to_owned()),
                Some("https://dofusretrotools.com/es".to_owned()),
            ],
            "French is the language of the site without a prefix"
        );
        assert_eq!(
            Language::ALL.map(|language| home_of(CompanionSite::Solomonk, language)),
            [
                Some("https://solomonk.fr/fr/".to_owned()),
                Some("https://solomonk.fr/en/".to_owned()),
                Some("https://solomonk.fr/es/".to_owned()),
            ]
        );
    }

    #[test]
    fn a_page_put_to_sleep_wakes_on_the_address_it_was_left_on_whatever_it_holds() {
        let page = Url::parse("https://solomonk.fr/fr/panoplie/l'anneau").expect("a page");

        assert_eq!(
            awake_on(&page),
            r#"location.replace("https://solomonk.fr/fr/panoplie/l'anneau")"#,
            "an address is handed to the page as a string, never as code"
        );
    }

    #[test]
    fn a_page_put_to_sleep_is_never_the_page_the_player_left() {
        assert!(!matches_awake(&Url::parse("about:blank").expect("a page")));
        assert!(
            matches_awake(&Url::parse("https://dofusretrotools.com/").expect("a page")),
            "a site closed twice must not wake on a blank page"
        );
    }

    #[test]
    fn the_shortcut_opens_the_site_carries_it_to_another_client_or_closes_it() {
        assert_eq!(strike(None, here()), Strike::Open);
        assert_eq!(
            strike(Some(here()), here()),
            Strike::Close,
            "struck again from the client that carries it, the site goes away"
        );
        assert_eq!(
            strike(Some(there()), here()),
            Strike::Carry,
            "struck from another client, the site comes to the character in front of the player"
        );
    }

    #[test]
    fn the_first_opening_leans_on_the_right_edge_of_the_game_and_leaves_the_middle_free() {
        assert_eq!(
            Placement::beside(frame()),
            Placement {
                offset: LogicalPosition::new(776.0, 40.0),
                size: FIRST_SIZE,
            },
            "the character stands in the middle of the map"
        );
    }

    #[test]
    fn a_small_client_gets_a_site_as_tall_as_it_is() {
        let small = ScreenFrame {
            height: 600.0,
            ..frame()
        };

        assert_eq!(Placement::beside(small).size.height, 552.0);
        assert_eq!(
            Placement::beside(ScreenFrame {
                height: 200.0,
                ..frame()
            })
            .size
            .height,
            SHORTEST,
            "a site shorter than this is no longer worth reading"
        );
    }

    #[test]
    fn a_narrow_client_keeps_the_site_on_its_left_edge_rather_than_past_it() {
        let narrow = ScreenFrame {
            width: 400.0,
            ..frame()
        };

        assert!(Placement::beside(narrow).offset.x.abs() < f64::EPSILON);
    }

    #[test]
    fn the_site_sits_at_its_offset_from_the_corner_of_the_window_of_the_game() {
        assert_eq!(posed().at(), LogicalPosition::new(140.0, 90.0));
    }

    #[test]
    fn a_drag_moves_the_site_and_keeps_its_size() {
        assert_eq!(
            placement().moved(25.0, -10.0),
            Placement {
                offset: LogicalPosition::new(65.0, 20.0),
                ..placement()
            }
        );
    }

    #[test]
    fn the_grip_grows_the_site_from_its_bottom_right_corner() {
        assert_eq!(
            placement().stretched(60.0, 100.0),
            Placement {
                size: LogicalSize::new(540.0, 740.0),
                ..placement()
            },
            "the corner held by the hand moves, the top left one stays"
        );
    }

    #[test]
    fn the_grip_stops_where_the_site_would_be_too_small_to_read() {
        assert_eq!(
            placement().stretched(-1000.0, -1000.0).size,
            LogicalSize::new(NARROWEST, SHORTEST)
        );
    }

    #[test]
    fn the_site_fills_the_hole_the_frame_leaves_for_it() {
        assert_eq!(
            posed().site_bounds(),
            (
                LogicalPosition::new(1.0, 38.0),
                LogicalSize::new(478.0, 584.0)
            )
        );
    }

    #[test]
    fn a_drag_keeps_the_shape_and_a_stretch_changes_it() {
        let moved = Posed {
            placement: placement().moved(10.0, 10.0),
            ..posed()
        };
        let stretched = Posed {
            placement: placement().stretched(10.0, 10.0),
            ..posed()
        };

        assert!(
            moved.matches_same_shape(posed()),
            "a drag only moves the window, and the two webviews ride along"
        );
        assert!(!stretched.matches_same_shape(posed()));
        assert!(
            !Posed {
                hole: Hole {
                    top: 48.0,
                    ..hole()
                },
                ..posed()
            }
            .matches_same_shape(posed()),
            "a frame that measures itself again moves the site inside it"
        );
    }

    #[test]
    fn a_hole_nobody_could_have_measured_is_turned_away() {
        assert!(hole().matches_plausible());
        assert!(
            !Hole {
                top: -1.0,
                ..hole()
            }
            .matches_plausible()
        );
        assert!(
            !Hole {
                bottom: f64::NAN,
                ..hole()
            }
            .matches_plausible()
        );
        assert!(
            !Hole {
                left: WIDEST_INSET + 1.0,
                ..hole()
            }
            .matches_plausible(),
            "a frame thicker than this is a measure that went wrong"
        );
    }

    #[test]
    fn a_new_opening_takes_the_site_out_of_a_hand_that_never_let_go() {
        let companion = Companion::default();

        companion.hand.take();
        companion.lay(Some(here()));

        assert!(
            !companion.hand.matches_holding(),
            "a page that dies mid drag must not freeze the following for good"
        );
    }

    #[test]
    fn the_site_opened_on_a_window_stays_on_that_one_until_it_is_closed() {
        let companion = Companion::default();

        assert_eq!(companion.carrier(), None);

        let first = companion.lay(Some(here()));

        assert_eq!(companion.carrier(), Some(here()));

        let second = companion.lay(None);

        assert_eq!(companion.carrier(), None);
        assert!(
            !companion.generation.matches_latest(first),
            "the thread of the first opening has nothing left to follow"
        );
        assert!(companion.generation.matches_latest(second));
    }
}
