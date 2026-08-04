//! What multifus does on its own, without anyone opening the window.
//!
//! Two things run outside the commands. A scan asks the boundary which game
//! windows exist, which is how a character enters the roster and how a lamp goes
//! out. And the notification listening, once the system allows it, turns a game
//! notification into a focus.
//!
//! The scan polls, and that is a deliberate cost. Neither system pushes an event
//! when a client opens or closes a window, so the choice is between asking every
//! few seconds and not knowing. [`SCAN_INTERVAL`] is the price of the lamps being
//! right, and of the shortcuts having a fresh window to aim at whether or not
//! the interface is open.
//!
//! The AutoFocus path below is written, and on macOS it has never run against a
//! real client, see step 4 of the plan. Nothing here assumes it works: what it
//! does is journal every step it goes through, so that the day it does not fire,
//! the interface can say where it stopped.

use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::thread;
use std::time::Duration;

use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;

use crate::app::journal::JournalEvent;
use crate::app::journal::Outcome;
use crate::app::state::lock;
use crate::app::state::Decision;
use crate::app::state::WatcherState;
use crate::domain::GameNotification;
use crate::platform::Authorization;
use crate::platform::NotificationSink;
use crate::platform::NotificationWatcher;
use crate::platform::PlatformError;
use crate::platform::PlatformNotificationWatcher;
use crate::platform::PlatformWindowManager;
use crate::platform::WindowManager;

/// How often the game windows are looked at.
///
/// Slow enough that an unattended multifus costs nothing, quick enough that a
/// client one has just opened shows up before one has finished looking at the
/// window.
const SCAN_INTERVAL: Duration = Duration::from_secs(3);

/// The event the interface listens to. One event, one payload, the whole
/// dashboard, see [`crate::app::view::Snapshot`].
pub const SNAPSHOT_EVENT: &str = "multifus://snapshot";

/// Starts the scan, on its own thread, for the life of the process.
pub fn start(app: AppHandle) {
    let spawned = thread::Builder::new()
        .name("multifus-window-scan".to_owned())
        .spawn({
            let app = app.clone();

            move || loop {
                tick(&app);
                thread::sleep(SCAN_INTERVAL);
            }
        });

    if let Err(error) = spawned {
        // Without this thread nobody is ever connected and AutoFocus never
        // starts. It has to be said rather than swallowed.
        lock(&app).log(JournalEvent::ScanFailed {
            detail: error.to_string(),
        });
    }
}

/// One turn of the scan: look at the windows, keep the listening in step with
/// the authorization, and tell the interface if anything moved.
fn tick(app: &AppHandle) {
    let windows_changed = refresh_windows(app);
    let listening_changed = follow_authorization(app);

    if windows_changed || listening_changed {
        emit_snapshot(app);
    }
}

/// Asks the boundary which game windows exist and takes the answer in.
fn refresh_windows(app: &AppHandle) -> bool {
    let outcome = app.state::<PlatformWindowManager>().game_windows();

    let mut state = lock(app);

    match outcome {
        Ok(windows) => state.apply_windows(&windows),
        // Not an empty roster: multifus is not allowed to look, which is a
        // different thing from nobody being connected, and the interface has a
        // screen for it.
        Err(PlatformError::AuthorizationDenied) => state.apply_denied(),
        Err(error) => {
            state.log_unless_repeated(JournalEvent::ScanFailed {
                detail: error.to_string(),
            });

            true
        }
    }
}

/// Starts the banner listening once the system allows it, and takes it down when
/// the authorization goes away.
///
/// macOS grants Accessibility long after it was asked for, and takes it back
/// whenever the user says so. Neither moment is an event multifus can subscribe
/// to, so it is looked at here, every turn.
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

/// Posts the observer and reports how it went.
///
/// The lock on the state is deliberately not held across `start`, which waits on
/// the watcher thread's own report. See the rule on [`crate::app::state`].
fn start_listening(app: &AppHandle) -> bool {
    let outcome = {
        let sink_app = app.clone();
        let sink: NotificationSink =
            Box::new(move |notification| on_notification(&sink_app, notification));

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

/// Takes the observer down. Once this returns, the sink will not be called again.
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

/// A game notification just arrived, on the watcher's own thread.
///
/// Everything that can be decided without the system is decided under the lock,
/// and the focus itself is asked for once the lock is back. The watcher is never
/// touched from here: its `stop` joins this very thread, and reaching for it
/// would be the one deadlock this application can build.
fn on_notification(app: &AppHandle, notification: GameNotification) {
    let Some(nickname) = notification.nickname().map(str::to_owned) else {
        return;
    };

    let kind = notification.kind();
    let decision = lock(app).decide(&nickname, kind);

    let outcome = match decision {
        Decision::Ignored(outcome) => outcome,
        Decision::Focus(window) => match app.state::<PlatformWindowManager>().focus(window) {
            Ok(()) => Outcome::Focused,
            Err(PlatformError::WindowGone) => Outcome::NoWindow,
            Err(error) => Outcome::FocusFailed {
                detail: error.to_string(),
            },
        },
    };

    lock(app).log(JournalEvent::Notification {
        nickname,
        notification_kind: kind,
        outcome,
    });

    emit_snapshot(app);
}

/// Asks the system for the authorization, which opens its dialog.
///
/// macOS grants nothing in the second that follows, so the answer here is almost
/// always still a refusal. The scan is what notices the grant, whenever it comes,
/// which is why the screen behind this button has to hold rather than blink.
pub fn request_authorization(app: &AppHandle) {
    let granted = app
        .state::<PlatformWindowManager>()
        .request_authorization()
        .is_ok_and(Authorization::is_granted);

    lock(app).set_granted(granted);

    follow_authorization(app);
}

/// Looks at the windows now rather than at the next turn of the scan.
pub fn refresh(app: &AppHandle) {
    refresh_windows(app);
    follow_authorization(app);
}

/// Sends the whole dashboard to the interface.
pub fn emit_snapshot(app: &AppHandle) {
    let snapshot = lock(app).snapshot();

    drop(app.emit(SNAPSHOT_EVENT, snapshot));
}

/// The watcher, taken even if a previous holder panicked. See the note on
/// [`crate::app::state::lock`].
fn watcher(app: &AppHandle) -> MutexGuard<'_, PlatformNotificationWatcher> {
    app.state::<WatcherState>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}
