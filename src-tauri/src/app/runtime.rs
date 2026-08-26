use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::sync::Condvar;
use std::sync::LazyLock;
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
use crate::app::journal::Outcome;
use crate::app::journal::Work;
use crate::app::main_window;
use crate::app::portraits;
use crate::app::relay;
use crate::app::state::lock;
use crate::app::state::Decision;
use crate::app::state::Painting;
use crate::app::state::ScanChange;
use crate::app::state::TracedWindow;
use crate::app::state::WatcherState;
use crate::app::tray;
use crate::app::view::Screen;
use crate::app::view::Snapshot;
use crate::app::walk;
use crate::domain::GameNotification;
use crate::platform::NotificationReport;
use crate::platform::NotificationSink;
use crate::platform::NotificationWatcher;
use crate::platform::PlatformError;
use crate::platform::PlatformNotificationWatcher;
use crate::platform::PlatformWindowManager;
use crate::platform::WindowId;
use crate::platform::WindowManager;

const SCAN_INTERVAL: Duration = Duration::from_secs(1);

static NEXT_TURN: LazyLock<(Mutex<bool>, Condvar)> =
    LazyLock::new(|| (Mutex::new(false), Condvar::new()));

#[cfg(target_os = "macos")]
const AUTHORIZATION_SETTINGS_URL: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

#[cfg(target_os = "windows")]
const AUTHORIZATION_SETTINGS_URL: &str = "ms-settings:privacy-notifications";

pub const SNAPSHOT_EVENT: &str = "multifus://snapshot";

pub const NAVIGATE_EVENT: &str = "multifus://navigate";

pub fn start(app: AppHandle) {
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
    let (asked, alarm) = &*NEXT_TURN;
    let mut guard = asked.lock().unwrap_or_else(PoisonError::into_inner);

    if !*guard {
        let (waited, _) = alarm
            .wait_timeout(guard, SCAN_INTERVAL)
            .unwrap_or_else(PoisonError::into_inner);

        guard = waited;
    }

    *guard = false;
}

pub fn wake() {
    let (asked, alarm) = &*NEXT_TURN;

    *asked.lock().unwrap_or_else(PoisonError::into_inner) = true;

    alarm.notify_one();
}

fn tick(app: &AppHandle) {
    let renamed = apply_short_titles(app);
    let changed = scan(app);
    let maximized = maximize_new_clients(app);
    let painted = apply_window_icons(app);
    let regrouped = follow_taskbar(app);

    walk::refresh(app);

    if changed || maximized || renamed || painted || regrouped {
        emit_snapshot(app);
    }
}

fn scan(app: &AppHandle) -> bool {
    let change = refresh_windows(app);
    let listening_changed = follow_authorization(app);

    relay::run::announce(app, &change);

    let display_changed = relay::run::follow_display(app);

    change.changed || listening_changed || display_changed
}

