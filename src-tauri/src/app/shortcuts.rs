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
use crate::app::state::windows;
use crate::app::state::ShortcutEffect;
use crate::app::view::Binding;
use crate::app::view::BindingView;
use crate::app::view::ShortcutAction;
use crate::app::view::ShortcutStatus;
use crate::app::walk;
use crate::platform::GameWindow;
use crate::platform::PlatformError;
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

fn claim(
    accelerator: Option<&str>,
    claimed: &HashMap<u32, Binding>,
) -> Result<Shortcut, ShortcutStatus> {
    let Some(accelerator) = accelerator else {
        return Err(ShortcutStatus::Unbound);
    };

    let shortcut = accelerator
        .parse::<Shortcut>()
        .map_err(|error| ShortcutStatus::Invalid {
            detail: error.to_string(),
        })?;

    match claimed.get(&shortcut.id()) {
        Some(owner) => Err(ShortcutStatus::Duplicate { binding: *owner }),
        None => Ok(shortcut),
    }
}

fn bind(
    app: &AppHandle,
    binding: Binding,
    accelerator: Option<&str>,
    claimed: &mut HashMap<u32, Binding>,
) -> ShortcutStatus {
    let shortcut = match claim(accelerator, claimed) {
        Ok(shortcut) => shortcut,
        Err(refusal) => return refusal,
    };

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

    let foreground = windows(app).foreground_game_window();

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
            let effect = lock(app).decide_shortcut(action, window.nickname());
            let outcome = act(windows(app), effect);

            lock(app).log_unless_repeated(JournalEvent::Shortcut { action, outcome });
        }
        Binding::QuickReply { id } => quick_replies::paste(app, id),
    }
}

fn refused(app: &AppHandle, binding: Binding, refusal: Refusal) {
    lock(app).log_unless_repeated(refusal_said(binding, refusal));
}

fn refusal_said(binding: Binding, refusal: Refusal) -> JournalEvent {
    match binding {
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
    }
}

fn act(windows: &dyn WindowManager, effect: ShortcutEffect) -> ShortcutOutcome {
    match effect {
        ShortcutEffect::Settled(outcome) => outcome,
        ShortcutEffect::Focus { nickname, window } => match windows.focus(window) {
            Ok(()) => ShortcutOutcome::Focused { nickname },
            Err(PlatformError::WindowGone) => ShortcutOutcome::NoWindow { nickname },
            Err(error) => ShortcutOutcome::FocusFailed {
                nickname,
                detail: error.to_string(),
            },
        },
    }
}

#[cfg(test)]
mod tests {
    use tempfile::TempDir;

    use super::*;
    use crate::app::state::hold;
    use crate::app::state::AppState;
    use crate::config::QuickReplyId;
    use crate::config::Settings;
    use crate::domain::Character;
    use crate::domain::Roster;
    use crate::platform::WindowId;
    use crate::test_doubles::app_state;
    use crate::test_doubles::directory;
    use crate::test_doubles::game_window;
    use crate::test_doubles::Asked;
    use crate::test_doubles::Desktop;
    use crate::test_doubles::FakeWindowManager;

    fn three_in_the_cycle(directory: &TempDir) -> AppState {
        let state = app_state(
            directory,
            Settings {
                roster: Roster::from_characters(vec![
                    Character::new("Alpha"),
                    Character::new("Bravo"),
                    Character::new("Charlie"),
                ]),
                ..Settings::default()
            },
        );

        hold(&state).apply_windows(&[
            game_window(1, "Alpha"),
            game_window(2, "Bravo"),
            game_window(3, "Charlie"),
        ]);

        state
    }

    fn pressed(
        state: &AppState,
        windows: &FakeWindowManager,
        action: ShortcutAction,
    ) -> ShortcutOutcome {
        let effect = hold(state).decide_shortcut(action, "Alpha");

        act(windows, effect)
    }

