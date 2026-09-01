use std::panic::AssertUnwindSafe;
use std::panic::catch_unwind;
use std::sync::Arc;
use std::sync::Condvar;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::sync::TryLockError;
use std::thread;
use std::time::Duration;

use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;
use tauri::RunEvent;
use tauri_plugin_opener::OpenerExt;

use crate::app::journal::JournalEvent;
use crate::app::journal::MaximizeAllOutcome;
use crate::app::journal::Outcome;
use crate::app::journal::Surface;
use crate::app::journal::Work;
use crate::app::main_window;
use crate::app::portraits;
use crate::app::relay;
use crate::app::state::AppState;
use crate::app::state::Decision;
use crate::app::state::Multifus;
use crate::app::state::Painting;
use crate::app::state::ScanChange;
use crate::app::state::TracedWindow;
use crate::app::state::WatcherState;
use crate::app::state::hold;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::app::tray;
use crate::app::view::ClientsView;
use crate::app::view::Screen;
use crate::app::view::Snapshot;
use crate::app::walk;
use crate::app::wheel;
use crate::domain::GameNotification;
use crate::platform::NotificationReport;
use crate::platform::NotificationSink;
use crate::platform::NotificationWatcher;
use crate::platform::PlatformError;
use crate::platform::PlatformNotificationWatcher;
use crate::platform::PlatformWakeWatcher;
use crate::platform::WakeWatcher;
use crate::platform::WindowId;
use crate::platform::WindowManager;

const SCAN_INTERVAL: Duration = Duration::from_secs(1);

const TURN_REST: Duration = Duration::from_millis(150);

static NEXT_TURN: TurnAlarm = TurnAlarm::new();

struct TurnAlarm {
    asked: Mutex<bool>,
    alarm: Condvar,
}

impl TurnAlarm {
    const fn new() -> Self {
        Self {
            asked: Mutex::new(false),
            alarm: Condvar::new(),
        }
    }

    fn wake(&self) {
        *self.asked.lock().unwrap_or_else(PoisonError::into_inner) = true;

        self.alarm.notify_one();
    }

    fn wait(&self, rest: Duration, interval: Duration) {
        thread::sleep(rest);

        let mut guard = self.asked.lock().unwrap_or_else(PoisonError::into_inner);

        if !*guard {
            let (waited, _) = self
                .alarm
                .wait_timeout(guard, interval.saturating_sub(rest))
                .unwrap_or_else(PoisonError::into_inner);

            guard = waited;
        }

        *guard = false;
    }
}

#[cfg(target_os = "macos")]
const AUTHORIZATION_SETTINGS_URL: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

#[cfg(target_os = "windows")]
const AUTHORIZATION_SETTINGS_URL: &str = "ms-settings:privacy-notifications";

pub const SNAPSHOT_EVENT: &str = "multifus://snapshot";

pub const NAVIGATE_EVENT: &str = "multifus://navigate";

struct Wakes(PlatformWakeWatcher);

pub fn start(app: AppHandle) {
    app.manage(Wakes(PlatformWakeWatcher::new()));

    let spawned = thread::Builder::new()
        .name("multifus-window-scan".to_owned())
        .spawn({
            let app = app.clone();

            move || loop {
                if catch_unwind(AssertUnwindSafe(|| tick(&app))).is_err() {
                    lock(&app).log_unless_repeated(JournalEvent::Panicked { work: Work::Scan });
                }

                wait_for_next_turn();
            }
        });

    if let Err(error) = spawned {
        lock(&app).log(JournalEvent::ScanFailed {
            detail: error.to_string(),
        });
    }
}

fn wait_for_next_turn() {
    NEXT_TURN.wait(TURN_REST, SCAN_INTERVAL);
}

pub fn wake() {
    NEXT_TURN.wake();
}

struct Turn<'a> {
    windows: &'a dyn WindowManager,
    state: &'a AppState,
}

impl<'a> Turn<'a> {
    fn of(app: &'a AppHandle) -> Self {
        Self {
            windows: windows(app),
            state: app.state::<AppState>().inner(),
        }
    }

    fn hold(&self) -> MutexGuard<'_, Multifus> {
        hold(self.state)
    }
}

trait TurnMechanisms {
    fn follow_authorization(&self) -> bool;

    fn announce_relay(&self, change: &ScanChange);

    fn follow_display(&self) -> bool;

    fn refresh_walk(&self) -> bool;

    fn follow_wheel(&self);

    fn shows_main_window(&self) -> bool;

    fn tell_clients(&self, counted: ClientsView) -> Result<(), String>;

    fn emit_snapshot(&self);
}

struct AppTurnMechanisms<'a>(&'a AppHandle);

impl TurnMechanisms for AppTurnMechanisms<'_> {
    fn follow_authorization(&self) -> bool {
        follow_authorization(self.0)
    }

    fn announce_relay(&self, change: &ScanChange) {
        relay::run::announce(self.0, change);
    }

    fn follow_display(&self) -> bool {
        relay::run::follow_display(self.0)
    }

    fn refresh_walk(&self) -> bool {
        walk::refresh(self.0)
    }

    fn follow_wheel(&self) {
        wheel::follow_foreground(self.0);
    }

    fn shows_main_window(&self) -> bool {
        main_window::is_on_screen(self.0)
    }

    fn tell_clients(&self, counted: ClientsView) -> Result<(), String> {
        self.0
            .emit(CLIENTS_EVENT, counted)
            .map_err(|error| error.to_string())
    }

    fn emit_snapshot(&self) {
        emit_snapshot(self.0);
    }
}

