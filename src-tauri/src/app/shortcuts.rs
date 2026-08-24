//! Every combination multifus lays on the system, and what it does when one
//! fires: the four actions of perimetre.md and the quick replies of ADR 0012.
//!
//! Two halves. [`apply`] hands the stored combinations to the global shortcut
//! plugin and writes down, binding by binding, what the system said. [`start`]
//! runs the thread that does the work when one of them fires.
//!
//! **The two families meet here and nowhere else.** [`Binding`] is what the
//! claimed table, the queue and the dispatch below speak in, so a combination
//! claimed twice is caught across the two at once.
//!
//! **Every failure is per binding.** Dracoon drops all of its shortcuts and puts
//! them back inside a `try` whose exception is swallowed, so one combination the
//! system will not take leaves the user with nothing bound and no message. Here
//! a combination that cannot be parsed, that another binding already claims, or
//! that the system turns down costs that one alone: the others go up, and the
//! reason reaches the screen inside the snapshot.
//!
//! **The answers reach the journal together, in one line.** They used to
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
//! window. So the handler does one thing, put the binding on a queue, and
//! [`start`]'s thread takes it from there. One thread and not one per press, so
//! that two presses are answered in the order they were made. A quick reply borrows
//! the clipboard and waits on it, which is the second reason that thread exists.

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
use crate::app::journal::QuickReplyFailure;
use crate::app::journal::RelayStop;
use crate::app::journal::ShortcutOutcome;
use crate::app::journal::Work;
use crate::app::quick_replies;
use crate::app::relay;
use crate::app::runtime;
use crate::app::state::lock;
use crate::app::state::ShortcutEffect;
use crate::app::view::Binding;
use crate::app::view::BindingView;
use crate::app::view::ShortcutAction;
use crate::app::view::ShortcutStatus;
use crate::platform::GameWindow;
use crate::platform::PlatformError;
use crate::platform::PlatformWindowManager;
use crate::platform::WindowManager;

