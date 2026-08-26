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
use crate::app::journal::WalkFrom;
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
use crate::app::walk;
use crate::platform::GameWindow;
use crate::platform::PlatformError;
use crate::platform::PlatformWindowManager;
use crate::platform::WindowManager;

pub type ShortcutQueue = Sender<Binding>;

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
        lock(app).log(JournalEvent::ShortcutsFailed {
            detail: error.to_string(),
        });
    }

    app.manage::<ShortcutQueue>(queue);
}

pub fn apply(app: &AppHandle) {
    let wanted = lock(app).bindings();

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
    state.log(JournalEvent::ShortcutsBound { bindings });
}

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

fn fire(app: &AppHandle, binding: Binding) {
    let _ = app.state::<ShortcutQueue>().send(binding);
}

enum Refusal {
    OutsideGame,
    ForegroundUnknown { detail: String },
}

fn answer(app: &AppHandle, binding: Binding) {
    if matches!(
        binding,
        Binding::Action {
            action: ShortcutAction::Walk
        }
    ) {
        walk::toggle(app, WalkFrom::Shortcut);

        runtime::emit_snapshot(app);

        return;
    }

    let foreground = app
        .state::<PlatformWindowManager>()
        .foreground_game_window();

    match foreground {
        Ok(Some(window)) => {
            relay::run::stop(app, RelayStop::Shortcut);

            act_on(app, binding, &window);
        }
        Ok(None) => refused(app, binding, Refusal::OutsideGame),
        Err(error) => refused(
            app,
            binding,
            Refusal::ForegroundUnknown {
                detail: error.to_string(),
            },
        ),
    }

    runtime::emit_snapshot(app);
}

fn act_on(app: &AppHandle, binding: Binding, window: &GameWindow) {
    match binding {
        Binding::Action { action } => {
            let outcome = act(app, action, window.nickname());

            lock(app).log_unless_repeated(JournalEvent::Shortcut { action, outcome });
        }
        Binding::QuickReply { id } => quick_replies::paste(app, id),
    }
}

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

    lock(app).log_unless_repeated(event);
}

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