fn maximize_new_clients(app: &AppHandle) -> bool {
    if !lock(app).maximizes_on_launch() {
        lock(app).forget_client_windows();

        return false;
    }

    let client_windows = match app.state::<PlatformWindowManager>().client_windows() {
        Ok(client_windows) => client_windows,
        Err(PlatformError::AuthorizationDenied) => return false,
        Err(error) => {
            return lock(app).log_unless_repeated(JournalEvent::ClientMaximizeFailed {
                detail: error.to_string(),
            })
        }
    };

    let appeared = lock(app).take_appeared_client_windows(&client_windows);
    let mut written = false;

    for window in appeared {
        let filled = app.state::<PlatformWindowManager>().maximize(window);
        let mut state = lock(app);

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

fn apply_short_titles(app: &AppHandle) -> bool {
    let (short, suffix) = {
        let state = lock(app);

        (state.shortens_titles(), state.client_title_suffix())
    };

    let written = app
        .state::<PlatformWindowManager>()
        .apply_short_titles(short, suffix.as_deref());

    match written {
        Ok(report) => {
            let mut state = lock(app);

            state.remember_short_titles(report.on_screen);

            if let Some(learned) = report.suffix {
                state.learn_title_suffix(learned);
            }

            false
        }
        Err(PlatformError::AuthorizationDenied) | Err(PlatformError::WindowGone) => false,
        Err(error) => lock(app).log_unless_repeated(JournalEvent::ShortTitlesFailed {
            detail: error.to_string(),
        }),
    }
}

fn follow_taskbar(app: &AppHandle) -> bool {
    match app.state::<PlatformWindowManager>().taskbar_combines() {
        Ok(combines) => lock(app).set_taskbar_combines(combines),
        Err(_) => false,
    }
}

fn apply_window_icons(app: &AppHandle) -> bool {
    app.state::<PlatformWindowManager>().forget_closed_windows();

    let looks = {
        let mut state = lock(app);

        state.forget_closed_windows();

        state.looks_to_paint()
    };

    let mut written = false;

    for painting in looks {
        let painted = paint_window(app, &painting);
        let mut state = lock(app);

        match painted {
            Ok(()) => state.remember_painted(&painting),
            Err(PlatformError::AuthorizationDenied | PlatformError::WindowGone) => {}
            Err(error) => {
                written |= state.log_unless_repeated(JournalEvent::WindowIconFailed {
                    detail: error.to_string(),
                });
            }
        }
    }

    written
}

fn paint_window(app: &AppHandle, painting: &Painting) -> Result<(), PlatformError> {
    let manager = app.state::<PlatformWindowManager>();

    let (wore_portrait, was_ungrouped) = {
        let state = lock(app);

        (
            state.wore_portrait(&painting.nickname),
            state.was_ungrouped(&painting.nickname),
        )
    };
    let Painting { window, look, .. } = painting;

    if look.portrait.is_some() || wore_portrait {
        manager.set_window_icon(*window, look.portrait.map(portraits::icon_of))?;
    }

    if look.ungrouped || was_ungrouped {
        manager.set_window_group(
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
        give_titles_back(app);
        give_icons_back(app);
        give_groups_back(app);

        return;
    }

    main_window::show_on_dock_click(app, event);
}

fn give_icons_back(app: &AppHandle) {
    let posed = lock(app).portraits_to_give_back();
    let given = give_back(app, posed, |manager, window| {
        manager.set_window_icon(window, None)
    });

    lock(app).forget_portraits(&given);
}

fn give_groups_back(app: &AppHandle) {
    let posed = lock(app).groups_to_give_back();
    let given = give_back(app, posed, |manager, window| {
        manager.set_window_group(window, None)
    });

    lock(app).forget_groups(&given);
}

fn give_back(
    app: &AppHandle,
    posed: Vec<TracedWindow>,
    hand: impl Fn(&PlatformWindowManager, WindowId) -> Result<(), PlatformError>,
) -> Vec<String> {
    let manager = app.state::<PlatformWindowManager>();

    posed
        .into_iter()
        .filter(|(_, window)| hand(manager.inner(), *window).is_ok())
        .map(|(nickname, _)| nickname)
        .collect()
}

fn give_titles_back(app: &AppHandle) {
    let suffix = lock(app).client_title_suffix();
    let given = app
        .state::<PlatformWindowManager>()
        .apply_short_titles(false, suffix.as_deref());

    if let Ok(report) = given {
        lock(app).remember_short_titles(report.on_screen);
    }
}

fn refresh_windows(app: &AppHandle) -> ScanChange {
    let outcome = app.state::<PlatformWindowManager>().game_windows();

    let mut state = lock(app);

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
    }
}

fn on_notification(app: &AppHandle, notification: GameNotification) {
    let Some(nickname) = notification.nickname().map(str::to_owned) else {
        return;
    };

    relay::run::offer(app, &notification, &nickname);

    let kind = notification.kind();
    let decision = lock(app).decide(&nickname, kind);

    let outcome = match decision {
        Decision::Ignored(Outcome::KindUnknown) if notification.matches_blank_body() => {
            Outcome::BodyUnread
        }
        Decision::Ignored(outcome) => outcome,
        Decision::Focus(window) => focus(app, window),
        Decision::FocusUnlessMinimized(window) => focus_unless_minimized(app, window),
    };

    if outcome == Outcome::Focused {
        dismiss(app, &nickname);
    }

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

fn focus(app: &AppHandle, window: WindowId) -> Outcome {
    match app.state::<PlatformWindowManager>().focus(window) {
        Ok(()) => Outcome::Focused,
        Err(error) => refused(&error),
    }
}

fn focus_unless_minimized(app: &AppHandle, window: WindowId) -> Outcome {
    match app.state::<PlatformWindowManager>().is_minimized(window) {
        Ok(true) => Outcome::LeftMinimized,
        Ok(false) => focus(app, window),
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
    let asked = app.state::<PlatformWindowManager>().request_authorization();

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
    scan(app);
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