fn tick(app: &AppHandle) {
    listen_for_wakes(app);

    turn_over(&Turn::of(app), &AppTurnMechanisms(app));
}

fn listen_for_wakes(app: &AppHandle) {
    let Err(error) = app.state::<Wakes>().0.start(Arc::new(wake)) else {
        return;
    };

    lock(app).log_unless_repeated(JournalEvent::WakesFailed {
        detail: error.to_string(),
    });
}

fn turn_over(turn: &Turn, mechanisms: &dyn TurnMechanisms) {
    let renamed = apply_short_titles(turn);
    let changed = scan(turn, mechanisms);
    let maximized = maximize_new_clients(turn);
    let painted = apply_window_icons(turn);
    let regrouped = follow_taskbar(turn);

    let walk_stopped = mechanisms.refresh_walk();

    mechanisms.follow_wheel();

    follow_clients(turn, mechanisms);

    if changed || maximized || renamed || painted || regrouped || walk_stopped {
        mechanisms.emit_snapshot();
    }
}

fn scan(turn: &Turn, mechanisms: &dyn TurnMechanisms) -> bool {
    let change = refresh_windows(turn);
    let listening_changed = mechanisms.follow_authorization();

    mechanisms.announce_relay(&change);

    let display_changed = mechanisms.follow_display();

    change.changed || listening_changed || display_changed
}

enum ClientsOnScreen {
    Open(Vec<WindowId>),
    Denied,
    Unreadable { detail: String },
}

fn clients_on_screen(turn: &Turn) -> ClientsOnScreen {
    match turn.windows.client_windows() {
        Ok(open) => ClientsOnScreen::Open(open),
        Err(PlatformError::AuthorizationDenied) => ClientsOnScreen::Denied,
        Err(error) => ClientsOnScreen::Unreadable {
            detail: error.to_string(),
        },
    }
}

fn maximize_new_clients(turn: &Turn) -> bool {
    if !turn.hold().maximizes_on_launch() {
        turn.hold().forget_client_windows();

        return false;
    }

    let client_windows = match clients_on_screen(turn) {
        ClientsOnScreen::Open(open) => open,
        ClientsOnScreen::Denied => return false,
        ClientsOnScreen::Unreadable { detail } => {
            return turn
                .hold()
                .log_unless_repeated(JournalEvent::ClientMaximizeFailed { detail });
        }
    };

    let appeared = turn.hold().take_appeared_client_windows(&client_windows);
    let mut written = false;

    for window in appeared {
        let filled = turn.windows.maximize(window);
        let mut state = turn.hold();

        written |= match filled {
            Ok(()) => {
                state.remember_client_window(window);
                state.log(JournalEvent::ClientMaximized);

                true
            }
            Err(error) => state.log_unless_repeated(JournalEvent::ClientMaximizeFailed {
                detail: error.to_string(),
            }),
        };
    }

    written
}

pub const CLIENTS_EVENT: &str = "multifus://clients";

pub fn clients(app: &AppHandle) -> ClientsView {
    count_clients(&Turn::of(app))
}

pub fn watch_clients(app: &AppHandle, watching: bool) {
    lock(app).watch_clients(watching);
}

fn follow_clients(turn: &Turn, mechanisms: &dyn TurnMechanisms) {
    if !turn.hold().watches_clients() || !mechanisms.shows_main_window() {
        return;
    }

    let counted = count_clients(turn);

    let Some(changed) = turn.hold().take_changed_clients(counted) else {
        return;
    };

    if let Err(detail) = mechanisms.tell_clients(changed) {
        turn.hold()
            .log_unless_repeated(JournalEvent::ClientsCountFailed { detail });
    }
}

fn count_clients(turn: &Turn) -> ClientsView {
    let ClientsOnScreen::Open(open) = clients_on_screen(turn) else {
        return ClientsView::UNREADABLE;
    };

    let maximized = turn.windows.maximized_windows(&open).len();

    ClientsView {
        open: open.len(),
        small: open.len().saturating_sub(maximized),
        readable: true,
    }
}

pub fn maximize_all(app: &AppHandle, from: Surface) {
    let turn = Turn::of(app);
    let outcome = maximize_clients_on_screen(&turn);

    turn.hold().log(JournalEvent::MaximizeAll { from, outcome });
}

fn maximize_clients_on_screen(turn: &Turn) -> MaximizeAllOutcome {
    let client_windows = match clients_on_screen(turn) {
        ClientsOnScreen::Open(open) => open,
        ClientsOnScreen::Denied => return MaximizeAllOutcome::Denied,
        ClientsOnScreen::Unreadable { detail } => return MaximizeAllOutcome::Refused { detail },
    };

    if client_windows.is_empty() {
        return MaximizeAllOutcome::NoClient;
    }

    let mut windows = 0;

    for window in client_windows {
        match turn.windows.maximize(window) {
            Ok(()) => windows += 1,
            Err(error) => {
                turn.hold().log(JournalEvent::ClientMaximizeFailed {
                    detail: error.to_string(),
                });
            }
        }
    }

    if windows == 0 {
        MaximizeAllOutcome::NothingMoved
    } else {
        MaximizeAllOutcome::Asked { windows }
    }
}

