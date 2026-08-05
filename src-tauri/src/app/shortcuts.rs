//! The four combinations of perimetre.md, laid on the system and answered for.
//!
//! Two halves. [`apply`] hands the stored combinations to the global shortcut
//! plugin and writes down, action by action, what the system said. [`start`]
//! runs the thread that does the work when one of them fires.
//!
//! **Every failure is per action.** Dracoon drops all of its shortcuts and puts
//! them back inside a `try` whose exception is swallowed, so one combination the
//! system will not take leaves the user with nothing bound and no message. Here
//! a combination that cannot be parsed, that another action already claims, or
//! that the system turns down costs that action alone: the other three go up,
//! and the reason reaches the screen inside the snapshot.
//!
//! **The four answers reach the journal together, in one line.** They used to
//! reach it one at a time and only when they failed with words from the system,
//! which left two holes. A duplicate wrote nothing, on the grounds that the
//! screen shows both combinations; but a duplicate is never registered, so it
//! never fires either, and the journal was then silent from end to end about a
//! dead shortcut. And a combination that worked wrote nothing at all, so a
//! transcript never said which keys were bound when it was recorded. One line for
//! the set answers both, and it is short enough to write at every launch.
//!
//! **What the system accepts is not what will fire.** On macOS a combination
//! another application or the desktop itself already owns registers cleanly and
//! is then simply never delivered: Carbon only refuses a duplicate of the same
//! process. Windows is the honest one, `RegisterHotKey` fails outright when
//! another process holds the combination. So [`ShortcutStatus::Registered`]
//! means the system took it, never that it will work, and the interface is
//! worded to match. A combination that seems dead is diagnosed from the journal,
//! where an outcome is written every time one fires.
//!
//! **Nothing happens on the thread the plugin calls.** That thread is the main
//! one, where the event loop and the interface live, and the work here starts
//! with an Accessibility round trip into a game client. Measured against a
//! running Dofus Retro client it costs about a twentieth of a millisecond, but a
//! client that has stopped answering blocks that call until the system's
//! messaging timeout, and paying that on the main thread would freeze the
//! window. So the handler does one thing, put the action on a queue, and
//! [`start`]'s thread takes it from there. One thread and not one per press, so
//! that two presses are answered in the order they were made.

use std::collections::HashMap;
use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::sync::mpsc;
use std::sync::mpsc::Sender;
use std::thread;

use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_global_shortcut::GlobalShortcutExt;
use tauri_plugin_global_shortcut::Shortcut;
use tauri_plugin_global_shortcut::ShortcutState;

use crate::app::journal::JournalEvent;
use crate::app::journal::ShortcutOutcome;
use crate::app::journal::Work;
use crate::app::runtime;
use crate::app::state::lock;
use crate::app::state::ShortcutEffect;
use crate::app::view::ShortcutAction;
use crate::app::view::ShortcutStatus;
use crate::app::view::ShortcutView;
use crate::platform::PlatformError;
use crate::platform::PlatformWindowManager;
use crate::platform::WindowManager;

/// The queue a fired shortcut travels on, from the main thread to the worker.
pub type ShortcutQueue = Sender<ShortcutAction>;

/// Starts the thread that answers the shortcuts, for the life of the process.
///
/// The queue is put in the Tauri state whether or not the thread came up.
///
/// **One key press cannot cost the other three combinations.** Answering a
/// shortcut goes into a game client through Accessibility, and a panic there used
/// to end this thread for good: every combination stayed registered, kept being
/// delivered, and did nothing, with the journal saying only what
/// [`fire`] could not say. Each answer is caught on its own now.
pub fn start(app: &AppHandle) {
    let (queue, actions) = mpsc::channel::<ShortcutAction>();

    let spawned = thread::Builder::new()
        .name("multifus-shortcuts".to_owned())
        .spawn({
            let app = app.clone();

            move || {
                for action in actions {
                    if catch_unwind(AssertUnwindSafe(|| answer(&app, action))).is_err() {
                        lock(&app).log_unless_repeated(JournalEvent::Panicked {
                            work: Work::Shortcuts,
                        });
                    }
                }
            }
        });

    if let Err(error) = spawned {
        // Without this thread every combination is dead, however well it
        // registers. It has to be said rather than swallowed.
        lock(app).log(JournalEvent::ShortcutsFailed {
            detail: error.to_string(),
        });
    }

    app.manage::<ShortcutQueue>(queue);
}

/// Lays the four stored combinations on the system and records the answers.
///
/// Called at startup and again every time one of them changes. The lock on the
/// state is deliberately not held across the plugin, which hops to the main
/// thread and waits for it; see the rule on [`crate::app::state`].
pub fn apply(app: &AppHandle) {
    let wanted = {
        let state = lock(app);

        ShortcutAction::ALL.map(|action| (action, state.accelerator(action)))
    };

    // Everything multifus put up comes down first, so a combination the user has
    // just freed stops answering rather than lingering until the next launch.
    if let Err(error) = app.global_shortcut().unregister_all() {
        lock(app).log_unless_repeated(JournalEvent::ShortcutsFailed {
            detail: error.to_string(),
        });
    }

    let mut claimed = HashMap::new();
    let mut statuses = HashMap::new();
    let mut bindings = Vec::new();

    for (action, accelerator) in wanted {
        let status = bind(app, action, accelerator.as_deref(), &mut claimed);

        bindings.push(ShortcutView {
            action,
            accelerator,
            status: status.clone(),
        });
        statuses.insert(action, status);
    }

    let mut state = lock(app);

    state.set_shortcut_statuses(statuses);
    // The whole set, laid down or turned down. Written unconditionally rather
    // than only on a failure: a transcript that does not say which keys were
    // bound cannot be read on its own, and the one status nobody used to write,
    // a duplicate, is the one that never fires and never writes anything else.
    state.log(JournalEvent::ShortcutsBound { bindings });
}