    #[test]
    fn a_shortcut_struck_outside_the_game_does_nothing_and_the_journal_says_which() {
        let action = Binding::Action {
            action: ShortcutAction::Next,
        };
        let quick_reply = Binding::QuickReply {
            id: QuickReplyId::default(),
        };

        assert_eq!(
            refusal_said(action, Refusal::OutsideGame),
            JournalEvent::Shortcut {
                action: ShortcutAction::Next,
                outcome: ShortcutOutcome::OutsideGame,
            }
        );
        assert_eq!(
            refusal_said(quick_reply, Refusal::OutsideGame),
            JournalEvent::QuickReplyFailed {
                reason: QuickReplyFailure::OutsideGame,
            }
        );
    }

    #[test]
    fn a_foreground_the_system_will_not_name_is_said_with_its_reason() {
        let detail = "the system said no".to_owned();

        assert_eq!(
            refusal_said(
                Binding::Action {
                    action: ShortcutAction::Swap
                },
                Refusal::ForegroundUnknown {
                    detail: detail.clone()
                }
            ),
            JournalEvent::Shortcut {
                action: ShortcutAction::Swap,
                outcome: ShortcutOutcome::ForegroundUnknown {
                    detail: detail.clone(),
                },
            }
        );
        assert_eq!(
            refusal_said(
                Binding::QuickReply {
                    id: QuickReplyId::default()
                },
                Refusal::ForegroundUnknown {
                    detail: detail.clone()
                }
            ),
            JournalEvent::QuickReplyFailed {
                reason: QuickReplyFailure::ForegroundUnknown { detail },
            }
        );
    }

    #[test]
    fn a_combination_the_cycle_already_took_is_refused_by_the_name_of_its_owner() {
        let next = Binding::Action {
            action: ShortcutAction::Next,
        };
        let mut claimed = HashMap::new();
        let shortcut = claim(Some("Alt+Right"), &claimed).expect("a free combination");

        claimed.insert(shortcut.id(), next);

        assert_eq!(
            claim(Some("Alt+Right"), &claimed),
            Err(ShortcutStatus::Duplicate { binding: next })
        );
        assert!(claim(Some("Alt+Left"), &claimed).is_ok());
    }

    #[test]
    fn a_combination_nobody_can_read_is_refused_and_an_empty_one_binds_nothing() {
        let claimed = HashMap::new();

        assert!(matches!(
            claim(Some("Alt+Nowhere"), &claimed),
            Err(ShortcutStatus::Invalid { .. })
        ));
        assert_eq!(claim(None, &claimed), Err(ShortcutStatus::Unbound));
    }

    #[test]
    fn the_cycle_shortcuts_bring_the_window_on_each_side_of_the_one_in_front() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop::default());

        assert_eq!(
            pressed(&state, &windows, ShortcutAction::Next),
            ShortcutOutcome::Focused {
                nickname: "Bravo".to_owned(),
            }
        );
        assert_eq!(
            pressed(&state, &windows, ShortcutAction::Previous),
            ShortcutOutcome::Focused {
                nickname: "Charlie".to_owned(),
            }
        );
        assert_eq!(
            windows.asked(),
            vec![
                Asked::Focused(WindowId::from_raw(2)),
                Asked::Focused(WindowId::from_raw(3)),
            ]
        );
    }

    #[test]
    fn a_window_that_closed_between_two_presses_is_told_apart_from_a_switch_that_failed() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop {
            focus_refusal: Some(PlatformError::WindowGone),
            ..Desktop::default()
        });

        assert_eq!(
            pressed(&state, &windows, ShortcutAction::Next),
            ShortcutOutcome::NoWindow {
                nickname: "Bravo".to_owned(),
            }
        );

        windows.show(Desktop {
            focus_refusal: Some(PlatformError::system("focusing", "the system said no")),
            ..Desktop::default()
        });

        assert_eq!(
            pressed(&state, &windows, ShortcutAction::Next),
            ShortcutOutcome::FocusFailed {
                nickname: "Bravo".to_owned(),
                detail: "focusing failed: the system said no".to_owned(),
            }
        );
    }

    #[test]
    fn a_shortcut_that_settles_by_itself_never_touches_a_window() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop::default());

        assert_eq!(
            pressed(&state, &windows, ShortcutAction::Swap),
            ShortcutOutcome::NoGender,
            "nobody has a gender yet, so there is nobody to put aside"
        );
        assert_eq!(windows.asked(), Vec::new());
    }
}
