use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::thread;
use std::time::Duration;

use tauri::AppHandle;
use tauri::Emitter;
use tauri::LogicalPosition;
use tauri::LogicalSize;
use tauri::Manager;
use tauri::Monitor;
use tauri::WebviewWindow;

use crate::app::journal::JournalEvent;
use crate::app::journal::Work;
use crate::app::main_window;
use crate::app::overlay::Generation;
use crate::app::overlay::Overlay;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::config::RuneOffset;
use crate::config::RUNE_TABLE_CLEAREST;
use crate::platform;
use crate::platform::ScreenFrame;
use crate::platform::ScreenPoint;
use crate::platform::WindowId;

const OVERLAY: Overlay = Overlay {
    label: "rune-table",
    page: "rune-table.html",
    thread: "multifus-rune-table",
    work: Work::RuneTable,
    failed: |detail| JournalEvent::RuneTableFailed { detail },
    accepts_first_mouse: true,
};

const LOOK_EVENT: &str = "multifus://rune-table-look";

const FOLLOW: Duration = Duration::from_millis(100);

const FIRST_MARGIN: f64 = 24.0;

const GUESSED_RATIO: f64 = 2.1;

const WILDEST_RATIO: f64 = 8.0;

const FAINTEST_LOOK: f64 = 0.2;

const RATIO_GRAIN: f64 = 1000.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Anchor {
    Anywhere,
    OnlyOn(WindowId),
    TheNextOne,
}

impl Anchor {
    fn taken_on(self, window: WindowId) -> Self {
        match self {
            Self::TheNextOne => Self::OnlyOn(window),
            held => held,
        }
    }