/// Lays one combination down and says what became of it.
///
/// `claimed` carries the combinations the actions before this one took. The
/// system keys a shortcut by the combination alone, so two actions on the same
/// keys are a thing it cannot hold: the second is turned down here, by name,
/// rather than sent to a plugin that would answer with a duplicate identifier.
fn bind(
    app: &AppHandle,
    action: ShortcutAction,
    accelerator: Option<&str>,
    claimed: &mut HashMap<u32, ShortcutAction>,
) -> ShortcutStatus {
    let Some(accelerator) = accelerator else {
        return ShortcutStatus::Unbound;
    };

    let shortcut = match accelerator.parse::<Shortcut>() {
        Ok(shortcut) => shortcut,
        Err(error) => {
            return ShortcutStatus::Invalid {
                detail: error.to_string(),
            }
        }
    };

    if let Some(owner) = claimed.get(&shortcut.id()) {
        return ShortcutStatus::Duplicate { action: *owner };
    }

    let handler_app = app.clone();
    let registered = app
        .global_shortcut()
        .on_shortcut(shortcut, move |_, _, event| {
            // Both halves of the key press come through here. Answering the release
            // as well would run every action twice.
            if event.state() == ShortcutState::Pressed {
                fire(&handler_app, action);
            }
        });

    match registered {
        Ok(()) => {
            claimed.insert(shortcut.id(), action);

            ShortcutStatus::Registered
        }
        Err(error) => ShortcutStatus::Refused {
            detail: error.to_string(),
        },
    }
}

/// Called by the plugin on the main thread. Queues, and returns immediately.
///
/// **Nothing is written here**, and the reason is that there is nothing left to
/// write. A send that fails means nobody is reading the queue, and there are
/// exactly two ways to get there: the thread never came up, which [`start`] wrote
/// down, or it died, which it no longer does since each answer is caught. Saying
/// it again on every key press would bury both.
///
/// Taking the state lock here would not deadlock, and an earlier version of this
/// comment claimed it would: [`crate::app::tray::on_menu_event`] takes it on this
/// same thread for three of its items. The rule on [`crate::app::state`] forbids
/// *holding* it across a call that waits on the main thread, which is a different
/// thing. It is left alone because it buys nothing, not because it is unsafe.
fn fire(app: &AppHandle, action: ShortcutAction) {
    // `let _` rather than `drop`, which does nothing on a `Result` this small:
    // the action is `Copy`, so the error carries a copy of it and the whole thing
    // is a `Copy` type.
    let _ = app.state::<ShortcutQueue>().send(action);
}

/// One shortcut, answered on the worker thread.
///
/// The guard of perimetre.md is the first thing here and it is the reason the
/// boundary hands back the window rather than a bare boolean: the veille acts on
/// the character in front, and asking twice would leave room for the foreground
/// to change in between.
fn answer(app: &AppHandle, action: ShortcutAction) {
    let foreground = app
        .state::<PlatformWindowManager>()
        .foreground_game_window();

    let outcome = match foreground {
        // Inert outside the game. Without this a `Control+Shift+arrow` would eat
        // word navigation in every text editor on the desktop.
        Ok(None) => ShortcutOutcome::OutsideGame,
        Ok(Some(window)) => act(app, action, window.nickname()),
        Err(error) => ShortcutOutcome::ForegroundUnknown {
            detail: error.to_string(),
        },
    };

    // Mashing a key outside the game says the same thing about the same press,
    // and written every time it would flush what explains a real failure out of
    // a journal that holds two hundred lines.
    lock(app).log_unless_repeated(JournalEvent::Shortcut { action, outcome });

    // The snapshot goes out either way, and never on the condition that the
    // journal accepted the line. The veille and the swap change the roster, and
    // two identical outcomes in a row do not mean the roster is where it was:
    // waking a character from its row writes nothing to the journal, so the next
    // veille shortcut would repeat its predecessor and the screen would keep
    // showing an awake character that is asleep.
    runtime::emit_snapshot(app);
}

/// Does what the action asks, once the character in front is known.
fn act(app: &AppHandle, action: ShortcutAction, nickname: &str) -> ShortcutOutcome {
    let effect = lock(app).decide_shortcut(action, nickname);

    match effect {
        ShortcutEffect::Settled(outcome) => outcome,
        ShortcutEffect::Focus { nickname, window } => {
            match app.state::<PlatformWindowManager>().focus(window) {
                Ok(()) => ShortcutOutcome::Focused { nickname },
                Err(PlatformError::WindowGone) => ShortcutOutcome::NoWindow { nickname },
                Err(error) => ShortcutOutcome::FocusFailed {
                    nickname,
                    detail: error.to_string(),
                },
            }
        }
    }
}
