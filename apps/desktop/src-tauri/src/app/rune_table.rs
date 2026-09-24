use std::ffi::c_void;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::time::Duration;
use std::time::Instant;

use tauri::AppHandle;
use tauri::Emitter;
use tauri::LogicalPosition;
use tauri::LogicalSize;
use tauri::Manager;
use tauri::Monitor;
use tauri::WebviewWindow;

use crate::app::alarm::Alarm;
use crate::app::journal::JournalEvent;
use crate::app::journal::Work;
use crate::app::main_window;
use crate::app::overlay::Generation;
use crate::app::overlay::Overlay;
use crate::app::overlay::holds_point;
use crate::app::panics;
use crate::app::runtime;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::config::RUNE_TABLE_CLEAREST;
use crate::config::RuneOffset;
use crate::platform;
use crate::platform::PlatformError;
use crate::platform::ScreenFrame;
use crate::platform::ScreenPoint;
use crate::platform::WindowId;
use crate::platform::WindowManager;

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

const FOLLOW_IN_MOTION: Duration = Duration::from_millis(16);

const MOTION_LINGERS: Duration = Duration::from_millis(500);

static NEXT_FOLLOW: Alarm = Alarm::new();

const GUESSED_RATIO: f64 = 2.1;

const WILDEST_RATIO: f64 = 8.0;

const FAINTEST_LOOK: f64 = 0.2;

const RATIO_GRAIN: f64 = 1000.0;