fn apply_short_titles(turn: &Turn) -> bool {
    let (short, suffix) = {
        let state = turn.hold();

        (state.shortens_titles(), state.client_title_suffix())
    };

    let written = turn.windows.apply_short_titles(short, suffix.as_deref());

    match written {
        Ok(report) => {
            let mut state = turn.hold();

            state.remember_short_titles(report.on_screen);

            if let Some(learned) = report.suffix {
                state.learn_title_suffix(learned);
            }

            false
        }
        Err(PlatformError::AuthorizationDenied) | Err(PlatformError::WindowGone) => false,
        Err(error) => turn
            .hold()
            .log_unless_repeated(JournalEvent::ShortTitlesFailed {
                detail: error.to_string(),
            }),
    }
}

fn follow_taskbar(turn: &Turn) -> bool {
    match turn.windows.taskbar_combines() {
        Ok(combines) => turn.hold().set_taskbar_combines(combines),
        Err(_) => false,
    }
}

fn apply_window_icons(turn: &Turn) -> bool {
    turn.windows.forget_closed_windows();

    let looks = {
        let mut state = turn.hold();

        state.forget_closed_windows();

        state.looks_to_paint()
    };

    let mut written = false;

    for painting in looks {
        let painted = paint_window(turn, &painting);
        let mut state = turn.hold();

        match painted {
            Ok(()) => state.remember_painted(&painting),
            Err(PlatformError::WindowGone) => state.forget_window(&painting.nickname),
            Err(PlatformError::AuthorizationDenied) => {}
            Err(error) => {
                written |= state.log_unless_repeated(JournalEvent::WindowIconFailed {
                    detail: error.to_string(),
                });
            }
        }
    }

    written
}

fn paint_window(turn: &Turn, painting: &Painting) -> Result<(), PlatformError> {
    let (wore_portrait, was_ungrouped) = {
        let state = turn.hold();

        (
            state.wore_portrait(&painting.nickname),
            state.was_ungrouped(&painting.nickname),
        )
    };
    let Painting { window, look, .. } = painting;

    if look.portrait.is_some() || wore_portrait {
        turn.windows
            .set_window_icon(*window, look.portrait.map(portraits::icon_of))?;
    }

    if look.ungrouped || was_ungrouped {
        turn.windows.set_window_group(
            *window,
            look.ungrouped.then(|| group_of(*window)).as_deref(),
        )?;
    }

    Ok(())
}

fn group_of(window: WindowId) -> String {
    format!("{GROUP_PREFIX}{}", window.raw())
}

const GROUP_PREFIX: &str = "multifus.window.";

pub fn on_run_event(app: &AppHandle, event: RunEvent) {
    if matches!(event, RunEvent::Exit) {
        give_traces_back(app);

        return;
    }

    main_window::show_on_dock_click(app, event);
}

pub fn give_traces_back(app: &AppHandle) {
    let turn = Turn::of(app);

    give_titles_back(&turn);
    give_icons_back(&turn);
    give_groups_back(&turn);
    let _ = turn.windows.give_foreground_back();
}

fn give_icons_back(turn: &Turn) {
    let posed = turn.hold().portraits_to_give_back();
    let given = give_back(turn, posed, |windows, window| {
        windows.set_window_icon(window, None)
    });

    turn.hold().forget_portraits(&given);
}

fn give_groups_back(turn: &Turn) {
    let posed = turn.hold().groups_to_give_back();
    let given = give_back(turn, posed, |windows, window| {
        windows.set_window_group(window, None)
    });

    turn.hold().forget_groups(&given);
}

fn give_back(
    turn: &Turn,
    posed: Vec<TracedWindow>,
    hand: impl Fn(&dyn WindowManager, WindowId) -> Result<(), PlatformError>,
) -> Vec<String> {
    posed
        .into_iter()
        .filter(|(_, window)| hand(turn.windows, *window).is_ok())
        .map(|(nickname, _)| nickname)
        .collect()
}

fn give_titles_back(turn: &Turn) {
    let suffix = turn.hold().client_title_suffix();
    let given = turn.windows.apply_short_titles(false, suffix.as_deref());

    if let Ok(report) = given {
        turn.hold().remember_short_titles(report.on_screen);
    }
}

fn refresh_windows(turn: &Turn) -> ScanChange {
    let outcome = turn.windows.game_windows();

    let mut state = turn.hold();

    match outcome {
        Ok(windows) => state.apply_windows(&windows),
        Err(PlatformError::AuthorizationDenied) => state.apply_denied(),
        Err(error) => {
            state.log_unless_repeated(JournalEvent::ScanFailed {
                detail: error.to_string(),
            });

            ScanChange {
                changed: true,
                ..ScanChange::default()
            }
        }
    }
}

fn follow_authorization(app: &AppHandle) -> bool {
    let (granted, listening) = {
        let state = lock(app);

        (state.is_granted(), state.is_listening())
    };

    match (granted, listening) {
        (true, false) => start_listening(app),
        (false, true) => stop_listening(app),
        _ => false,
    }
}

fn start_listening(app: &AppHandle) -> bool {
    let outcome = {
        let sink_app = app.clone();
        let sink: NotificationSink = Box::new(move |report| on_report(&sink_app, report));

        watcher(app).start(sink)
    };

    let mut state = lock(app);

    match outcome {
        Ok(()) => state.set_listening(true),
        Err(PlatformError::AuthorizationDenied) => state.set_granted(false),
        Err(error) => {
            state.log_unless_repeated(JournalEvent::ListeningFailed {
                detail: error.to_string(),
            });

            state.set_listening(false)
        }
    }
}

