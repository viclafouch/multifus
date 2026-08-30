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

use crate::app::journal::CharacterShortcutOutcome;
use crate::app::journal::JournalEvent;
use crate::app::journal::QuickReplyFailure;
use crate::app::journal::RelayStop;
use crate::app::journal::ShortcutOutcome;
use crate::app::journal::Surface;
use crate::app::journal::WalkFrom;
use crate::app::journal::Work;
use crate::app::quick_replies;
use crate::app::relay;
use crate::app::rune_table;
use crate::app::runtime;
use crate::app::state::hold;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::app::state::AppState;
use crate::app::state::CharacterAim;
use crate::app::state::ShortcutEffect;
use crate::app::view::Binding;
use crate::app::view::BindingView;
use crate::app::view::ShortcutAction;
use crate::app::view::ShortcutStatus;
use crate::app::walk;
use crate::app::wheel;
use crate::app::Multifus;
use crate::config::QuickReplyId;
use crate::platform::GameWindow;
use crate::platform::PlatformError;
use crate::platform::WindowId;
use crate::platform::WindowManager;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Struck {
    Pressed(Binding),
    Released(Binding),
}

pub type ShortcutQueue = Sender<Struck>;

pub fn start(app: &AppHandle) {
    let (queue, bindings) = mpsc::channel::<Struck>();

    let spawned = thread::Builder::new()
        .name("multifus-shortcuts".to_owned())
        .spawn({
            let app = app.clone();

            move || {
                for struck in bindings {
                    if catch_unwind(AssertUnwindSafe(|| on_struck(&app, struck))).is_err() {
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

pub fn suspend(app: &AppHandle) {
    let mut state = lock(app);

    forget(app, &mut state);
}

fn forget(app: &AppHandle, state: &mut Multifus) {
    if let Err(error) = app.global_shortcut().unregister_all() {
        state.log_unless_repeated(JournalEvent::ShortcutsFailed {
            detail: error.to_string(),
        });
    }
}

pub fn apply(app: &AppHandle) {
    let mut state = lock(app);

    let wanted = state.bindings();
    let held = state.held();

    forget(app, &mut state);

    let mut claimed = HashMap::new();
    let mut statuses = vec![ShortcutStatus::Unbound; wanted.len()];

    for index in claiming_order(&wanted, &held) {
        let (binding, accelerator) = &wanted[index];

        statuses[index] = bind(app, binding.clone(), accelerator.as_deref(), &mut claimed);
    }

    let bindings = wanted
        .into_iter()
        .zip(statuses)
        .map(|((binding, accelerator), status)| BindingView {
            binding,
            accelerator,
            status,
        })
        .collect::<Vec<_>>();

    let told = bindings
        .iter()
        .filter(|bound| is_worth_telling(bound))
        .cloned()
        .collect();

    state.remember_bound(&bindings);
    state.log_unless_repeated(JournalEvent::ShortcutsBound { bindings: told });
}

fn claiming_order(
    wanted: &[(Binding, Option<String>)],
    held: &HashMap<Binding, String>,
) -> Vec<usize> {
    let (keeping, asking): (Vec<usize>, Vec<usize>) = (0..wanted.len()).partition(|index| {
        let (binding, accelerator) = &wanted[*index];

        accelerator
            .as_ref()
            .is_some_and(|accelerator| held.get(binding) == Some(accelerator))
    });

    keeping.into_iter().chain(asking).collect()
}

fn is_worth_telling(bound: &BindingView) -> bool {
    !matches!(
        (&bound.binding, &bound.status),
        (Binding::Character { .. }, ShortcutStatus::Unbound)
    )
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
        Some(owner) => Err(ShortcutStatus::Duplicate {
            binding: owner.clone(),
        }),
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
    let struck_binding = binding.clone();
    let posted = app
        .global_shortcut()
        .on_shortcut(shortcut, move |_, _, event| {
            if let Some(struck) = struck_as(event.state(), &struck_binding) {
                fire(&handler_app, struck);
            }
        });

    match posted {
        Ok(()) => {
            claimed.insert(shortcut.id(), binding);

            ShortcutStatus::Registered
        }
        Err(error) => ShortcutStatus::Refused {
            detail: error.to_string(),
        },
    }
}

fn struck_as(state: ShortcutState, binding: &Binding) -> Option<Struck> {
    match state {
        ShortcutState::Pressed => Some(Struck::Pressed(binding.clone())),
        ShortcutState::Released => matches_held(binding).then(|| Struck::Released(binding.clone())),
    }
}

fn matches_held(binding: &Binding) -> bool {
    matches!(binding, Binding::Action { action } if action.matches_held())
}

fn fire(app: &AppHandle, struck: Struck) {
    let _ = app.state::<ShortcutQueue>().send(struck);
}

enum Refusal {
    OutsideGame,
    ForegroundUnknown { detail: String },
}

trait Mechanisms {
    fn toggle_walk(&self);

    fn maximize_all(&self);

    fn stop_relay(&self);

    fn paste_quick_reply(&self, id: QuickReplyId);

    fn open_wheel(&self, here: WindowId);

    fn release_wheel(&self);

    fn toggle_rune_table(&self, here: WindowId);
}

struct AppMechanisms<'a>(&'a AppHandle);

impl Mechanisms for AppMechanisms<'_> {
    fn toggle_walk(&self) {
        walk::toggle(self.0, WalkFrom::Shortcut);
    }

    fn maximize_all(&self) {
        runtime::maximize_all(self.0, Surface::Shortcut);
    }

    fn stop_relay(&self) {
        relay::run::stop(self.0, RelayStop::Shortcut);
    }

    fn paste_quick_reply(&self, id: QuickReplyId) {
        quick_replies::paste(self.0, id);
    }

    fn open_wheel(&self, here: WindowId) {
        wheel::open(self.0, here);
    }

    fn release_wheel(&self) {
        wheel::release(self.0);
    }

    fn toggle_rune_table(&self, here: WindowId) {
        rune_table::toggle(self.0, Some(here));
    }
}

struct Press<'a> {
    windows: &'a dyn WindowManager,
    state: &'a AppState,
    mechanisms: &'a dyn Mechanisms,
}

fn on_struck(app: &AppHandle, struck: Struck) {
    answer(
        &Press {
            windows: windows(app),
            state: app.state::<AppState>().inner(),
            mechanisms: &AppMechanisms(app),
        },
        struck,
    );

    runtime::emit_snapshot(app);
}

fn answer(press: &Press, struck: Struck) {
    let binding = match struck {
        Struck::Released(binding) => {
            if matches_held(&binding) {
                press.mechanisms.release_wheel();
            }

            return;
        }
        Struck::Pressed(binding) => binding,
    };

    match press.windows.foreground_game_window() {
        Ok(Some(window)) => {
            press.mechanisms.stop_relay();

            act_on(press, binding, &window);
        }
        Ok(None) => refused(press, binding, Refusal::OutsideGame),
        Err(error) => refused(
            press,
            binding,
            Refusal::ForegroundUnknown {
                detail: error.to_string(),
            },
        ),
    }
}

fn act_on(press: &Press, binding: Binding, window: &GameWindow) {
    match binding {
        Binding::Action {
            action: ShortcutAction::Walk,
        } => press.mechanisms.toggle_walk(),
        Binding::Action {
            action: ShortcutAction::MaximizeAll,
        } => press.mechanisms.maximize_all(),
        Binding::Action {
            action: ShortcutAction::Wheel,
        } => press.mechanisms.open_wheel(window.id()),
        Binding::Action {
            action: ShortcutAction::RuneTable,
        } => press.mechanisms.toggle_rune_table(window.id()),
        Binding::Action { action } => {
            let Some(effect) = hold(press.state).decide_shortcut(action, window.nickname()) else {
                return;
            };

            let outcome = act(press.windows, effect);

            hold(press.state).log_unless_repeated(JournalEvent::Shortcut { action, outcome });
        }
        Binding::Character { nickname } => {
            let aim = hold(press.state).decide_character_shortcut(&nickname, window.nickname());
            let outcome = aim_at(press.windows, aim);

            hold(press.state)
                .log_unless_repeated(JournalEvent::CharacterShortcut { nickname, outcome });
        }
        Binding::QuickReply { id } => press.mechanisms.paste_quick_reply(id),
    }
}

fn refused(press: &Press, binding: Binding, refusal: Refusal) {
    hold(press.state).log_unless_repeated(refusal_said(binding, refusal));
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
        Binding::Character { nickname } => JournalEvent::CharacterShortcut {
            nickname,
            outcome: match refusal {
                Refusal::OutsideGame => CharacterShortcutOutcome::OutsideGame,
                Refusal::ForegroundUnknown { detail } => {
                    CharacterShortcutOutcome::ForegroundUnknown { detail }
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

enum Landing {
    Arrived,
    WindowGone,
    Refused { detail: String },
}

fn land(windows: &dyn WindowManager, window: WindowId) -> Landing {
    match windows.focus(window) {
        Ok(()) => Landing::Arrived,
        Err(PlatformError::WindowGone) => Landing::WindowGone,
        Err(error) => Landing::Refused {
            detail: error.to_string(),
        },
    }
}

fn aim_at(windows: &dyn WindowManager, aim: CharacterAim) -> CharacterShortcutOutcome {
    match aim {
        CharacterAim::Settled(outcome) => outcome,
        CharacterAim::Focus { window } => match land(windows, window) {
            Landing::Arrived => CharacterShortcutOutcome::Focused,
            Landing::WindowGone => CharacterShortcutOutcome::NoWindow,
            Landing::Refused { detail } => CharacterShortcutOutcome::FocusFailed { detail },
        },
    }
}

fn act(windows: &dyn WindowManager, effect: ShortcutEffect) -> ShortcutOutcome {
    match effect {
        ShortcutEffect::Settled(outcome) => outcome,
        ShortcutEffect::Focus { nickname, window } => match land(windows, window) {
            Landing::Arrived => ShortcutOutcome::Focused { nickname },
            Landing::WindowGone => ShortcutOutcome::NoWindow { nickname },
            Landing::Refused { detail } => ShortcutOutcome::FocusFailed { nickname, detail },
        },
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;
    use std::sync::PoisonError;

    use tempfile::TempDir;

    use super::*;
    use crate::config::Settings;
    use crate::domain::Character;
    use crate::domain::Roster;
    use crate::platform::WindowId;
    use crate::test_doubles::app_state;
    use crate::test_doubles::directory;
    use crate::test_doubles::game_window;
    use crate::test_doubles::journalled;
    use crate::test_doubles::Asked;
    use crate::test_doubles::Desktop;
    use crate::test_doubles::FakeWindowManager;

    #[derive(Debug, Clone, PartialEq, Eq)]
    enum Mechanism {
        WalkToggled,
        AllMaximized,
        RelayStopped,
        QuickReplyPasted(QuickReplyId),
        WheelOpened(WindowId),
        WheelReleased,
        RuneTableToggled(WindowId),
    }

    #[derive(Debug, Default)]
    struct FakeMechanisms {
        set_going: Mutex<Vec<Mechanism>>,
    }

    impl FakeMechanisms {
        fn set_going(&self) -> Vec<Mechanism> {
            self.set_going
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .clone()
        }

        fn write_down(&self, mechanism: Mechanism) {
            self.set_going
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .push(mechanism);
        }
    }

    impl Mechanisms for FakeMechanisms {
        fn toggle_walk(&self) {
            self.write_down(Mechanism::WalkToggled);
        }

        fn maximize_all(&self) {
            self.write_down(Mechanism::AllMaximized);
        }

        fn stop_relay(&self) {
            self.write_down(Mechanism::RelayStopped);
        }

        fn paste_quick_reply(&self, id: QuickReplyId) {
            self.write_down(Mechanism::QuickReplyPasted(id));
        }

        fn open_wheel(&self, here: WindowId) {
            self.write_down(Mechanism::WheelOpened(here));
        }

        fn release_wheel(&self) {
            self.write_down(Mechanism::WheelReleased);
        }

        fn toggle_rune_table(&self, here: WindowId) {
            self.write_down(Mechanism::RuneTableToggled(here));
        }
    }

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

    fn answering(press: &Press, binding: Binding) {
        answer(press, Struck::Pressed(binding));
    }

    fn pressed(
        state: &AppState,
        windows: &FakeWindowManager,
        action: ShortcutAction,
    ) -> ShortcutOutcome {
        let effect = hold(state)
            .decide_shortcut(action, "Alpha")
            .expect("this action decides something of the window in front");

        act(windows, effect)
    }

    #[test]
    fn a_shortcut_struck_outside_the_game_does_nothing_and_the_journal_says_which() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop::default());
        let mechanisms = FakeMechanisms::default();
        let press = Press {
            windows: windows.as_ref(),
            state: &state,
            mechanisms: &mechanisms,
        };

        answering(
            &press,
            Binding::Action {
                action: ShortcutAction::Next,
            },
        );
        answering(
            &press,
            Binding::QuickReply {
                id: QuickReplyId::default(),
            },
        );

        assert_eq!(
            journalled(&state),
            vec![
                JournalEvent::Shortcut {
                    action: ShortcutAction::Next,
                    outcome: ShortcutOutcome::OutsideGame,
                },
                JournalEvent::QuickReplyFailed {
                    reason: QuickReplyFailure::OutsideGame,
                },
            ]
        );
        assert_eq!(windows.asked(), Vec::new());
        assert_eq!(
            mechanisms.set_going(),
            Vec::new(),
            "the private messages keep going while the player is not at the game"
        );
    }

    #[test]
    fn a_foreground_the_system_will_not_name_is_said_with_its_reason() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            scan_refusal: Some(PlatformError::system(
                "reading the foreground",
                "the system said no",
            )),
            ..Desktop::default()
        });
        let mechanisms = FakeMechanisms::default();
        let press = Press {
            windows: windows.as_ref(),
            state: &state,
            mechanisms: &mechanisms,
        };
        let detail = "reading the foreground failed: the system said no".to_owned();

        answering(
            &press,
            Binding::Action {
                action: ShortcutAction::Next,
            },
        );
        answering(
            &press,
            Binding::QuickReply {
                id: QuickReplyId::default(),
            },
        );

        assert_eq!(
            journalled(&state),
            vec![
                JournalEvent::Shortcut {
                    action: ShortcutAction::Next,
                    outcome: ShortcutOutcome::ForegroundUnknown {
                        detail: detail.clone(),
                    },
                },
                JournalEvent::QuickReplyFailed {
                    reason: QuickReplyFailure::ForegroundUnknown { detail },
                },
            ]
        );
        assert_eq!(mechanisms.set_going(), Vec::new());
    }

    #[test]
    fn the_walk_lights_up_from_the_game_and_moves_no_window() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            foreground: Some(game_window(1, "Alpha")),
            ..Desktop::default()
        });
        let mechanisms = FakeMechanisms::default();

        answering(
            &Press {
                windows: windows.as_ref(),
                state: &state,
                mechanisms: &mechanisms,
            },
            Binding::Action {
                action: ShortcutAction::Walk,
            },
        );

        assert_eq!(
            mechanisms.set_going(),
            vec![Mechanism::RelayStopped, Mechanism::WalkToggled],
            "the player is at the game, so the private messages fall silent like on any other strike"
        );
        assert_eq!(journalled(&state), Vec::new());
        assert_eq!(
            windows.asked(),
            Vec::new(),
            "the Walk lights up, it moves no window"
        );
    }

    #[test]
    fn not_one_action_answers_to_a_bare_desktop() {
        for action in ShortcutAction::ALL {
            let directory = directory();
            let state = app_state(&directory, Settings::default());
            let windows = FakeWindowManager::showing(Desktop::default());
            let mechanisms = FakeMechanisms::default();

            answering(
                &Press {
                    windows: windows.as_ref(),
                    state: &state,
                    mechanisms: &mechanisms,
                },
                Binding::Action { action },
            );

            assert!(
                mechanisms.set_going().is_empty(),
                "{action:?} went off with nobody at the game"
            );
            assert!(
                !journalled(&state).is_empty(),
                "{action:?} was refused outside the game without saying so"
            );
        }
    }

    #[test]
    fn every_action_struck_in_the_game_answers_for_itself() {
        for action in ShortcutAction::ALL {
            let directory = directory();
            let state = three_in_the_cycle(&directory);
            let windows = FakeWindowManager::showing(Desktop {
                foreground: Some(game_window(1, "Alpha")),
                ..Desktop::default()
            });
            let mechanisms = FakeMechanisms::default();

            answering(
                &Press {
                    windows: windows.as_ref(),
                    state: &state,
                    mechanisms: &mechanisms,
                },
                Binding::Action { action },
            );

            assert!(
                !mechanisms.set_going().is_empty() || !journalled(&state).is_empty(),
                "{action:?} struck at the game did nothing and said nothing"
            );
        }
    }

    #[test]
    fn a_shortcut_struck_in_the_game_silences_the_private_messages_and_moves_a_window() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop {
            foreground: Some(game_window(1, "Alpha")),
            ..Desktop::default()
        });
        let mechanisms = FakeMechanisms::default();

        answering(
            &Press {
                windows: windows.as_ref(),
                state: &state,
                mechanisms: &mechanisms,
            },
            Binding::Action {
                action: ShortcutAction::Next,
            },
        );

        assert_eq!(mechanisms.set_going(), vec![Mechanism::RelayStopped]);
        assert_eq!(windows.asked(), vec![Asked::Focused(WindowId::from_raw(2))]);
        assert!(journalled(&state).contains(&JournalEvent::Shortcut {
            action: ShortcutAction::Next,
            outcome: ShortcutOutcome::Focused {
                nickname: "Bravo".to_owned(),
            },
        }));
    }

    #[test]
    fn a_quick_reply_is_pasted_where_the_player_is_writing_and_nowhere_else() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop {
            foreground: Some(game_window(1, "Alpha")),
            ..Desktop::default()
        });
        let mechanisms = FakeMechanisms::default();
        let id = QuickReplyId::default();

        answering(
            &Press {
                windows: windows.as_ref(),
                state: &state,
                mechanisms: &mechanisms,
            },
            Binding::QuickReply { id },
        );

        assert_eq!(
            mechanisms.set_going(),
            vec![Mechanism::RelayStopped, Mechanism::QuickReplyPasted(id)]
        );
        assert_eq!(
            windows.asked(),
            Vec::new(),
            "a quick reply writes, it does not switch"
        );
    }

    #[test]
    fn a_character_shortcut_brings_his_window_forward_from_any_other_one() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop {
            foreground: Some(game_window(1, "Alpha")),
            ..Desktop::default()
        });
        let mechanisms = FakeMechanisms::default();

        answering(
            &Press {
                windows: windows.as_ref(),
                state: &state,
                mechanisms: &mechanisms,
            },
            Binding::Character {
                nickname: "Charlie".to_owned(),
            },
        );

        assert_eq!(windows.asked(), vec![Asked::Focused(WindowId::from_raw(3))]);
        assert!(
            journalled(&state).contains(&JournalEvent::CharacterShortcut {
                nickname: "Charlie".to_owned(),
                outcome: CharacterShortcutOutcome::Focused,
            })
        );
    }

    #[test]
    fn a_character_shortcut_struck_on_his_own_window_moves_nothing_and_says_so() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop {
            foreground: Some(game_window(1, "Alpha")),
            ..Desktop::default()
        });
        let mechanisms = FakeMechanisms::default();

        answering(
            &Press {
                windows: windows.as_ref(),
                state: &state,
                mechanisms: &mechanisms,
            },
            Binding::Character {
                nickname: "Alpha".to_owned(),
            },
        );

        assert_eq!(windows.asked(), Vec::new());
        assert!(
            journalled(&state).contains(&JournalEvent::CharacterShortcut {
                nickname: "Alpha".to_owned(),
                outcome: CharacterShortcutOutcome::AlreadyThere,
            })
        );
    }

    #[test]
    fn a_character_shortcut_struck_outside_the_game_names_the_character_it_meant() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop::default());
        let mechanisms = FakeMechanisms::default();

        answering(
            &Press {
                windows: windows.as_ref(),
                state: &state,
                mechanisms: &mechanisms,
            },
            Binding::Character {
                nickname: "Bravo".to_owned(),
            },
        );

        assert_eq!(
            journalled(&state),
            vec![JournalEvent::CharacterShortcut {
                nickname: "Bravo".to_owned(),
                outcome: CharacterShortcutOutcome::OutsideGame,
            }]
        );
    }

    fn asked(nickname: &str, accelerator: &str) -> (Binding, Option<String>) {
        (
            Binding::Character {
                nickname: nickname.to_owned(),
            },
            Some(accelerator.to_owned()),
        )
    }

    #[test]
    fn the_one_who_already_holds_a_combination_claims_it_before_the_one_who_asks() {
        let wanted = vec![asked("Alpha", "F2"), asked("Bravo", "F2")];
        let held = HashMap::from([(wanted[1].0.clone(), "F2".to_owned())]);

        assert_eq!(
            claiming_order(&wanted, &held),
            vec![1, 0],
            "Bravo held F2 first, and the roster order does not take it from him"
        );
        assert_eq!(
            claiming_order(&wanted, &HashMap::new()),
            vec![0, 1],
            "nobody holds it yet, so the roster order decides"
        );
    }

    #[test]
    fn asking_for_the_combination_of_another_never_takes_it_from_him() {
        let wanted = vec![asked("Alpha", "F5"), asked("Bravo", "F5")];
        let held = HashMap::from([
            (wanted[0].0.clone(), "F2".to_owned()),
            (wanted[1].0.clone(), "F5".to_owned()),
        ]);

        assert_eq!(
            claiming_order(&wanted, &held),
            vec![1, 0],
            "Alpha leaves his F2 for the F5 Bravo holds, and Bravo keeps it"
        );
    }

    #[test]
    fn a_binding_without_a_combination_never_claims_anything_first() {
        let wanted = vec![(
            Binding::Character {
                nickname: "Alpha".to_owned(),
            },
            None,
        )];

        assert_eq!(claiming_order(&wanted, &HashMap::new()), vec![0]);
    }

    #[test]
    fn a_combination_the_cycle_already_took_is_refused_by_the_name_of_its_owner() {
        let next = Binding::Action {
            action: ShortcutAction::Next,
        };
        let mut claimed = HashMap::new();
        let shortcut = claim(Some("Alt+Right"), &claimed).expect("a free combination");

        claimed.insert(shortcut.id(), next.clone());

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
    fn the_wheel_opens_on_the_window_the_player_is_holding_the_keys_from() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop {
            foreground: Some(game_window(2, "Bravo")),
            ..Desktop::default()
        });
        let mechanisms = FakeMechanisms::default();

        answering(
            &Press {
                windows: windows.as_ref(),
                state: &state,
                mechanisms: &mechanisms,
            },
            Binding::Action {
                action: ShortcutAction::Wheel,
            },
        );

        assert_eq!(
            mechanisms.set_going(),
            vec![
                Mechanism::RelayStopped,
                Mechanism::WheelOpened(WindowId::from_raw(2)),
            ]
        );
        assert_eq!(
            windows.asked(),
            Vec::new(),
            "opening the wheel moves no window on its own"
        );
    }

    #[test]
    fn the_rune_table_is_posed_on_the_window_the_player_struck_the_keys_from() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop {
            foreground: Some(game_window(3, "Charlie")),
            ..Desktop::default()
        });
        let mechanisms = FakeMechanisms::default();

        answering(
            &Press {
                windows: windows.as_ref(),
                state: &state,
                mechanisms: &mechanisms,
            },
            Binding::Action {
                action: ShortcutAction::RuneTable,
            },
        );

        assert_eq!(
            mechanisms.set_going(),
            vec![
                Mechanism::RelayStopped,
                Mechanism::RuneTableToggled(WindowId::from_raw(3)),
            ]
        );
        assert_eq!(
            windows.asked(),
            Vec::new(),
            "posing the rune table moves no window on its own"
        );
    }

    #[test]
    fn the_rune_table_struck_outside_the_game_never_shows_itself_and_says_so() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop::default());
        let mechanisms = FakeMechanisms::default();

        answering(
            &Press {
                windows: windows.as_ref(),
                state: &state,
                mechanisms: &mechanisms,
            },
            Binding::Action {
                action: ShortcutAction::RuneTable,
            },
        );

        assert_eq!(mechanisms.set_going(), Vec::new());
        assert_eq!(
            journalled(&state),
            vec![JournalEvent::Shortcut {
                action: ShortcutAction::RuneTable,
                outcome: ShortcutOutcome::OutsideGame,
            }]
        );
    }

    #[test]
    fn the_wheel_struck_outside_the_game_never_opens_and_says_so() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop::default());
        let mechanisms = FakeMechanisms::default();

        answering(
            &Press {
                windows: windows.as_ref(),
                state: &state,
                mechanisms: &mechanisms,
            },
            Binding::Action {
                action: ShortcutAction::Wheel,
            },
        );

        assert_eq!(mechanisms.set_going(), Vec::new());
        assert_eq!(
            journalled(&state),
            vec![JournalEvent::Shortcut {
                action: ShortcutAction::Wheel,
                outcome: ShortcutOutcome::OutsideGame,
            }]
        );
    }

    #[test]
    fn only_the_wheel_hears_a_key_coming_back_up() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop {
            foreground: Some(game_window(1, "Alpha")),
            ..Desktop::default()
        });
        let mechanisms = FakeMechanisms::default();
        let press = Press {
            windows: windows.as_ref(),
            state: &state,
            mechanisms: &mechanisms,
        };

        answer(
            &press,
            Struck::Released(Binding::Action {
                action: ShortcutAction::Next,
            }),
        );

        assert_eq!(mechanisms.set_going(), Vec::new());
        assert_eq!(windows.asked(), Vec::new());

        answer(
            &press,
            Struck::Released(Binding::Action {
                action: ShortcutAction::Wheel,
            }),
        );

        assert_eq!(mechanisms.set_going(), vec![Mechanism::WheelReleased]);
    }

    #[test]
    fn the_system_is_only_asked_for_the_key_coming_back_up_of_the_wheel() {
        for action in ShortcutAction::ALL {
            let binding = Binding::Action { action };
            let released = struck_as(ShortcutState::Released, &binding);

            assert_eq!(
                released.is_some(),
                action == ShortcutAction::Wheel,
                "{action:?} disagrees with what it says of itself"
            );
            assert_eq!(
                struck_as(ShortcutState::Pressed, &binding),
                Some(Struck::Pressed(binding.clone()))
            );
        }

        assert_eq!(
            struck_as(
                ShortcutState::Released,
                &Binding::Character {
                    nickname: "Alpha".to_owned(),
                },
            ),
            None
        );
    }

    #[test]
    fn a_shortcut_that_settles_by_itself_never_touches_a_window() {
        let directory = directory();
        let state = three_in_the_cycle(&directory);
        let windows = FakeWindowManager::showing(Desktop::default());

        assert_eq!(
            pressed(&state, &windows, ShortcutAction::Main),
            ShortcutOutcome::NoMain,
            "nobody is the main yet, so there is nowhere to go"
        );
        assert_eq!(windows.asked(), Vec::new());
    }
}