/// The queue a fired shortcut travels on, from the main thread to the worker.
///
/// A [`Binding`] and never the text of a quick reply, which is read at the far end so
/// that a quick reply rewritten while multifus runs pastes what it says now.
pub type ShortcutQueue = Sender<Binding>;

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
    let (queue, bindings) = mpsc::channel::<Binding>();

    let spawned = thread::Builder::new()
        .name("multifus-shortcuts".to_owned())
        .spawn({
            let app = app.clone();

            move || {
                for binding in bindings {
                    if catch_unwind(AssertUnwindSafe(|| answer(&app, binding))).is_err() {
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

/// Lays every stored combination on the system and records the answers.
///
/// Called at startup and again every time one of them changes, a quick reply's
/// included. The lock on the state is deliberately not held across the plugin,
/// which hops to the main thread and waits for it; see the rule on
/// [`crate::app::state`].
pub fn apply(app: &AppHandle) {
    let wanted = lock(app).bindings();

    // Everything multifus put up comes down first, so a combination the user has
    // just freed stops answering rather than lingering until the next launch.
    if let Err(error) = app.global_shortcut().unregister_all() {
        lock(app).log_unless_repeated(JournalEvent::ShortcutsFailed {
            detail: error.to_string(),
        });
    }

    let mut claimed = HashMap::new();
    let mut bindings = Vec::new();

    for (binding, accelerator) in wanted {
        let status = bind(app, binding, accelerator.as_deref(), &mut claimed);

        bindings.push(BindingView {
            binding,
            accelerator,
            status,
        });
    }

    let statuses = bindings
        .iter()
        .map(|bound| (bound.binding, bound.status.clone()))
        .collect();

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
/// `claimed` carries the combinations the bindings before this one took. The
/// system keys a shortcut by the combination alone, so two of them on the same
/// keys are a thing it cannot hold: the second is turned down here, by name,
/// rather than sent to a plugin that would answer with a duplicate identifier.
/// Actions come before quick replies, so the name is always the one holding the keys.
fn bind(
    app: &AppHandle,
    binding: Binding,
    accelerator: Option<&str>,
    claimed: &mut HashMap<u32, Binding>,
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
        return ShortcutStatus::Duplicate { binding: *owner };
    }

    let handler_app = app.clone();
    let registered = app
        .global_shortcut()
        .on_shortcut(shortcut, move |_, _, event| {
            // Both halves of the key press come through here. Answering the release
            // as well would run every binding twice.
            if event.state() == ShortcutState::Pressed {
                fire(&handler_app, binding);
            }
        });

    match registered {
        Ok(()) => {
            claimed.insert(shortcut.id(), binding);

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
fn fire(app: &AppHandle, binding: Binding) {
    // `let _` rather than `drop`, which does nothing on a `Result` this small:
    // the binding is `Copy`, so the error carries a copy of it and the whole
    // thing is a `Copy` type.
    let _ = app.state::<ShortcutQueue>().send(binding);
}

/// Why the guard turned a key press down, before any binding was answered.
enum Refusal {
    /// The foreground window is not a game one.
    OutsideGame,
    /// The system would not say what is in front.
    ForegroundUnknown { detail: String },
}

/// One combination, answered on the worker thread.
///
/// **The guard of perimetre.md is asked once here and read once here**, for both
/// families. It hands back the window rather than a boolean because the veille
/// acts on the character in front, and asking twice would leave a gap.
fn answer(app: &AppHandle, binding: Binding) {
    let foreground = app
        .state::<PlatformWindowManager>()
        .foreground_game_window();

    match foreground {
        Ok(Some(window)) => {
            // Behind the guard and not in `fire`, which is reached by every key
            // press anywhere: a game window is in front and a hand is on the
            // keyboard, so the user is back. Whatever the binding settles on.
            relay::run::stop(app, RelayStop::Shortcut);

            act_on(app, binding, &window);
        }
        // Inert outside the game. Without this a `Control+Shift+arrow` would eat
        // word navigation in every text editor on the desktop.
        Ok(None) => refused(app, binding, Refusal::OutsideGame),
        Err(error) => refused(
            app,
            binding,
            Refusal::ForegroundUnknown {
                detail: error.to_string(),
            },
        ),
    }

    // The snapshot goes out either way, and never on the condition that the
    // journal accepted the line. The veille and the swap change the roster, and
    // two identical outcomes in a row do not mean the roster is where it was:
    // waking a character from its row writes nothing to the journal, so the next
    // veille shortcut would repeat its predecessor and the screen would keep
    // showing an awake character that is asleep.
    runtime::emit_snapshot(app);
}

/// Does what the binding asks, the game being in front.
fn act_on(app: &AppHandle, binding: Binding, window: &GameWindow) {
    match binding {
        Binding::Action { action } => {
            let outcome = act(app, action, window.nickname());

            // Not repeated: `Suivant` on a single connected character answers the
            // same thing every time, and it would flush the journal.
            lock(app).log_unless_repeated(JournalEvent::Shortcut { action, outcome });
        }
        Binding::QuickReply { id } => quick_replies::paste(app, id),
    }
}

/// Writes down a key press the guard turned down, in the words of its family.
fn refused(app: &AppHandle, binding: Binding, refusal: Refusal) {
    let event = match binding {
        Binding::Action { action } => JournalEvent::Shortcut {
            action,
            outcome: match refusal {
                Refusal::OutsideGame => ShortcutOutcome::OutsideGame,
                Refusal::ForegroundUnknown { detail } => {
                    ShortcutOutcome::ForegroundUnknown { detail }
                }
            },
        },
        Binding::QuickReply { .. } => JournalEvent::QuickReplyFailed {
            reason: match refusal {
                Refusal::OutsideGame => QuickReplyFailure::OutsideGame,
                Refusal::ForegroundUnknown { detail } => {
                    QuickReplyFailure::ForegroundUnknown { detail }
                }
            },
        },
    };

    // Mashing a key outside the game says the same thing about the same press,
    // and written every time it would flush what explains a real failure out of
    // a journal that holds two hundred lines.
    lock(app).log_unless_repeated(event);
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
