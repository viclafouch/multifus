//! What Multifus does on its own, without anyone opening the window.
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
//! The AutoFocus path below has been run against two real Retro clients and it
//! works, see the plan. Nothing here assumes it keeps working: what it does is
//! journal every step it goes through, so that the day it does not fire, the
//! interface can say where it stopped.

use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::sync::TryLockError;
use std::thread;
use std::time::Duration;

use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;

use crate::app::journal::JournalEvent;
use crate::app::journal::Outcome;
use crate::app::journal::Work;
use crate::app::relay;
use crate::app::state::lock;
use crate::app::state::Decision;
use crate::app::state::ScanChange;
use crate::app::state::WatcherState;
use crate::app::tray;
use crate::app::view::Screen;
use crate::app::view::Snapshot;
use crate::domain::GameNotification;
use crate::platform::NotificationReport;
use crate::platform::NotificationSink;
use crate::platform::NotificationWatcher;
use crate::platform::PlatformError;
use crate::platform::PlatformNotificationWatcher;
use crate::platform::PlatformWindowManager;
use crate::platform::WindowId;
use crate::platform::WindowManager;

/// How often the game windows are looked at.
///
/// Slow enough that an unattended Multifus costs nothing, quick enough that a
/// client one has just opened shows up before one has finished looking at the
/// window.
const SCAN_INTERVAL: Duration = Duration::from_secs(3);

/// The macOS settings pane that grants Accessibility.
#[cfg(target_os = "macos")]
const AUTHORIZATION_SETTINGS_URL: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

/// The Windows pane for notification access.
#[cfg(target_os = "windows")]
const AUTHORIZATION_SETTINGS_URL: &str = "ms-settings:privacy-notifications";

/// The event the interface listens to. One event, one payload, the whole
/// dashboard, see [`crate::app::view::Snapshot`].
pub const SNAPSHOT_EVENT: &str = "multifus://snapshot";

/// The event that asks the window to show one screen rather than another.
///
/// Separate from the snapshot on purpose: which screen is on show is not state
/// Multifus keeps, it is a request made once. Putting it in the snapshot would
/// make every emission re-assert a screen the user may have left since.
pub const NAVIGATE_EVENT: &str = "multifus://navigate";