fn stop_listening(app: &AppHandle) -> bool {
    let outcome = watcher(app).stop();

    let mut state = lock(app);

    if let Err(error) = outcome {
        state.log_unless_repeated(JournalEvent::ListeningFailed {
            detail: error.to_string(),
        });
    }

    state.set_listening(false)
}

fn on_report(app: &AppHandle, report: NotificationReport) {
    match report {
        NotificationReport::Heard(notification) => on_notification(app, notification),
        NotificationReport::Unreadable { detail } => on_unreadable(app, detail),
        NotificationReport::ListeningLost { detail } => on_listening_lost(app, detail),
    }
}

fn on_listening_lost(app: &AppHandle, detail: String) {
    {
        let mut state = lock(app);

        state.log_unless_repeated(JournalEvent::ListeningLost { detail });
        state.set_listening(false);
    }

    emit_snapshot(app);
}

fn on_notification(app: &AppHandle, notification: GameNotification) {
    let Some(nickname) = notification.nickname().map(str::to_owned) else {
        return;
    };

    relay::run::offer(app, &notification, &nickname);
    dismiss(app, &nickname);

    let kind = notification.kind();
    let decision = lock(app).decide(&nickname, kind);

    let outcome = match decision {
        Decision::Ignored(Outcome::KindUnknown) if notification.matches_blank_body() => {
            Outcome::BodyUnread
        }
        Decision::Ignored(outcome) => outcome,
        Decision::Focus(window) => focus(windows(app), window),
        Decision::FocusUnlessMinimized(window) => focus_unless_minimized(windows(app), window),
    };

    lock(app).log(JournalEvent::Notification {
        nickname,
        notification_kind: kind,
        outcome,
    });

    emit_snapshot(app);
}

fn on_unreadable(app: &AppHandle, detail: String) {
    let written = lock(app).log_unless_repeated(JournalEvent::NotificationUnreadable { detail });

    if written {
        emit_snapshot(app);
    }
}

fn dismiss(app: &AppHandle, nickname: &str) {
    let state = app.state::<WatcherState>();

    let watcher = match state.inner().try_lock() {
        Ok(watcher) => watcher,
        Err(TryLockError::Poisoned(poisoned)) => poisoned.into_inner(),
        Err(TryLockError::WouldBlock) => return,
    };

    drop(watcher.dismiss(nickname));
}

fn focus(windows: &dyn WindowManager, window: WindowId) -> Outcome {
    match windows.focus(window) {
        Ok(()) => Outcome::Focused,
        Err(error) => refused(&error),
    }
}

fn focus_unless_minimized(windows: &dyn WindowManager, window: WindowId) -> Outcome {
    match windows.is_minimized(window) {
        Ok(true) => Outcome::LeftMinimized,
        Ok(false) => focus(windows, window),
        Err(error) => refused(&error),
    }
}

fn refused(error: &PlatformError) -> Outcome {
    match error {
        PlatformError::WindowGone => Outcome::NoWindow,
        other => Outcome::FocusFailed {
            detail: other.to_string(),
        },
    }
}

pub fn request_authorization(app: &AppHandle) {
    let asked = windows(app).request_authorization();

    let (granted, failure) = match asked {
        Ok(authorization) => (authorization.is_granted(), None),
        Err(error) => (false, Some(error.to_string())),
    };

    {
        let mut state = lock(app);

        state.log(JournalEvent::AuthorizationRequested { granted, failure });
        state.set_granted(granted);
    }

    follow_authorization(app);
}

pub fn navigate(app: &AppHandle, screen: Screen) {
    drop(app.emit(NAVIGATE_EVENT, screen));
}

pub fn open_authorization_settings(app: &AppHandle) {
    let opened = app
        .opener()
        .open_url(AUTHORIZATION_SETTINGS_URL, None::<&str>);

    if let Err(error) = opened {
        lock(app).log(JournalEvent::OpenFailed {
            detail: error.to_string(),
        });

        emit_snapshot(app);
    }
}

pub fn refresh(app: &AppHandle) {
    scan(&Turn::of(app), &AppTurnMechanisms(app));
}

pub fn emit_snapshot(app: &AppHandle) -> Snapshot {
    let snapshot = lock(app).snapshot();

    if let Err(error) = app.emit(SNAPSHOT_EVENT, snapshot.clone()) {
        lock(app).log_unless_repeated(JournalEvent::SnapshotFailed {
            detail: error.to_string(),
        });
    }

    tray::refresh(app);

    snapshot
}