const EDGE_GRAIN: f64 = 1.0;

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

    fn carrier(self, highest: WindowId) -> WindowId {
        match self {
            Self::OnlyOn(window) => window,
            Self::Anywhere | Self::TheNextOne => highest,
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
    size: TableSize,
}

#[derive(Debug, Default)]
struct RuneTable {
    mode: Mutex<Option<Mode>>,
    table_ratio: Mutex<Option<f64>>,
    preview_offset: Mutex<Option<RuneOffset>>,
    posed: Mutex<Option<Posed>>,
    posing: Mutex<()>,
    highest: Mutex<Option<WindowId>>,
    stirred_at: Mutex<Option<Instant>>,
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

        self.forget_highest();
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

    fn posted_anchor(&self) -> Option<Anchor> {
        match self.mode() {
            Mode::Posted { anchor } => Some(anchor),
            Mode::Preview { .. } | Mode::Hidden => None,
        }
    }

    fn settle_on(&self, highest: WindowId) -> Option<WindowId> {
        let mut held = self.held();
        let Some(Mode::Posted { anchor }) = *held else {
            return None;
        };
        let taken = anchor.taken_on(highest);

        *held = Some(Mode::Posted { anchor: taken });

        Some(taken.carrier(highest))
    }

    fn ratio(&self) -> Option<f64> {
        *self
            .table_ratio
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
    }

    fn measure(&self, ratio: f64) {
        *self
            .table_ratio
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

    fn remembered_highest(&self) -> Option<WindowId> {
        *self.highest.lock().unwrap_or_else(PoisonError::into_inner)
    }

    fn remember_highest(&self, highest: Option<WindowId>) {
        *self.highest.lock().unwrap_or_else(PoisonError::into_inner) = highest;
    }

    fn forget_highest(&self) {
        self.remember_highest(None);
    }

    fn stir(&self) {
        *self
            .stirred_at
            .lock()
            .unwrap_or_else(PoisonError::into_inner) = Some(Instant::now());
    }

    fn since_stirred(&self) -> Duration {
        self.stirred_at
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .map_or(Duration::MAX, |stirred_at| stirred_at.elapsed())
    }
}

pub fn setup(app: &AppHandle) {
    app.manage(RuneTable::default());
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

    set_floating(app, mode.matches_previewing());
    tell_state(app);
    follow_foreground(app);
    follow_apart(app, generation);
}

fn set_floating(app: &AppHandle, should_float: bool) {
    let Some(window) = OVERLAY.window(app) else {
        return;
    };

    OVERLAY.said(app, window.set_always_on_top(should_float));
}

pub fn note_windows(app: &AppHandle) {
    app.state::<RuneTable>().forget_highest();

    NEXT_FOLLOW.wake();
}

pub fn note_drag(app: &AppHandle) {
    let table = app.state::<RuneTable>();
    let was_still = pace(table.since_stirred()) == FOLLOW;

    table.stir();

    if was_still {
        NEXT_FOLLOW.wake();
    }
}

fn tell_state(app: &AppHandle) {
    let mode = app.state::<RuneTable>().mode();

    lock(app).set_rune_table_shown(!matches!(mode, Mode::Hidden), mode.matches_previewing());
}

fn follow_apart(app: &AppHandle, generation: u64) {
    OVERLAY.apart(app, move |app| {
        let table = app.state::<RuneTable>();

        loop {
            NEXT_FOLLOW.wait(Duration::ZERO, pace(table.since_stirred()));

            if !table.matches_latest(generation) || !is_open(app) {
                return;
            }

            let before = *table.posed();

            follow_foreground(app);

            if *table.posed() != before {
                table.stir();
            }
        }
    });
}

fn pace(since_stirred: Duration) -> Duration {
    if since_stirred < MOTION_LINGERS {
        FOLLOW_IN_MOTION
    } else {
        FOLLOW
    }
}

fn follow_foreground(app: &AppHandle) {
    let table = app.state::<RuneTable>();

    if table.matches_under_the_hand() {
        return;
    }

    let _posing = table.posing.lock().unwrap_or_else(PoisonError::into_inner);

    let followed = panics::guard(|| match table.mode() {
        Mode::Hidden => {}
        Mode::Preview { .. } => follow_multifus(app),
        Mode::Posted { .. } => follow_game(app),
    });

    if let Err(detail) = followed {
        lock(app).log_unless_repeated(JournalEvent::Panicked {
            work: Work::RuneTable,
            detail,
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
    let size = table_size_of(app, area);

    lay_over(app, frame, size, middle_offset(app, frame, size, area));
}

fn lay_over(app: &AppHandle, frame: ScreenFrame, size: TableSize, offset: RuneOffset) {
    pose(
        app,
        Posed {
            at: placed(frame, offset),
            from: frame.origin,
            size,
        },
    );
}

fn middle_offset(
    app: &AppHandle,
    frame: ScreenFrame,
    size: TableSize,
    area: Option<WorkArea>,
) -> RuneOffset {
    let table = app.state::<RuneTable>();
    let mut held = table.preview_offset();

    *held.get_or_insert(centred(frame, size, area))
}

fn centred(frame: ScreenFrame, size: TableSize, area: Option<WorkArea>) -> RuneOffset {
    let middle = RuneOffset {
        x: (frame.width - size.width) / 2.0,
        y: (frame.height - size.height) / 2.0,
    };

    let Some(area) = area else {
        return middle;
    };

    RuneOffset {
        x: within(frame.origin.x + middle.x, area.x, area.width - size.width) - frame.origin.x,
        y: within(frame.origin.y + middle.y, area.y, area.height - size.height) - frame.origin.y,
    }
}

fn within(at: f64, start: f64, room: f64) -> f64 {
    at.min(start + room).max(start)
}

fn follow_game(app: &AppHandle) {
    let window = match carrier(&app.state::<RuneTable>(), windows(app)) {
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

    let frame = match windows(app).window_frame(window) {
        Ok(Some(frame)) => frame,
        Err(PlatformError::WindowGone) if !matches_shown_everywhere(app) => {
            close_with_its_client(app);

            return;
        }
        Ok(None) | Err(PlatformError::WindowGone) => {
            app.state::<RuneTable>().forget_highest();
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
    let size = table_size_of(app, area);

    lay_over(app, frame, size, kept_offset(app, frame, size, area));
    stack_above(app, window);
}

fn matches_shown_everywhere(app: &AppHandle) -> bool {
    app.state::<RuneTable>().posted_anchor() == Some(Anchor::Anywhere)
}

fn close_with_its_client(app: &AppHandle) {
    let table = app.state::<RuneTable>();

    table.lay(Mode::Hidden);

    *table.preview_offset() = None;

    tell_state(app);
    veil(app);
    runtime::emit_snapshot(app);
}

fn carrier(table: &RuneTable, windows: &dyn WindowManager) -> platform::Result<Option<WindowId>> {
    let Some(anchor) = table.posted_anchor() else {
        return Ok(None);
    };

    if let Anchor::OnlyOn(window) = anchor {
        return Ok(Some(window));
    }

    if let Some(remembered) = table.remembered_highest() {
        return Ok(Some(remembered));
    }

    let settled = windows
        .highest_game_window()?
        .and_then(|highest| table.settle_on(highest));

    table.remember_highest(settled);

    Ok(settled)
}

fn stack_above(app: &AppHandle, carrier: WindowId) {
    let Some(table) = OVERLAY.window(app) else {
        return;
    };

    let stacked = app.run_on_main_thread({
        let app = app.clone();

        move || {
            if !app.state::<RuneTable>().mode().matches_posted() {
                return;
            }

            if let Err(detail) = stacked_above(&table, carrier) {
                OVERLAY.complain(&app, detail);
            }
        }
    });

    OVERLAY.said(app, stacked);
}

fn stacked_above(table: &WebviewWindow, carrier: WindowId) -> Result<(), String> {
    let handle = native_handle(table).map_err(|error| error.to_string())?;

    match platform::lay_above(handle, carrier) {
        Ok(()) | Err(PlatformError::WindowGone) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

#[cfg(target_os = "windows")]
fn native_handle(window: &WebviewWindow) -> tauri::Result<*mut c_void> {
    Ok(window.hwnd()?.0)
}

#[cfg(target_os = "macos")]
fn native_handle(window: &WebviewWindow) -> tauri::Result<*mut c_void> {
    window.ns_window()
}

fn complain(app: &AppHandle, detail: &str) {
    if app.state::<RuneTable>().matches_first_complaint() {
        lock(app).log(JournalEvent::RuneTableFailed {
            detail: detail.to_owned(),
        });
    }

    veil(app);
}

fn kept_offset(
    app: &AppHandle,
    frame: ScreenFrame,
    size: TableSize,
    area: Option<WorkArea>,
) -> RuneOffset {
    let kept = lock(app).rune_table_offset();

    kept.unwrap_or_else(|| centred(frame, size, area))
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct TableSize {
    width: f64,
    height: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct Screen {
    area: WorkArea,
    x: f64,
    y: f64,
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

fn table_size_of(app: &AppHandle, area: Option<WorkArea>) -> TableSize {
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

fn grown(width: f64, ratio: f64) -> TableSize {
    TableSize {
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
    let last_posed = *table.posed();
    let is_visible = window.is_visible().unwrap_or(false);

    if is_visible && last_posed == Some(wanted) {
        return;
    }

    let posed = laid(&window, wanted, last_posed, is_visible);

    *table.posed() = posed.is_ok().then_some(wanted);

    OVERLAY.said(app, posed);
}

fn laid(
    window: &WebviewWindow,
    wanted: Posed,
    last_posed: Option<Posed>,
    is_visible: bool,
) -> tauri::Result<()> {
    let is_same_size = last_posed.is_some_and(|last| last.size == wanted.size);

    if !is_same_size {
        window.set_size(LogicalSize::new(wanted.size.width, wanted.size.height))?;
    }

    window.set_position(wanted.at)?;

    if !is_visible {
        window.show()?;
    }

    Ok(())
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

    table.forget_highest();

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

fn matches_full_screen(frame: ScreenFrame, screen: Screen) -> bool {
    matches_same_edge(frame.origin.x, screen.x)
        && matches_same_edge(frame.origin.y, screen.y)
        && matches_same_edge(frame.width, screen.width)
        && matches_same_edge(frame.height, screen.height)
}

fn matches_same_edge(one: f64, other: f64) -> bool {
    (one - other).abs() <= EDGE_GRAIN
}

pub fn build(app: &AppHandle) {
    let width = f64::from(lock(app).rune_table_width());

    let Some(window) = OVERLAY.build(app, LogicalSize::new(width, width * GUESSED_RATIO)) else {
        return;
    };

    set_floating(app, app.state::<RuneTable>().mode().matches_previewing());

    let held_back = app.run_on_main_thread({
        let app = app.clone();

        move || hold_back_activation(&app, &window)
    });

    OVERLAY.said(app, held_back);
}

#[cfg(target_os = "macos")]
fn hold_back_activation(app: &AppHandle, window: &WebviewWindow) {
    let held_back = native_handle(window)
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
    use std::sync::Arc;

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

    fn a_table_size() -> TableSize {
        TableSize {
            width: 420.0,
            height: 640.0,
        }
    }

    fn posed_at(x: f64, y: f64) -> Posed {
        Posed {
            at: LogicalPosition::new(x, y),
            from: frame().origin,
            size: a_table_size(),
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
    fn a_table_nobody_moved_sits_in_the_middle_of_the_window_of_the_game() {
        assert_eq!(
            centred(frame(), a_table_size(), Some(work_area())),
            RuneOffset { x: 430.0, y: 80.0 }
        );
    }

    #[test]
    fn a_table_taller_than_a_small_client_keeps_its_top_on_the_screen() {
        let small = ScreenFrame {
            origin: ScreenPoint { x: 0.0, y: 0.0 },
            width: 1024.0,
            height: 600.0,
        };
        let too_tall = TableSize {
            width: 420.0,
            height: 1200.0,
        };

        assert_eq!(
            centred(small, too_tall, Some(work_area())),
            RuneOffset { x: 302.0, y: 0.0 },
            "the close button sits at the top of the table"
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
            "a table parked off the screen is a table the hand meant to put away"
        );
    }

    #[test]
    fn the_table_opened_on_a_window_of_the_game_stays_on_that_one_whatever_rises_above_it() {
        let anchor = Anchor::OnlyOn(here());

        assert_eq!(anchor.carrier(there()), here());
        assert_eq!(
            anchor.taken_on(there()),
            anchor,
            "the window it was opened on is the one it keeps"
        );
    }

    #[test]
    fn the_table_opened_outside_the_game_takes_the_highest_window_of_the_game() {
        let waiting = Anchor::TheNextOne;

        assert_eq!(waiting.carrier(there()), there());
        assert_eq!(waiting.taken_on(there()), Anchor::OnlyOn(there()));
    }

    #[test]
    fn a_table_that_shows_itself_everywhere_follows_the_highest_window_of_the_game() {
        let anywhere = Anchor::Anywhere;

        assert_eq!(anywhere.carrier(here()), here());
        assert_eq!(anywhere.carrier(there()), there());
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

        assert_eq!(
            table.settle_on(here()),
            None,
            "nothing is posed, so there is nothing to sit on"
        );

        table.lay(Mode::Posted {
            anchor: Anchor::TheNextOne,
        });

        assert_eq!(table.settle_on(there()), Some(there()));
        assert_eq!(table.posted_anchor(), Some(Anchor::OnlyOn(there())));

        table.lay(Mode::Preview { over: None });

        assert_eq!(table.settle_on(here()), None);
        assert_eq!(table.posted_anchor(), None);
    }

    fn highest_showing(highest: Option<WindowId>) -> Arc<FakeWindowManager> {
        FakeWindowManager::showing(Desktop {
            highest,
            ..Desktop::default()
        })
    }

    #[test]
    fn a_table_opened_on_a_window_stays_on_it_while_another_one_is_above() {
        let table = RuneTable::default();

        table.lay(Mode::Posted {
            anchor: Anchor::OnlyOn(here()),
        });

        assert_eq!(
            carrier(&table, &*highest_showing(Some(there()))),
            Ok(Some(here())),
            "the window above covers the table as it covers the window, the table does not fade"
        );
    }

    #[test]
    fn a_table_opened_on_a_window_does_not_wait_on_a_scan_of_the_others() {
        let table = RuneTable::default();
        let windows = FakeWindowManager::showing(Desktop {
            scan_refusal: Some(PlatformError::AuthorizationDenied),
            ..Desktop::default()
        });

        table.lay(Mode::Posted {
            anchor: Anchor::OnlyOn(here()),
        });

        assert_eq!(
            carrier(&table, &*windows),
            Ok(Some(here())),
            "its window is known, and the other windows are none of its business"
        );
    }

    #[test]
    fn a_table_on_every_character_stays_on_the_last_one_played_while_another_application_has_the_focus()
     {
        let table = RuneTable::default();
        let windows = FakeWindowManager::showing(Desktop {
            foreground: None,
            highest: Some(here()),
            ..Desktop::default()
        });

        table.lay(Mode::Posted {
            anchor: Anchor::Anywhere,
        });

        assert_eq!(
            carrier(&table, &*windows),
            Ok(Some(here())),
            "a browser beside the game, or the menu of the taskbar, takes the focus and leaves the table where it is"
        );
    }

    #[test]
    fn a_table_opened_outside_the_game_settles_on_the_highest_window_of_the_game() {
        let table = RuneTable::default();

        table.lay(Mode::Posted {
            anchor: Anchor::TheNextOne,
        });

        assert_eq!(
            carrier(&table, &*highest_showing(None)),
            Ok(None),
            "no window of the game shows, and the table waits for one"
        );
        assert_eq!(
            carrier(&table, &*highest_showing(Some(here()))),
            Ok(Some(here())),
            "the highest window of the game is taken as the anchor, and carries the table at once"
        );
        assert_eq!(
            carrier(&table, &*highest_showing(Some(there()))),
            Ok(Some(here())),
            "and it keeps that one, whatever rises above it next"
        );
    }

    #[test]
    fn a_table_that_is_not_posed_on_the_game_has_no_window_of_the_game_to_sit_on() {
        let table = RuneTable::default();
        let windows = highest_showing(Some(here()));

        assert_eq!(carrier(&table, &*windows), Ok(None));

        table.lay(Mode::Preview {
            over: Some(Anchor::Anywhere),
        });

        assert_eq!(
            carrier(&table, &*windows),
            Ok(None),
            "the preview sits on Multifus, not on the game"
        );
    }

    #[test]
    fn a_table_on_every_character_looks_for_the_highest_window_again_only_once_told_to() {
        let table = RuneTable::default();

        table.lay(Mode::Posted {
            anchor: Anchor::Anywhere,
        });

        assert_eq!(
            carrier(&table, &*highest_showing(Some(here()))),
            Ok(Some(here()))
        );
        assert_eq!(
            carrier(&table, &*highest_showing(Some(there()))),
            Ok(Some(here())),
            "a turn in the middle of a drag must not ask the game for its windows again"
        );

        table.forget_highest();

        assert_eq!(
            carrier(&table, &*highest_showing(Some(there()))),
            Ok(Some(there())),
            "a change of foreground sends the table to the window now on top"
        );
    }

    #[test]
    fn a_new_opening_forgets_the_window_the_last_one_sat_on() {
        let table = RuneTable::default();

        table.lay(Mode::Posted {
            anchor: Anchor::Anywhere,
        });
        carrier(&table, &*highest_showing(Some(here()))).expect("a carrier");
        table.lay(Mode::Posted {
            anchor: Anchor::Anywhere,
        });

        assert_eq!(
            carrier(&table, &*highest_showing(Some(there()))),
            Ok(Some(there()))
        );
    }

    #[test]
    fn a_table_nobody_stirred_follows_at_the_resting_pace() {
        let table = RuneTable::default();

        assert_eq!(pace(table.since_stirred()), FOLLOW);

        table.stir();

        assert_eq!(pace(table.since_stirred()), FOLLOW_IN_MOTION);
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
    fn the_table_follows_at_the_pace_of_the_screen_while_its_window_moves() {
        assert_eq!(pace(Duration::ZERO), FOLLOW_IN_MOTION);
        assert_eq!(
            pace(MOTION_LINGERS / 2),
            FOLLOW_IN_MOTION,
            "a hand that pauses mid drag must not find the table ten beats behind when it moves on"
        );
        assert_eq!(pace(MOTION_LINGERS), FOLLOW);
    }

    #[test]
    fn a_drag_moves_the_table_from_where_it_was_posed_last() {
        assert_eq!(
            dragged(posed_at(300.0, 200.0), 40.0, -25.0),
            LogicalPosition::new(340.0, 175.0)
        );
    }

    #[test]
    fn a_drag_that_pushes_past_the_screen_carries_the_table_off_it() {
        assert_eq!(
            dragged(posed_at(1800.0, 300.0), 400.0, 0.0),
            LogicalPosition::new(2200.0, 300.0),
            "the table is put away past the edge, and the recall brings it back"
        );
        assert_eq!(
            dragged(posed_at(20.0, 300.0), -400.0, 0.0),
            LogicalPosition::new(-380.0, 300.0)
        );
    }

    #[test]
    fn the_place_written_down_is_the_one_the_table_landed_on() {
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
            x: 0.0,
            y: 0.0,
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
    fn a_client_grown_past_the_edges_of_the_screen_still_carries_the_table() {
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
    fn the_gauge_pushed_to_the_end_leaves_a_table_one_can_still_read() {
        assert_eq!(faded(0), 1.0);
        assert!(
            (faded(RUNE_TABLE_CLEAREST) - FAINTEST_LOOK).abs() < f64::EPSILON,
            "a table one cannot see at all is a table worth closing, not fading"
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
            "a table taller than eight times its width is a measure that went wrong"
        );
    }

    #[test]
    fn the_hand_on_the_table_holds_the_thread_that_follows_the_game() {
        let table = RuneTable::default();

        assert!(!table.matches_under_the_hand());

        table.take_in_hand();

        assert!(table.matches_under_the_hand());

        table.let_go();

        assert!(!table.matches_under_the_hand());
    }

    #[test]
    fn a_new_opening_takes_the_table_out_of_a_hand_that_never_let_go() {
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
    fn a_table_nobody_has_measured_yet_is_cut_tall_rather_than_short() {
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
            "a hair of drift would resize the table, which measures itself again"
        );
    }

    #[test]
    fn a_table_taller_than_the_screen_is_cut_back_to_what_the_screen_holds() {
        let short = WorkArea {
            height: 800.0,
            ..work_area()
        };

        assert_eq!(
            fitted(560.0, 2.0, Some(short)),
            400.0,
            "a table the screen cannot hold whole is worth nothing to read"
        );
        assert_eq!(
            fitted(320.0, 2.0, Some(short)),
            320.0,
            "a table that fits is left at the width the gauge asked for"
        );
        assert_eq!(fitted(560.0, 2.0, None), 560.0);
    }

    #[test]
    fn a_wider_table_is_a_taller_table_of_the_same_shape() {
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
    fn a_table_that_lands_on_half_a_point_is_cut_at_the_point_above() {
        assert_eq!(
            grown(330.0, 2.025).height,
            669.0,
            "a table cut short would lose the line of the bottom border"
        );
    }
}