/// Starts the scan, on its own thread, for the life of the process.
///
/// **It survives its own failures.** A panic inside one turn used to end the
/// thread, and nothing else: no character ever came online again, no lamp ever
/// went out, the listening was never started, and not one line said so. Every
/// Accessibility call of `platform::macos` is inside that turn, so this is not a
/// theoretical shape. The turn is therefore caught, written down and tried again
/// three seconds later.
pub fn start(app: AppHandle) {
    let spawned = thread::Builder::new()
        .name("multifus-window-scan".to_owned())
        .spawn({
            let app = app.clone();

            move || loop {
                if catch_unwind(AssertUnwindSafe(|| tick(&app))).is_err() {
                    lock(&app).log_unless_repeated(JournalEvent::Panicked { work: Work::Scan });
                }

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
    let changed = scan(app);
    // This thread and never a command: filling a window waits on the client's
    // own message pump, and a command runs on the main thread.
    let maximized = maximize_new_clients(app);

    if changed || maximized {
        emit_snapshot(app);
    }
}

/// One look at the system, and whether anything moved.
///
/// The relay is served with the lock back in its holder: the transitions are
/// computed under it and a Telegram message has no business being there.
fn scan(app: &AppHandle) -> bool {
    let change = refresh_windows(app);
    let listening_changed = follow_authorization(app);

    relay::run::announce(app, &change);

    let display_changed = relay::run::follow_display(app);

    change.changed || listening_changed || display_changed
}

/// Fills the screen with the clients that have just opened, and says whether it
/// wrote a line about it.
///
/// The lock is never held across the two boundary calls: macOS hops to the main
/// thread there, which is where every command takes this very mutex.
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

        match filled {
            // Remembered only once it worked. A client still loading turns the
            // write down, and the turn that follows has to try again rather than
            // leave that window small for the evening.
            Ok(()) => {
                state.remember_client_window(window);
                state.log(JournalEvent::ClientMaximized);
            }
            Err(error) => {
                state.log_unless_repeated(JournalEvent::ClientMaximizeFailed {
                    detail: error.to_string(),
                });
            }
        }

        written = true;
    }

    written
}

/// Asks the boundary which game windows exist and takes the answer in.
fn refresh_windows(app: &AppHandle) -> ScanChange {
    let outcome = app.state::<PlatformWindowManager>().game_windows();

    let mut state = lock(app);

    match outcome {
        Ok(windows) => state.apply_windows(&windows),
        // Not an empty roster: Multifus is not allowed to look, which is a
        // different thing from nobody being connected, and the interface has a
        // screen for it. It is also the second of the four cases of ADR 0010,
        // so the relayed characters that leave here are said out loud too.
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

/// Starts the banner listening once the system allows it, and takes it down when
/// the authorization goes away.
///
/// macOS grants Accessibility long after it was asked for, and takes it back
/// whenever the user says so. Neither moment is an event Multifus can subscribe
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

/// The watcher has something to say, on its own thread.
fn on_report(app: &AppHandle, report: NotificationReport) {
    match report {
        NotificationReport::Heard(notification) => on_notification(app, notification),
        NotificationReport::Unreadable { detail } => on_unreadable(app, detail),
    }
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

    // A path of its own, and taken first. The relay needs no window, so the case
    // where the client has just gone is the one where it serves most; going
    // through `Decision` would swallow exactly those. See `docs/macos.md`.
    relay::run::offer(app, &notification, &nickname);

    let kind = notification.kind();
    let decision = lock(app).decide(&nickname, kind);

    let outcome = match decision {
        // A body Multifus never read reaches `decide` looking exactly like one
        // whose wording it does not know, and only this side can tell them apart.
        // They are two different failures repaired in two different files, see
        // [`Outcome::BodyUnread`].
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

/// Something was notified and the system would not let Multifus read it.
///
/// An authorization taken away refuses every element the notification centre
/// builds, until the scan takes the listening down a turn or two later, so the
/// same refusal would otherwise be written a dozen times and flush the journal of
/// what led to it. The snapshot only goes out when a line was actually written.
fn on_unreadable(app: &AppHandle, detail: String) {
    let written = lock(app).log_unless_repeated(JournalEvent::NotificationUnreadable { detail });

    if written {
        emit_snapshot(app);
    }
}

/// Takes the toasts of a character off the screen, its window being in front.
///
/// `try_lock` and not [`watcher`]: this runs on the watcher's own thread, and
/// `start` and `stop` hold that mutex across a join of this very thread. A
/// dismissal skipped while the listening is being rebuilt costs nothing, since
/// what would be dismissed is going away with it.
fn dismiss(app: &AppHandle, nickname: &str) {
    let state = app.state::<WatcherState>();

    let watcher = match state.inner().try_lock() {
        Ok(watcher) => watcher,
        Err(TryLockError::Poisoned(poisoned)) => poisoned.into_inner(),
        Err(TryLockError::WouldBlock) => return,
    };

    // macOS has no API for this and answers `Ok` without doing anything, which
    // is what keeps this call site free of any `cfg`.
    drop(watcher.dismiss(nickname));
}

/// Brings the window forward and says what came of it.
fn focus(app: &AppHandle, window: WindowId) -> Outcome {
    match app.state::<PlatformWindowManager>().focus(window) {
        Ok(()) => Outcome::Focused,
        Err(error) => refused(&error),
    }
}

/// The same, for a user who asked that a window put in the Dock stay there.
///
/// One extra call to the system, paid only by those who switched the réveil des
/// réduites off. Everyone else never asks the question.
fn focus_unless_minimized(app: &AppHandle, window: WindowId) -> Outcome {
    match app.state::<PlatformWindowManager>().is_minimized(window) {
        Ok(true) => Outcome::LeftMinimized,
        Ok(false) => focus(app, window),
        Err(error) => refused(&error),
    }
}

/// What the journal says when the system would not do it.
///
/// A client closed between the scan and the notification is the ordinary case
/// and is not a failure, which is why it does not read as one.
fn refused(error: &PlatformError) -> Outcome {
    match error {
        PlatformError::WindowGone => Outcome::NoWindow,
        other => Outcome::FocusFailed {
            detail: other.to_string(),
        },
    }
}

/// Asks the system for the authorization, which opens its dialog.
///
/// macOS grants nothing in the second that follows, so the answer here is almost
/// always still a refusal. The scan is what notices the grant, whenever it comes,
/// which is why the screen behind this button has to hold rather than blink.
pub fn request_authorization(app: &AppHandle) {
    let asked = app.state::<PlatformWindowManager>().request_authorization();

    let (granted, failure) = match asked {
        Ok(authorization) => (authorization.is_granted(), None),
        // Collapsed into a plain refusal, this looked exactly like the system
        // saying no, and the button wrote nothing at all when the answer had not
        // changed. macOS answers this way when a framework constant is missing.
        Err(error) => (false, Some(error.to_string())),
    };

    {
        let mut state = lock(app);

        // Written every time, refusal included: macOS grants nothing in the
        // second that follows the dialog, so the fact worth keeping is that the
        // button was pressed at all. `set_granted` only writes a change.
        state.log(JournalEvent::AuthorizationRequested { granted, failure });
        state.set_granted(granted);
    }

    follow_authorization(app);
}

/// Asks the window to show one screen, without saying anything about the rest.
///
/// Nothing is written when this does not arrive, and that is deliberate: the
/// window is brought forward in the same breath, so the user is looking at the
/// screen it landed on. A request that went missing costs one click on the rail
/// and is visible on the spot, which a journal line would not make any clearer.
pub fn navigate(app: &AppHandle, screen: Screen) {
    drop(app.emit(NAVIGATE_EVENT, screen));
}

/// Sends the user to the settings pane that grants the authorization.
///
/// The system dialog only offers to open it, and only the first time it is
/// asked. Reaching the right pane in one click is the difference between an
/// explanation and a dead end, which is why both the window and the system tray
/// offer it.
pub fn open_authorization_settings(app: &AppHandle) {
    let opened = app
        .opener()
        .open_url(AUTHORIZATION_SETTINGS_URL, None::<&str>);

    if let Err(error) = opened {
        lock(app).log(JournalEvent::OpenFailed {
            detail: error.to_string(),
        });

        // Nothing comes back from here, so the journal line has to be sent
        // rather than wait for a passing snapshot.
        emit_snapshot(app);
    }
}

/// Looks at the system now rather than at the next turn of the scan. No
/// snapshot: whoever asked for this is emitting one of their own.
pub fn refresh(app: &AppHandle) {
    scan(app);
}

/// Sends the whole dashboard to the interface and to the system tray, and hands it
/// back for whoever asked.
///
/// **Every path that changes anything ends here**, the commands included, which
/// is why it returns the snapshot rather than only sending it: a command that
/// built its own answer instead would leave the system tray behind, and that is
/// exactly the bug this shape prevents. The two surfaces draw the same roster
/// and they are refreshed together or not at all.
///
/// Calling it on a change the menu does not show costs one comparison, since
/// [`tray::refresh`] does nothing when the lines have not moved.
///
/// The lock is taken and given back before [`tray::refresh`] runs, and that is
/// not incidental: the menu setters block on the main thread, which is where
/// every command takes this lock. See the note on [`crate::app::tray`].
/// The failure of this emission is the one thing the window can never show, since
/// the journal travels inside the very payload that did not arrive: the board
/// stays frozen on an older roster and looks like a Multifus that has stopped.
/// It is in the file, and that is the plainest argument for the file.
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

/// The watcher, taken even if a previous holder panicked. See the note on
/// [`crate::app::state::lock`].
fn watcher(app: &AppHandle) -> MutexGuard<'_, PlatformNotificationWatcher> {
    app.state::<WatcherState>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}