fn watcher(app: &AppHandle) -> MutexGuard<'_, PlatformNotificationWatcher> {
    app.state::<WatcherState>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;
    use std::time::Instant;

    use super::*;
    use crate::config::Settings;
    use crate::config::Traces;
    use crate::domain::Character;
    use crate::domain::Class;
    use crate::domain::Gender;
    use crate::domain::Roster;
    use crate::platform::ShortTitleReport;
    use crate::test_doubles::Asked;
    use crate::test_doubles::Desktop;
    use crate::test_doubles::FakeWindowManager;
    use crate::test_doubles::app_state;
    use crate::test_doubles::directory;
    use crate::test_doubles::game_window;
    use crate::test_doubles::journalled;

    fn turn<'a>(windows: &'a FakeWindowManager, state: &'a AppState) -> Turn<'a> {
        Turn { windows, state }
    }

    const A_REST: Duration = Duration::from_millis(40);

    const AN_INTERVAL: Duration = Duration::from_millis(400);

    #[test]
    fn a_turn_nobody_asked_for_waits_the_whole_interval() {
        let alarm = TurnAlarm::new();
        let start = Instant::now();

        alarm.wait(A_REST, AN_INTERVAL);

        assert!(
            start.elapsed() >= AN_INTERVAL,
            "the beat is the interval, rest included"
        );
    }

    #[test]
    fn a_wake_during_a_turn_is_kept_and_starts_the_next_one() {
        let alarm = TurnAlarm::new();

        alarm.wake();

        let start = Instant::now();

        alarm.wait(A_REST, AN_INTERVAL);

        assert!(
            start.elapsed() < AN_INTERVAL,
            "a wake asked for before the wait is not lost"
        );
    }

    #[test]
    fn a_wake_never_starts_a_turn_before_the_rest_is_over() {
        let alarm = TurnAlarm::new();

        alarm.wake();

        let start = Instant::now();

        alarm.wait(A_REST, AN_INTERVAL);

        assert!(
            start.elapsed() >= A_REST,
            "a burst of wakes may not run the turns back to back"
        );
    }

    #[test]
    fn a_wake_landing_during_the_rest_is_kept() {
        let alarm = Arc::new(TurnAlarm::new());
        let waking = Arc::clone(&alarm);
        let woken = thread::spawn(move || {
            thread::sleep(A_REST / 2);
            waking.wake();
        });
        let start = Instant::now();

        alarm.wait(A_REST, AN_INTERVAL);

        assert!(
            start.elapsed() < AN_INTERVAL,
            "the rest holds a wake back, it never eats it"
        );

        drop(woken.join());
    }

    #[test]
    fn a_turn_that_ran_on_a_wake_leaves_no_wake_behind_it() {
        let alarm = TurnAlarm::new();

        alarm.wake();
        alarm.wait(A_REST, AN_INTERVAL);

        let start = Instant::now();

        alarm.wait(A_REST, AN_INTERVAL);

        assert!(
            start.elapsed() >= AN_INTERVAL,
            "a wake serves one turn, not every turn after it"
        );
    }

    #[test]
    fn the_rest_never_outlasts_the_beat_it_is_taken_from() {
        assert!(
            TURN_REST < SCAN_INTERVAL,
            "a rest longer than the beat would leave the turn no beat at all"
        );
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    enum TurnMechanism {
        AuthorizationFollowed,
        RelayAnnounced { relayed_gone: Vec<String> },
        DisplayFollowed,
        WalkRefreshed,
        WheelFollowed,
        MainWindowAsked,
        ClientsTold(ClientsView),
        SnapshotEmitted,
    }

    #[derive(Debug, Default)]
    struct FakeTurnMechanisms {
        set_going: Mutex<Vec<TurnMechanism>>,
        listening_changed: bool,
        display_changed: bool,
        walk_stopped: bool,
        main_window_on_screen: bool,
        clients_refusal: Option<String>,
    }

    impl FakeTurnMechanisms {
        fn watched() -> Self {
            Self {
                main_window_on_screen: true,
                ..Self::default()
            }
        }

        fn set_going(&self) -> Vec<TurnMechanism> {
            self.set_going
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .clone()
        }

        fn write_down(&self, mechanism: TurnMechanism) {
            self.set_going
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .push(mechanism);
        }
    }

    impl TurnMechanisms for FakeTurnMechanisms {
        fn follow_authorization(&self) -> bool {
            self.write_down(TurnMechanism::AuthorizationFollowed);

            self.listening_changed
        }

        fn announce_relay(&self, change: &ScanChange) {
            self.write_down(TurnMechanism::RelayAnnounced {
                relayed_gone: change.relayed_gone.clone(),
            });
        }

        fn follow_display(&self) -> bool {
            self.write_down(TurnMechanism::DisplayFollowed);

            self.display_changed
        }

        fn refresh_walk(&self) -> bool {
            self.write_down(TurnMechanism::WalkRefreshed);

            self.walk_stopped
        }

        fn follow_wheel(&self) {
            self.write_down(TurnMechanism::WheelFollowed);
        }

        fn shows_main_window(&self) -> bool {
            self.write_down(TurnMechanism::MainWindowAsked);

            self.main_window_on_screen
        }

        fn tell_clients(&self, counted: ClientsView) -> Result<(), String> {
            self.write_down(TurnMechanism::ClientsTold(counted));

            match &self.clients_refusal {
                Some(detail) => Err(detail.clone()),
                None => Ok(()),
            }
        }

        fn emit_snapshot(&self) {
            self.write_down(TurnMechanism::SnapshotEmitted);
        }
    }

    fn still_turn() -> (Arc<FakeWindowManager>, FakeTurnMechanisms) {
        (
            FakeWindowManager::showing(Desktop::default()),
            FakeTurnMechanisms::default(),
        )
    }

    #[test]
    fn a_turn_sets_its_mechanisms_going_in_the_order_it_is_written() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let (windows, mechanisms) = still_turn();

        turn_over(&turn(&windows, &state), &mechanisms);

        assert_eq!(
            mechanisms.set_going(),
            vec![
                TurnMechanism::AuthorizationFollowed,
                TurnMechanism::RelayAnnounced {
                    relayed_gone: Vec::new()
                },
                TurnMechanism::DisplayFollowed,
                TurnMechanism::WalkRefreshed,
                TurnMechanism::WheelFollowed,
                TurnMechanism::SnapshotEmitted,
            ]
        );
    }

    #[test]
    fn the_first_turn_learns_it_can_read_the_windows_and_says_so_only_once() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let (windows, mechanisms) = still_turn();

        turn_over(&turn(&windows, &state), &mechanisms);

        assert!(
            hold(&state).is_granted(),
            "a scan that answered is what teaches Multifus the windows are readable"
        );

        turn_over(&turn(&windows, &state), &mechanisms);
        turn_over(&turn(&windows, &state), &mechanisms);

        let sent = mechanisms
            .set_going()
            .into_iter()
            .filter(|mechanism| matches!(mechanism, TurnMechanism::SnapshotEmitted))
            .count();

        assert_eq!(
            sent, 1,
            "once the authorization is settled, a still turn has nothing to draw"
        );
    }

    #[test]
    fn a_window_that_appears_sends_the_snapshot_out() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            ..Desktop::default()
        });
        let mechanisms = FakeTurnMechanisms::default();

        turn_over(&turn(&windows, &state), &mechanisms);

        assert!(
            mechanisms
                .set_going()
                .contains(&TurnMechanism::SnapshotEmitted)
        );
    }

    #[test]
    fn a_single_step_that_wrote_something_is_enough_to_send_the_snapshot() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop::default());
        let mechanisms = FakeTurnMechanisms {
            walk_stopped: true,
            ..FakeTurnMechanisms::default()
        };

        turn_over(&turn(&windows, &state), &mechanisms);

        assert!(
            mechanisms
                .set_going()
                .contains(&TurnMechanism::SnapshotEmitted),
            "the walk turned itself off, and the screen has to say so"
        );
    }

    #[test]
    fn the_client_count_stays_home_while_nobody_is_watching_it() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let (windows, mechanisms) = still_turn();

        turn_over(&turn(&windows, &state), &mechanisms);

        assert!(
            !mechanisms
                .set_going()
                .contains(&TurnMechanism::MainWindowAsked),
            "no screen asked for the count, so the turn does not even look"
        );
    }

    #[test]
    fn the_client_count_goes_out_once_and_not_again_for_the_same_count() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop::default());
        let mechanisms = FakeTurnMechanisms::watched();

        hold(&state).watch_clients(true);

        turn_over(&turn(&windows, &state), &mechanisms);
        turn_over(&turn(&windows, &state), &mechanisms);

        let told = mechanisms
            .set_going()
            .into_iter()
            .filter(|mechanism| matches!(mechanism, TurnMechanism::ClientsTold(_)))
            .count();

        assert_eq!(told, 1);
    }

    #[test]
    fn a_client_count_that_cannot_be_sent_is_written_down_once() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop::default());
        let mechanisms = FakeTurnMechanisms {
            clients_refusal: Some("the window went away".to_owned()),
            ..FakeTurnMechanisms::watched()
        };

        hold(&state).watch_clients(true);

        turn_over(&turn(&windows, &state), &mechanisms);
        turn_over(&turn(&windows, &state), &mechanisms);

        let said = journalled(&state)
            .into_iter()
            .filter(|event| matches!(event, JournalEvent::ClientsCountFailed { .. }))
            .count();

        assert_eq!(said, 1);
    }

    #[test]
    fn the_wheel_and_the_walk_are_touched_on_every_turn_whether_anything_moved_or_not() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let (windows, mechanisms) = still_turn();

        turn_over(&turn(&windows, &state), &mechanisms);
        turn_over(&turn(&windows, &state), &mechanisms);

        let followed = mechanisms
            .set_going()
            .into_iter()
            .filter(|mechanism| matches!(mechanism, TurnMechanism::WheelFollowed))
            .count();

        assert_eq!(followed, 2);
    }

    fn alpha_and_bravo() -> Roster {
        Roster::from_characters(vec![
            Character::new("Alpha")
                .with_gender(Gender::Male)
                .with_class(Class::Iop),
            Character::new("Bravo")
                .with_gender(Gender::Female)
                .with_class(Class::Eniripsa),
        ])
    }

    fn nicknames(state: &AppState) -> Vec<String> {
        hold(state)
            .connected()
            .into_iter()
            .map(|character| character.nickname)
            .collect()
    }

    fn traced(nicknames: &[&str]) -> HashSet<String> {
        nicknames
            .iter()
            .map(|nickname| (*nickname).to_owned())
            .collect()
    }

    #[test]
    fn a_scan_turns_the_windows_on_screen_into_connected_characters() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha"), game_window(2, "Bravo")],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        let change = refresh_windows(&turn);

        assert!(change.changed);
        assert_eq!(nicknames(&state), vec!["Alpha", "Bravo"]);

        windows.show(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            ..Desktop::default()
        });

        refresh_windows(&turn);

        assert_eq!(
            nicknames(&state),
            vec!["Alpha"],
            "a character whose window is gone is not connected any more"
        );
    }

    #[test]
    fn an_authorization_taken_away_takes_every_character_offline() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha"), game_window(2, "Bravo")],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);

        assert_eq!(nicknames(&state), vec!["Alpha", "Bravo"]);
        assert!(hold(&state).is_granted());

        windows.show(Desktop {
            scan_refusal: Some(PlatformError::AuthorizationDenied),
            ..Desktop::default()
        });

        refresh_windows(&turn);

        assert!(!hold(&state).is_granted());
        assert!(
            nicknames(&state).is_empty(),
            "Multifus cannot see a window any more, so it says it sees nobody"
        );
        assert_eq!(
            hold(&state).snapshot().characters.len(),
            2,
            "the characters themselves are kept, only their windows are lost"
        );
    }

    #[test]
    fn a_scan_that_breaks_is_written_down_once_and_not_at_every_turn() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            scan_refusal: Some(PlatformError::system("scanning", "the system said no")),
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);
        refresh_windows(&turn);
        refresh_windows(&turn);

        let said = journalled(&state)
            .into_iter()
            .filter(|event| matches!(event, JournalEvent::ScanFailed { .. }))
            .count();

        assert_eq!(said, 1);
    }

    #[test]
    fn the_clients_already_open_at_launch_are_left_the_size_they_were() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                maximize_on_launch: true,
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![WindowId::from_raw(1), WindowId::from_raw(2)],
            ..Desktop::default()
        });

        maximize_new_clients(&turn(&windows, &state));

        assert_eq!(windows.asked(), Vec::new());
    }

    #[test]
    fn a_client_that_opens_while_playing_is_filled_once_and_never_again() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                maximize_on_launch: true,
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![WindowId::from_raw(1)],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        maximize_new_clients(&turn);

        windows.show(Desktop {
            client_windows: vec![WindowId::from_raw(1), WindowId::from_raw(2)],
            ..Desktop::default()
        });

        maximize_new_clients(&turn);
        maximize_new_clients(&turn);

        assert_eq!(
            windows.asked(),
            vec![Asked::Maximized(WindowId::from_raw(2))]
        );
    }

    #[test]
    fn asking_for_all_of_them_fills_every_client_on_screen_and_counts_them() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![WindowId::from_raw(1), WindowId::from_raw(2)],
            ..Desktop::default()
        });

        assert_eq!(
            maximize_clients_on_screen(&turn(&windows, &state)),
            MaximizeAllOutcome::Asked { windows: 2 },
            "the setting is off, and a gesture made by hand answers all the same"
        );
        assert_eq!(
            windows.asked(),
            vec![
                Asked::Maximized(WindowId::from_raw(1)),
                Asked::Maximized(WindowId::from_raw(2)),
            ]
        );
    }

    #[test]
    fn the_screen_is_told_how_many_clients_are_open_and_how_many_stayed_small() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![
                WindowId::from_raw(1),
                WindowId::from_raw(2),
                WindowId::from_raw(3),
            ],
            maximized: vec![WindowId::from_raw(2)],
            ..Desktop::default()
        });

        assert_eq!(
            count_clients(&turn(&windows, &state)),
            ClientsView {
                open: 3,
                small: 2,
                readable: true
            }
        );
    }

    #[test]
    fn a_window_the_system_will_not_vouch_for_is_counted_as_one_left_small() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![WindowId::from_raw(1)],
            maximized: Vec::new(),
            ..Desktop::default()
        });

        assert_eq!(
            count_clients(&turn(&windows, &state)),
            ClientsView {
                open: 1,
                small: 1,
                readable: true
            },
            "the doubt falls on the side that still offers the gesture"
        );
    }

    #[test]
    fn a_desktop_nobody_can_read_is_told_apart_from_a_desktop_without_a_client() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            client_windows_refusal: Some(PlatformError::AuthorizationDenied),
            ..Desktop::default()
        });

        assert_eq!(
            count_clients(&turn(&windows, &state)),
            ClientsView::UNREADABLE
        );

        windows.show(Desktop::default());

        assert_eq!(
            count_clients(&turn(&windows, &state)),
            ClientsView {
                open: 0,
                small: 0,
                readable: true
            },
            "no client open is not the same thing as no window readable"
        );
    }

    #[test]
    fn asking_for_all_of_them_with_no_client_open_says_so_and_moves_nothing() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop::default());

        assert_eq!(
            maximize_clients_on_screen(&turn(&windows, &state)),
            MaximizeAllOutcome::NoClient
        );
        assert_eq!(windows.asked(), Vec::new());
    }

    #[test]
    fn a_client_that_will_not_be_filled_is_told_apart_from_a_desktop_nobody_can_read() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![WindowId::from_raw(1)],
            maximize_refusal: Some(PlatformError::system("filling", "the system said no")),
            ..Desktop::default()
        });

        assert_eq!(
            maximize_clients_on_screen(&turn(&windows, &state)),
            MaximizeAllOutcome::NothingMoved
        );
        assert!(
            journalled(&state).contains(&JournalEvent::ClientMaximizeFailed {
                detail: "filling failed: the system said no".to_owned(),
            })
        );

        windows.show(Desktop {
            client_windows_refusal: Some(PlatformError::AuthorizationDenied),
            ..Desktop::default()
        });

        assert_eq!(
            maximize_clients_on_screen(&turn(&windows, &state)),
            MaximizeAllOutcome::Denied
        );
    }

    #[test]
    fn asking_for_all_of_them_never_spends_the_one_fill_a_new_client_is_owed() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                maximize_on_launch: true,
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![WindowId::from_raw(1)],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        maximize_new_clients(&turn);
        maximize_clients_on_screen(&turn);

        windows.show(Desktop {
            client_windows: vec![WindowId::from_raw(1), WindowId::from_raw(2)],
            ..Desktop::default()
        });

        maximize_new_clients(&turn);

        assert_eq!(
            windows.asked(),
            vec![
                Asked::Maximized(WindowId::from_raw(1)),
                Asked::Maximized(WindowId::from_raw(2)),
            ],
            "the gesture made by hand filled the first, and the client that opened later is still owed its own"
        );
    }

    #[test]
    fn nothing_is_filled_when_the_setting_is_off() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![WindowId::from_raw(1)],
            ..Desktop::default()
        });

        maximize_new_clients(&turn(&windows, &state));

        assert_eq!(windows.asked(), Vec::new());
    }

    #[test]
    fn the_short_titles_are_asked_with_the_suffix_the_client_taught() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                short_titles: true,
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            short_titles: ShortTitleReport {
                on_screen: true,
                suffix: Some(" - Dofus Retro v1.48.21".to_owned()),
            },
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        apply_short_titles(&turn);

        assert_eq!(
            windows.asked(),
            vec![Asked::ShortTitles {
                short: true,
                suffix: None,
            }]
        );

        apply_short_titles(&turn);

        assert_eq!(
            windows.asked().last(),
            Some(&Asked::ShortTitles {
                short: true,
                suffix: Some(" - Dofus Retro v1.48.21".to_owned()),
            }),
            "what one turn learns, the next one hands back"
        );
    }

    #[test]
    fn a_window_that_goes_while_its_title_is_written_is_not_worth_a_line() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            short_titles_refusal: Some(PlatformError::WindowGone),
            ..Desktop::default()
        });

        apply_short_titles(&turn(&windows, &state));

        assert_eq!(journalled(&state), Vec::new());
    }

    #[test]
    fn the_class_head_is_posed_and_the_taskbar_button_set_apart() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                ungroup_taskbar: true,
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);
        apply_window_icons(&turn);

        let posed = windows.asked();

        assert!(
            posed.iter().any(|asked| matches!(
                asked,
                Asked::Icon {
                    window,
                    icon: Some(_)
                } if *window == WindowId::from_raw(1)
            )),
            "{posed:?}"
        );
        assert!(
            posed.contains(&Asked::Group {
                window: WindowId::from_raw(1),
                group: Some("multifus.window.1".to_owned()),
            }),
            "{posed:?}"
        );

        apply_window_icons(&turn);

        assert_eq!(
            &windows.asked()[posed.len()..],
            [Asked::ClosedForgotten],
            "a window that already wears its head is only asked to forget the closed ones"
        );
    }

    #[test]
    fn a_window_gone_while_it_is_painted_is_forgotten_rather_than_chased() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                traces: Traces {
                    portraits: traced(&["Alpha"]),
                    ..Traces::default()
                },
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            icon_refusal: Some(PlatformError::WindowGone),
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);
        apply_window_icons(&turn);

        assert!(!hold(&state).wore_portrait("Alpha"));
        assert!(
            !journalled(&state)
                .iter()
                .any(|event| matches!(event, JournalEvent::WindowIconFailed { .. }))
        );
    }

    #[test]
    fn what_multifus_posed_it_gives_back_when_it_quits() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                short_titles: true,
                traces: Traces {
                    portraits: traced(&["Alpha"]),
                    ungrouped: traced(&["Alpha"]),
                    short_titles: true,
                },
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);

        give_titles_back(&turn);
        give_icons_back(&turn);
        give_groups_back(&turn);

        assert!(windows.asked().contains(&Asked::ShortTitles {
            short: false,
            suffix: None,
        }));
        assert!(windows.asked().contains(&Asked::Icon {
            window: WindowId::from_raw(1),
            icon: None,
        }));
        assert!(windows.asked().contains(&Asked::Group {
            window: WindowId::from_raw(1),
            group: None,
        }));

        let state = hold(&state);

        assert!(!state.wore_portrait("Alpha"));
        assert!(!state.was_ungrouped("Alpha"));
    }

    #[test]
    fn a_trace_the_system_refuses_to_give_back_is_kept_for_the_next_launch() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                traces: Traces {
                    portraits: traced(&["Alpha"]),
                    ..Traces::default()
                },
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            icon_refusal: Some(PlatformError::system("giving the icon back", "busy")),
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);
        give_icons_back(&turn);

        assert!(hold(&state).wore_portrait("Alpha"));
    }

    #[test]
    fn a_focus_tells_a_window_that_is_gone_from_one_that_says_no() {
        let windows = FakeWindowManager::showing(Desktop {
            focus_refusal: Some(PlatformError::WindowGone),
            ..Desktop::default()
        });

        assert_eq!(
            focus(windows.as_ref(), WindowId::from_raw(1)),
            Outcome::NoWindow
        );

        windows.show(Desktop::default());

        assert_eq!(
            focus(windows.as_ref(), WindowId::from_raw(1)),
            Outcome::Focused
        );
    }

    #[test]
    fn a_minimized_window_is_left_alone_when_the_player_asked_for_it() {
        let windows = FakeWindowManager::showing(Desktop {
            minimized: vec![WindowId::from_raw(1)],
            ..Desktop::default()
        });

        assert_eq!(
            focus_unless_minimized(windows.as_ref(), WindowId::from_raw(1)),
            Outcome::LeftMinimized
        );
        assert_eq!(
            focus_unless_minimized(windows.as_ref(), WindowId::from_raw(2)),
            Outcome::Focused
        );
        assert_eq!(
            windows.asked(),
            vec![Asked::Focused(WindowId::from_raw(2))],
            "a window left minimized is never touched"
        );
    }
}