    fn holds(self, window: WindowId) -> bool {
        match self {
            Self::Anywhere => true,
            Self::OnlyOn(held) => held == window,
            Self::TheNextOne => false,
        }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
enum Mode {
    #[default]
    Hidden,
    Posted {
        anchor: Anchor,
    },
    Preview {
        over: Option<Anchor>,
    },
}

impl Mode {
    fn shut(self) -> Self {
        match self {
            Self::Preview { over: Some(anchor) } => Self::Posted { anchor },
            Self::Preview { over: None } | Self::Posted { .. } | Self::Hidden => Self::Hidden,
        }
    }

    fn spread_over(self, anchor: Anchor) -> Option<Self> {
        match self {
            Self::Posted { .. } => Some(Self::Posted { anchor }),
            Self::Preview { over: Some(_) } => Some(Self::Preview { over: Some(anchor) }),
            Self::Preview { over: None } | Self::Hidden => None,
        }
    }

    fn matches_posted(self) -> bool {
        matches!(self, Self::Posted { .. })
    }

    fn matches_previewing(self) -> bool {
        matches!(self, Self::Preview { .. })
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct Posed {
    at: LogicalPosition<f64>,
    from: ScreenPoint,
    plate: Plate,
}

#[derive(Debug, Default)]
struct RuneTable {
    mode: Mutex<Option<Mode>>,
    plate_ratio: Mutex<Option<f64>>,
    preview_offset: Mutex<Option<RuneOffset>>,
    posed: Mutex<Option<Posed>>,
    posing: Mutex<()>,
    complained: AtomicBool,
    under_the_hand: AtomicBool,
    generation: Generation,
}

impl RuneTable {
    fn held(&self) -> MutexGuard<'_, Option<Mode>> {
        self.mode.lock().unwrap_or_else(PoisonError::into_inner)
    }

    fn mode(&self) -> Mode {
        self.held().unwrap_or(Mode::Hidden)
    }

    fn lay(&self, mode: Mode) -> u64 {
        *self.held() = Some(mode);

        self.complained.store(false, Ordering::Release);
        self.under_the_hand.store(false, Ordering::Release);

        self.generation.next()
    }

    fn take_in_hand(&self) {
        self.under_the_hand.store(true, Ordering::Release);
    }

    fn let_go(&self) {
        self.under_the_hand.store(false, Ordering::Release);
    }

    fn matches_under_the_hand(&self) -> bool {
        self.under_the_hand.load(Ordering::Acquire)
    }

    fn matches_first_complaint(&self) -> bool {
        !self.complained.swap(true, Ordering::AcqRel)
    }

    fn matches_latest(&self, generation: u64) -> bool {
        self.generation.matches_latest(generation)
    }

    fn hold_the_anchor(&self, window: WindowId) -> Option<Anchor> {
        let mut held = self.held();
        let Some(Mode::Posted { anchor }) = *held else {
            return None;
        };
        let taken = anchor.taken_on(window);

        *held = Some(Mode::Posted { anchor: taken });

        Some(taken)
    }

    fn sits_on(&self, foreground: WindowId) -> Option<WindowId> {
        self.hold_the_anchor(foreground)
            .filter(|anchor| anchor.holds(foreground))
            .map(|_| foreground)
    }

    fn ratio(&self) -> Option<f64> {
        *self
            .plate_ratio
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
    }

    fn measure(&self, ratio: f64) {
        *self
            .plate_ratio
            .lock()
            .unwrap_or_else(PoisonError::into_inner) = Some(ratio);
    }

    fn preview_offset(&self) -> MutexGuard<'_, Option<RuneOffset>> {
        self.preview_offset
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
    }

    fn posed(&self) -> MutexGuard<'_, Option<Posed>> {
        self.posed.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

pub fn setup(app: &AppHandle) {
    app.manage(RuneTable::default());

    build(app);
}

pub fn toggle(app: &AppHandle, here: Option<WindowId>) {
    if matches!(app.state::<RuneTable>().mode(), Mode::Hidden) {
        post(app, here);
    } else {
        hide(app);
    }
}

fn hide(app: &AppHandle) {
    let table = app.state::<RuneTable>();

    table.lay(Mode::Hidden);

    *table.preview_offset() = None;

    tell_state(app);
    veil_in_turn(app);
}

pub fn preview(app: &AppHandle) {
    let over = {
        let table = app.state::<RuneTable>();

        *table.preview_offset() = None;

        match table.mode() {
            Mode::Posted { anchor } => Some(anchor),
            Mode::Preview { over } => over,
            Mode::Hidden => None,
        }
    };

    open_on(app, Mode::Preview { over });
}

pub fn close(app: &AppHandle) {
    let table = app.state::<RuneTable>();
    let next = table.mode().shut();

    *table.preview_offset() = None;

    if matches!(next, Mode::Hidden) {
        table.lay(Mode::Hidden);

        tell_state(app);
        veil_in_turn(app);

        return;
    }

    open_on(app, next);
}

#[must_use]
pub fn is_open(app: &AppHandle) -> bool {
    !matches!(app.state::<RuneTable>().mode(), Mode::Hidden)
}

fn post(app: &AppHandle, here: Option<WindowId>) {
    let anchor = if lock(app).rune_table_everywhere() {
        Anchor::Anywhere
    } else {
        here.map_or(Anchor::TheNextOne, Anchor::OnlyOn)
    };

    open_on(app, Mode::Posted { anchor });
}

fn open_on(app: &AppHandle, mode: Mode) {
    let generation = app.state::<RuneTable>().lay(mode);

    tell_state(app);
    follow_foreground(app);
    follow_apart(app, generation);
}

fn tell_state(app: &AppHandle) {
    let mode = app.state::<RuneTable>().mode();

    lock(app).set_rune_table_shown(!matches!(mode, Mode::Hidden), mode.matches_previewing());
}

fn follow_apart(app: &AppHandle, generation: u64) {
    OVERLAY.apart(app, move |app| loop {
        thread::sleep(FOLLOW);

        if !app.state::<RuneTable>().matches_latest(generation) || !is_open(app) {
            return;
        }

        follow_foreground(app);
    });
}

fn follow_foreground(app: &AppHandle) {
    let table = app.state::<RuneTable>();

    if table.matches_under_the_hand() {
        return;
    }

    let _posing = table.posing.lock().unwrap_or_else(PoisonError::into_inner);

    let followed = catch_unwind(AssertUnwindSafe(|| match table.mode() {
        Mode::Hidden => {}
        Mode::Preview { .. } => follow_multifus(app),
        Mode::Posted { .. } => follow_game(app),
    }));

    if followed.is_err() {
        lock(app).log_unless_repeated(JournalEvent::Panicked {
            work: Work::RuneTable,
        });
    }
}

fn follow_multifus(app: &AppHandle) {
    let Some(main) = app.get_webview_window(main_window::LABEL) else {
        veil(app);

        return;
    };

    let showing = main.is_visible().unwrap_or(false) && platform::matches_frontmost();

    let Some(frame) = own_frame(&main).filter(|_| showing) else {
        veil(app);

        return;
    };

    let area = screen_under(app, frame).map(|screen| screen.area);
    let plate = plate_of(app, area);

    lay_over(app, frame, plate, middle_offset(app, frame, plate));
}

fn lay_over(app: &AppHandle, frame: ScreenFrame, plate: Plate, offset: RuneOffset) {
    pose(
        app,
        Posed {
            at: placed(frame, offset),
            from: frame.origin,
            plate,
        },
    );
}

fn middle_offset(app: &AppHandle, frame: ScreenFrame, plate: Plate) -> RuneOffset {
    let table = app.state::<RuneTable>();
    let mut held = table.preview_offset();

    *held.get_or_insert(RuneOffset {
        x: (frame.width - plate.width) / 2.0,
        y: (frame.height - plate.height) / 2.0,
    })
}

fn follow_game(app: &AppHandle) {
    let foreground = match windows(app).foreground_game_window() {
        Ok(Some(window)) => window,
        Ok(None) => {
            veil(app);

            return;
        }
        Err(error) => {
            complain(app, &error.to_string());

            return;
        }
    };

    let Some(window) = app.state::<RuneTable>().sits_on(foreground.id()) else {
        veil(app);

        return;
    };

    let frame = match windows(app).window_frame(window) {
        Ok(Some(frame)) => frame,
        Ok(None) => {
            veil(app);

            return;
        }
        Err(error) => {
            complain(app, &error.to_string());

            return;
        }
    };

    let screen = screen_under(app, frame);

    if screen.is_some_and(|screen| matches_full_screen(frame, screen)) {
        veil(app);

        return;
    }

    let area = screen.map(|screen| screen.area);
    let plate = plate_of(app, area);

    lay_over(app, frame, plate, kept_offset(app, frame, plate));
}

fn complain(app: &AppHandle, detail: &str) {
    if app.state::<RuneTable>().matches_first_complaint() {
        lock(app).log(JournalEvent::RuneTableFailed {
            detail: detail.to_owned(),
        });
    }

    veil(app);
}

fn kept_offset(app: &AppHandle, frame: ScreenFrame, plate: Plate) -> RuneOffset {
    if let Some(offset) = lock(app).rune_table_offset() {
        return offset;
    }

    let first = RuneOffset {
        x: frame.width - plate.width - FIRST_MARGIN,
        y: FIRST_MARGIN,
    };

    let mut state = lock(app);

    state.set_rune_table_offset(first);
    state.save();

    first
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct Plate {
    width: f64,
    height: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct Screen {
    area: WorkArea,
    width: f64,
    height: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct WorkArea {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

fn plate_of(app: &AppHandle, area: Option<WorkArea>) -> Plate {
    let width = f64::from(lock(app).rune_table_width());
    let ratio = app.state::<RuneTable>().ratio().unwrap_or(GUESSED_RATIO);

    grown(fitted(width, ratio, area), ratio)
}

fn fitted(width: f64, ratio: f64, area: Option<WorkArea>) -> f64 {
    let Some(area) = area else {
        return width;
    };

    width.min(area.height / ratio).floor()
}

fn grown(width: f64, ratio: f64) -> Plate {
    Plate {
        width,
        height: (width * ratio).ceil(),
    }
}

fn placed(frame: ScreenFrame, offset: RuneOffset) -> LogicalPosition<f64> {
    LogicalPosition::new(frame.origin.x + offset.x, frame.origin.y + offset.y)
}

fn pose(app: &AppHandle, wanted: Posed) {
    let Some(window) = OVERLAY.window(app) else {
        return;
    };

    let table = app.state::<RuneTable>();
    let unchanged = *table.posed() == Some(wanted);

    if unchanged && window.is_visible().unwrap_or(false) {
        return;
    }

    let posed = window
        .set_size(LogicalSize::new(wanted.plate.width, wanted.plate.height))
        .and_then(|()| window.set_position(wanted.at))
        .and_then(|()| window.show());

    *table.posed() = posed.is_ok().then_some(wanted);

    OVERLAY.said(app, posed);
}

fn veil_in_turn(app: &AppHandle) {
    let table = app.state::<RuneTable>();
    let _posing = table.posing.lock().unwrap_or_else(PoisonError::into_inner);

    veil(app);
}

fn veil(app: &AppHandle) {
    let Some(window) = OVERLAY.window(app) else {
        return;
    };

    *app.state::<RuneTable>().posed() = None;

    if window.is_visible().unwrap_or(false) {
        OVERLAY.said(app, window.hide());
    }
}

pub fn shift(app: &AppHandle, by_x: f64, by_y: f64) {
    let table = app.state::<RuneTable>();
    let mode = table.mode();

    if matches!(mode, Mode::Hidden) || !by_x.is_finite() || !by_y.is_finite() {
        return;
    }

    table.take_in_hand();

    let Some(window) = OVERLAY.window(app) else {
        return;
    };

    let Some(posed) = *table.posed() else {
        return;
    };

    let at = dragged(posed, by_x, by_y);

    if at == posed.at {
        return;
    }

    let moved = window.set_position(at);

    if moved.is_err() {
        OVERLAY.said(app, moved);

        return;
    }

    *table.posed() = Some(Posed { at, ..posed });

    keep(app, mode, offset_of(posed.from, at));
}

fn dragged(posed: Posed, by_x: f64, by_y: f64) -> LogicalPosition<f64> {
    LogicalPosition::new(posed.at.x + by_x, posed.at.y + by_y)
}

fn offset_of(from: ScreenPoint, at: LogicalPosition<f64>) -> RuneOffset {
    RuneOffset {
        x: at.x - from.x,
        y: at.y - from.y,
    }
}

fn keep(app: &AppHandle, mode: Mode, offset: RuneOffset) {
    match mode {
        Mode::Hidden => {}
        Mode::Preview { .. } => {
            *app.state::<RuneTable>().preview_offset() = Some(offset);
        }
        Mode::Posted { .. } => lock(app).set_rune_table_offset(offset),
    }
}

pub fn settled(app: &AppHandle) {
    let table = app.state::<RuneTable>();

    table.let_go();

    if table.mode().matches_posted() {
        lock(app).save();
    }
}

pub fn recall(app: &AppHandle) {
    {
        let mut state = lock(app);

        state.clear_rune_table_offset();
        state.save();
    }

    *app.state::<RuneTable>().preview_offset() = None;

    follow_foreground(app);
}

pub fn measured(app: &AppHandle, ratio: f64) {
    let table = app.state::<RuneTable>();

    if !matches_a_shape(ratio) {
        return;
    }

    let told = grained(ratio);

    if table.ratio() == Some(told) {
        return;
    }

    table.measure(told);

    follow_foreground(app);
}

fn grained(ratio: f64) -> f64 {
    (ratio * RATIO_GRAIN).round() / RATIO_GRAIN
}

fn matches_a_shape(ratio: f64) -> bool {
    ratio.is_finite() && ratio > 0.0 && ratio <= WILDEST_RATIO
}

pub fn size(app: &AppHandle, width: u32) {
    let widened = {
        let mut state = lock(app);
        let before = state.rune_table_width();

        state.set_rune_table_width(width);

        state.rune_table_width() != before
    };

    if !widened {
        return;
    }

    follow_foreground(app);
}

pub fn fade(app: &AppHandle, transparency: u32) {
    let veiled = {
        let mut state = lock(app);
        let before = state.rune_table_transparency();

        state.set_rune_table_transparency(transparency);

        state.rune_table_transparency() != before
    };

    if !veiled {
        return;
    }

    tell_look(app);
    follow_foreground(app);
}

#[must_use]
pub fn look(app: &AppHandle) -> f64 {
    faded(lock(app).rune_table_transparency())
}

fn faded(transparency: u32) -> f64 {
    let pushed = f64::from(transparency) / f64::from(RUNE_TABLE_CLEAREST);

    1.0 - pushed * (1.0 - FAINTEST_LOOK)
}

fn tell_look(app: &AppHandle) {
    let told = app.emit_to(OVERLAY.target(), LOOK_EVENT, look(app));

    OVERLAY.said(app, told);
}

pub fn spread(app: &AppHandle, everywhere: bool) {
    let table = app.state::<RuneTable>();
    let mut held = table.held();
    let anchor = if everywhere {
        Anchor::Anywhere
    } else {
        Anchor::TheNextOne
    };
    let Some(next) = held.unwrap_or_default().spread_over(anchor) else {
        return;
    };

    *held = Some(next);

    drop(held);

    follow_foreground(app);
}

fn own_frame(window: &WebviewWindow) -> Option<ScreenFrame> {
    let scale = window.scale_factor().ok()?;
    let at = window.outer_position().ok()?.to_logical::<f64>(scale);
    let size = window.outer_size().ok()?.to_logical::<f64>(scale);

    Some(ScreenFrame {
        origin: ScreenPoint { x: at.x, y: at.y },
        width: size.width,
        height: size.height,
    })
}

fn screen_under(app: &AppHandle, frame: ScreenFrame) -> Option<Screen> {
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
    let whole = screen.size();

    Some(Screen {
        area: WorkArea {
            x: f64::from(area.position.x) / scale,
            y: f64::from(area.position.y) / scale,
            width: f64::from(area.size.width) / scale,
            height: f64::from(area.size.height) / scale,
        },
        width: f64::from(whole.width) / scale,
        height: f64::from(whole.height) / scale,
    })
}

fn matches_full_screen(frame: ScreenFrame, screen: Screen) -> bool {
    let reserved = screen.area.width < screen.width || screen.area.height < screen.height;

    reserved && frame.width >= screen.width && frame.height >= screen.height
}

fn holds_point(edge: f64, room: f64, at: f64) -> bool {
    at >= edge && at < edge + room
}

fn build(app: &AppHandle) {
    let width = f64::from(lock(app).rune_table_width());

    let Some(window) = OVERLAY.build(app, LogicalSize::new(width, width * GUESSED_RATIO)) else {
        return;
    };

    hold_back_activation(app, &window);
}

#[cfg(target_os = "macos")]
fn hold_back_activation(app: &AppHandle, window: &WebviewWindow) {
    let held_back = window
        .ns_window()
        .map_err(|error| error.to_string())
        .and_then(|handle| {
            platform::hold_back_activation(handle).map_err(|error| error.to_string())
        });

    if let Err(detail) = held_back {
        OVERLAY.complain(app, detail);
    }
}

#[cfg(not(target_os = "macos"))]
fn hold_back_activation(_app: &AppHandle, _window: &WebviewWindow) {}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;
    use crate::platform::PlatformError;
    use crate::platform::WindowManager;
    use crate::test_doubles::Desktop;
    use crate::test_doubles::FakeWindowManager;

    fn here() -> WindowId {
        WindowId::from_raw(1)
    }

    fn there() -> WindowId {
        WindowId::from_raw(2)
    }

    fn frame() -> ScreenFrame {
        ScreenFrame {
            origin: ScreenPoint { x: 100.0, y: 60.0 },
            width: 1280.0,
            height: 800.0,
        }
    }

    fn plate() -> Plate {
        Plate {
            width: 420.0,
            height: 640.0,
        }
    }

    fn posed_at(x: f64, y: f64) -> Posed {
        Posed {
            at: LogicalPosition::new(x, y),
            from: frame().origin,
            plate: plate(),
        }
    }

    fn work_area() -> WorkArea {
        WorkArea {
            x: 0.0,
            y: 0.0,
            width: 1920.0,
            height: 1040.0,
        }
    }

    #[test]
    fn the_table_sits_at_its_offset_from_the_corner_of_the_window_of_the_game() {
        assert_eq!(
            placed(frame(), RuneOffset { x: 24.0, y: 40.0 }),
            LogicalPosition::new(124.0, 100.0)
        );
    }

    #[test]
    fn a_table_pushed_past_the_screen_goes_where_it_was_pushed() {
        assert_eq!(
            placed(
                frame(),
                RuneOffset {
                    x: 4000.0,
                    y: 4000.0,
                }
            ),
            LogicalPosition::new(4100.0, 4060.0),
            "a plate parked off the screen is a plate the hand meant to put away"
        );
    }

    #[test]
    fn the_table_opened_on_a_window_of_the_game_answers_to_that_one_alone() {
        let anchor = Anchor::OnlyOn(here());

        assert!(anchor.holds(here()));
        assert!(!anchor.holds(there()));
        assert_eq!(
            anchor.taken_on(there()),
            anchor,
            "the window it was opened on is the one it keeps"
        );
    }

    #[test]
    fn the_table_opened_outside_the_game_takes_the_first_window_that_comes_forward() {
        let waiting = Anchor::TheNextOne;

        assert!(
            !waiting.holds(here()),
            "nothing of the game is in front yet, so there is nothing to sit on"
        );

        let taken = waiting.taken_on(there());

        assert_eq!(taken, Anchor::OnlyOn(there()));
        assert!(taken.holds(there()));
        assert!(!taken.holds(here()));
    }

    #[test]
    fn a_table_that_shows_itself_everywhere_never_takes_a_window_of_its_own() {
        let anywhere = Anchor::Anywhere;

        assert!(anywhere.holds(here()));
        assert!(anywhere.holds(there()));
        assert_eq!(anywhere.taken_on(here()), Anchor::Anywhere);
    }

    #[test]
    fn a_preview_gives_the_posted_table_its_place_back_when_it_closes() {
        let posted = Mode::Posted {
            anchor: Anchor::OnlyOn(here()),
        };

        assert_eq!(posted.shut(), Mode::Hidden);
        assert_eq!(
            Mode::Preview {
                over: Some(Anchor::OnlyOn(here())),
            }
            .shut(),
            posted,
            "the table was posed on the game before the preview took its place"
        );
        assert_eq!(Mode::Preview { over: None }.shut(), Mode::Hidden);
    }

    #[test]
    fn the_switch_moved_under_a_preview_holds_for_the_table_the_preview_gives_back() {
        assert_eq!(
            Mode::Preview {
                over: Some(Anchor::OnlyOn(here())),
            }
            .spread_over(Anchor::Anywhere),
            Some(Mode::Preview {
                over: Some(Anchor::Anywhere),
            }),
            "the switch is flipped from the screen, where the preview is open"
        );
        assert_eq!(
            Mode::Posted {
                anchor: Anchor::OnlyOn(here()),
            }
            .spread_over(Anchor::Anywhere),
            Some(Mode::Posted {
                anchor: Anchor::Anywhere,
            })
        );
        assert_eq!(
            Mode::Preview { over: None }.spread_over(Anchor::Anywhere),
            None
        );
        assert_eq!(Mode::Hidden.spread_over(Anchor::Anywhere), None);
    }

    #[test]
    fn only_the_preview_answers_to_escape_and_only_the_posted_one_writes_its_place() {
        let posted = Mode::Posted {
            anchor: Anchor::Anywhere,
        };
        let previewing = Mode::Preview { over: None };

        assert!(posted.matches_posted());
        assert!(!posted.matches_previewing());
        assert!(previewing.matches_previewing());
        assert!(!previewing.matches_posted());
        assert!(!Mode::Hidden.matches_posted());
        assert!(!Mode::Hidden.matches_previewing());
    }

    #[test]
    fn the_table_a_newer_opening_replaced_no_longer_follows_a_window() {
        let table = RuneTable::default();
        let first = table.lay(Mode::Posted {
            anchor: Anchor::Anywhere,
        });
        let second = table.lay(Mode::Preview { over: None });

        assert!(table.matches_latest(second));
        assert!(
            !table.matches_latest(first),
            "the thread of the first opening has nothing left to follow"
        );
    }

    #[test]
    fn the_anchor_is_only_taken_while_the_table_is_posed_on_the_game() {
        let table = RuneTable::default();

        assert_eq!(table.hold_the_anchor(here()), None);

        table.lay(Mode::Posted {
            anchor: Anchor::TheNextOne,
        });

        assert_eq!(
            table.hold_the_anchor(there()),
            Some(Anchor::OnlyOn(there()))
        );
        assert_eq!(
            table.hold_the_anchor(here()),
            Some(Anchor::OnlyOn(there())),
            "the window taken first is the one it keeps"
        );

        table.lay(Mode::Preview { over: None });

        assert_eq!(table.hold_the_anchor(here()), None);
    }

    #[test]
    fn the_table_only_sits_on_the_window_its_anchor_answers_to() {
        let table = RuneTable::default();

        assert_eq!(
            table.sits_on(here()),
            None,
            "nothing is posed, so there is nothing to sit on"
        );

        table.lay(Mode::Posted {
            anchor: Anchor::OnlyOn(here()),
        });

        assert_eq!(table.sits_on(here()), Some(here()));
        assert_eq!(
            table.sits_on(there()),
            None,
            "another window of the game came forward, and the table fades"
        );

        table.lay(Mode::Posted {
            anchor: Anchor::Anywhere,
        });

        assert_eq!(table.sits_on(there()), Some(there()));
    }

    #[test]
    fn a_table_opened_outside_the_game_settles_on_the_first_window_that_comes_forward() {
        let table = RuneTable::default();

        table.lay(Mode::Posted {
            anchor: Anchor::TheNextOne,
        });

        assert_eq!(
            table.sits_on(here()),
            Some(here()),
            "the window that comes forward is taken as the anchor, and carries the table at once"
        );
        assert_eq!(
            table.sits_on(there()),
            None,
            "and it keeps that one, whatever comes forward next"
        );
        assert_eq!(table.sits_on(here()), Some(here()));
    }

    #[test]
    fn a_frame_nobody_can_read_is_written_down_once_an_opening_and_not_every_turn() {
        let table = RuneTable::default();

        table.lay(Mode::Posted {
            anchor: Anchor::Anywhere,
        });

        assert!(table.matches_first_complaint());
        assert!(
            !table.matches_first_complaint(),
            "ten turns a second must not write ten lines a second"
        );

        table.lay(Mode::Posted {
            anchor: Anchor::Anywhere,
        });

        assert!(
            table.matches_first_complaint(),
            "the next opening is worth a line of its own"
        );
    }

    #[test]
    fn a_drag_moves_the_plate_from_where_it_was_posed_last() {
        assert_eq!(
            dragged(posed_at(300.0, 200.0), 40.0, -25.0),
            LogicalPosition::new(340.0, 175.0)
        );
    }

    #[test]
    fn a_drag_that_pushes_past_the_screen_carries_the_plate_off_it() {
        assert_eq!(
            dragged(posed_at(1800.0, 300.0), 400.0, 0.0),
            LogicalPosition::new(2200.0, 300.0),
            "the plate is put away past the edge, and the recall brings it back"
        );
        assert_eq!(
            dragged(posed_at(20.0, 300.0), -400.0, 0.0),
            LogicalPosition::new(-380.0, 300.0)
        );
    }

    #[test]
    fn the_place_written_down_is_the_one_the_plate_landed_on() {
        let posed = posed_at(1800.0, 300.0);
        let at = dragged(posed, 400.0, 0.0);

        assert_eq!(
            offset_of(posed.from, at),
            RuneOffset {
                x: 2100.0,
                y: 240.0
            }
        );
    }

    fn screen() -> Screen {
        Screen {
            area: work_area(),
            width: 1920.0,
            height: 1080.0,
        }
    }

    #[test]
    fn a_client_that_fills_the_whole_screen_carries_no_table() {
        let filling = ScreenFrame {
            origin: ScreenPoint { x: 0.0, y: 0.0 },
            width: 1920.0,
            height: 1080.0,
        };

        assert!(matches_full_screen(filling, screen()));
    }

    #[test]
    fn a_client_grown_to_the_work_area_still_carries_the_table() {
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
    fn a_screen_that_reserves_nothing_never_reads_as_full_screen() {
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
            !matches_full_screen(filling, bare),
            "with no menu bar and no dock the two are the same, and a guess would hide the table for good"
        );
    }

    #[test]
    fn the_gauge_pushed_to_the_end_leaves_a_plate_one_can_still_read() {
        assert_eq!(faded(0), 1.0);
        assert!(
            (faded(RUNE_TABLE_CLEAREST) - FAINTEST_LOOK).abs() < f64::EPSILON,
            "a plate one cannot see at all is a plate worth closing, not fading"
        );
        assert!((faded(50) - 0.6).abs() < f64::EPSILON);
    }

    #[test]
    fn a_shape_nobody_could_have_measured_is_turned_away() {
        assert!(matches_a_shape(2.025));
        assert!(!matches_a_shape(0.0));
        assert!(!matches_a_shape(-1.0));
        assert!(!matches_a_shape(f64::NAN));
        assert!(!matches_a_shape(f64::INFINITY));
        assert!(
            !matches_a_shape(WILDEST_RATIO + 1.0),
            "a plate taller than eight times its width is a measure that went wrong"
        );
    }

    #[test]
    fn the_hand_on_the_plate_holds_the_thread_that_follows_the_game() {
        let table = RuneTable::default();

        assert!(!table.matches_under_the_hand());

        table.take_in_hand();

        assert!(table.matches_under_the_hand());

        table.let_go();

        assert!(!table.matches_under_the_hand());
    }

    #[test]
    fn a_new_opening_takes_the_plate_out_of_a_hand_that_never_let_go() {
        let table = RuneTable::default();

        table.take_in_hand();
        table.lay(Mode::Posted {
            anchor: Anchor::Anywhere,
        });

        assert!(
            !table.matches_under_the_hand(),
            "a page that dies mid drag must not freeze the following for good"
        );
    }

    #[test]
    fn a_screen_owns_its_left_edge_and_leaves_the_next_one_to_its_neighbour() {
        assert!(holds_point(1920.0, 1920.0, 1920.0));
        assert!(!holds_point(1920.0, 1920.0, 3840.0));
        assert!(!holds_point(1920.0, 1920.0, 1919.0));
    }

    #[test]
    fn a_table_on_a_second_screen_travels_with_the_window_that_carries_it() {
        let on_the_right = ScreenFrame {
            origin: ScreenPoint { x: 1930.0, y: 10.0 },
            ..frame()
        };

        assert_eq!(
            placed(on_the_right, RuneOffset { x: -100.0, y: 0.0 }),
            LogicalPosition::new(1830.0, 10.0)
        );
    }

    #[test]
    fn the_frame_of_a_window_of_the_game_is_read_off_the_window_it_names() {
        let windows = FakeWindowManager::showing(Desktop {
            frames: HashMap::from([(here(), frame())]),
            ..Desktop::default()
        });

        assert_eq!(windows.window_frame(here()), Ok(Some(frame())));
        assert_eq!(
            windows.window_frame(there()),
            Ok(None),
            "a window nobody can measure is not a window that is gone"
        );
    }

    #[test]
    fn a_desktop_nobody_can_read_hands_over_no_frame_at_all() {
        let windows = FakeWindowManager::showing(Desktop {
            frames: HashMap::from([(here(), frame())]),
            scan_refusal: Some(PlatformError::AuthorizationDenied),
            ..Desktop::default()
        });

        assert_eq!(
            windows.window_frame(here()),
            Err(PlatformError::AuthorizationDenied)
        );
    }

    #[test]
    fn a_plate_nobody_has_measured_yet_is_cut_tall_rather_than_short() {
        let table = RuneTable::default();

        assert_eq!(table.ratio(), None);

        table.measure(2.025);

        assert_eq!(table.ratio(), Some(2.025));
    }

    #[test]
    fn a_shape_that_drifts_by_a_hair_is_the_same_shape() {
        assert_eq!(grained(2.025), 2.025);
        assert_eq!(
            grained(2.0250004),
            grained(2.0249996),
            "a hair of drift would resize the plate, which measures itself again"
        );
    }

    #[test]
    fn a_plate_taller_than_the_screen_is_cut_back_to_what_the_screen_holds() {
        let short = WorkArea {
            height: 800.0,
            ..work_area()
        };

        assert_eq!(
            fitted(560.0, 2.0, Some(short)),
            400.0,
            "a plate the screen cannot hold whole is worth nothing to read"
        );
        assert_eq!(
            fitted(320.0, 2.0, Some(short)),
            320.0,
            "a plate that fits is left at the width the gauge asked for"
        );
        assert_eq!(fitted(560.0, 2.0, None), 560.0);
    }

    #[test]
    fn a_wider_plate_is_a_taller_plate_of_the_same_shape() {
        let narrow = grown(320.0, 2.025);
        let wide = grown(560.0, 2.025);

        assert_eq!(narrow.height, 648.0);
        assert_eq!(wide.height, 1134.0);
        assert!(
            (wide.height / wide.width - narrow.height / narrow.width).abs() < 0.01,
            "the gauge grows the whole table, and not its width alone"
        );
    }

    #[test]
    fn a_plate_that_lands_on_half_a_point_is_cut_at_the_point_above() {
        assert_eq!(
            grown(330.0, 2.025).height,
            669.0,
            "a plate cut short would lose the line of the bottom border"
        );
    }
}
