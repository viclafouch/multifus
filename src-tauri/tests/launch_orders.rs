mod common;

use common::client;
use common::in_cycle;
use common::nicknames;
use common::opened;
use common::paint_everything;
use common::reopened;
use common::title_of;

use multifus_lib::app::journal::JournalEvent;
use multifus_lib::app::journal::Launch;
use multifus_lib::app::journal::ShortcutOutcome;
use multifus_lib::app::journal::Surface;
use multifus_lib::app::state::ShortcutEffect;
use multifus_lib::app::view::ShortcutAction;
use multifus_lib::domain::Class;
use multifus_lib::domain::Gender;
use multifus_lib::platform::GameWindow;
use multifus_lib::platform::WindowId;

const LOGIN_SCREEN: &str = "Dofus Retro";

fn scanned(titles: &[(u64, String)]) -> Vec<GameWindow> {
    titles
        .iter()
        .filter_map(|(window, title)| GameWindow::from_title(WindowId::from_raw(*window), title))
        .collect()
}

#[test]
fn dofus_was_already_running_when_multifus_opened() {
    let (_directory, mut state) = opened(Launch::ByHand);

    let first_scan =
        state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo"), client(3, "Charlie")]);

    assert!(first_scan.changed);
    assert_eq!(in_cycle(&state), ["Alpha", "Bravo", "Charlie"]);
    assert!(state.is_granted(), "a scan that answers proves the right");

    let same_scan =
        state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo"), client(3, "Charlie")]);

    assert!(!same_scan.changed, "the next scan finds nothing new to say");
}

#[test]
fn the_clients_open_one_after_the_other() {
    let (_directory, mut state) = opened(Launch::ByHand);

    assert!(state.apply_windows(&[]).changed, "the right is learnt once");
    assert!(nicknames(&state).is_empty());

    assert!(state.apply_windows(&[client(1, "Alpha")]).changed);
    assert!(
        state
            .apply_windows(&[client(1, "Alpha"), client(2, "Bravo")])
            .changed
    );

    assert_eq!(
        nicknames(&state),
        ["Alpha", "Bravo"],
        "the roster keeps the order they opened in"
    );
}

#[test]
fn a_client_left_on_the_login_screen_is_nobody_yet() {
    let (_directory, mut state) = opened(Launch::ByHand);

    let found = scanned(&[(1, title_of("Alpha")), (2, LOGIN_SCREEN.to_owned())]);

    assert_eq!(found.len(), 1, "the login screen names nobody");

    state.apply_windows(&found);

    assert_eq!(nicknames(&state), ["Alpha"]);
    assert!(
        state.walk_plan().watched == [WindowId::from_raw(1)],
        "a client with no nickname takes no click either"
    );

    let named = scanned(&[(1, title_of("Alpha")), (2, title_of("Bravo"))]);

    state.apply_windows(&named);

    assert_eq!(
        in_cycle(&state),
        ["Alpha", "Bravo"],
        "he joins the cycle the moment he logs in"
    );
}

#[test]
fn a_character_who_comes_back_on_a_new_client_keeps_one_line_in_the_roster() {
    let (_directory, mut state) = opened(Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha")]);
    state.set_class("Alpha", Some(Class::Sram));
    state.set_gender("Alpha", Some(Gender::Male));
    paint_everything(&mut state);

    assert!(state.wore_portrait("Alpha"));

    state.apply_windows(&[]);
    state.forget_closed_windows();
    state.apply_windows(&[client(9, "Alpha")]);

    assert_eq!(nicknames(&state), ["Alpha"], "one Alpha, one line");
    assert_eq!(state.window_of("Alpha"), Some(WindowId::from_raw(9)));
    assert_eq!(
        state.portraits_to_give_back(),
        vec![("Alpha".to_owned(), WindowId::from_raw(9))],
        "what is owed follows Alpha to his new client"
    );

    let wanted = state.looks_to_paint();

    assert_eq!(
        wanted
            .iter()
            .map(|painting| painting.window)
            .collect::<Vec<_>>(),
        [WindowId::from_raw(9)],
        "the new client wants the head the old one carried"
    );
    assert!(wanted[0].look.portrait.is_some());
}

#[test]
fn the_game_logs_a_character_out_by_itself() {
    let (_directory, mut state) = opened(Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    state.set_class("Bravo", Some(Class::Eniripsa));
    state.set_gender("Bravo", Some(Gender::Female));

    let alone = state.apply_windows(&[client(1, "Alpha")]);

    assert!(alone.changed);
    assert_eq!(in_cycle(&state), ["Alpha"]);
    assert_eq!(nicknames(&state), ["Alpha", "Bravo"], "Bravo stays known");

    let bravo = state
        .snapshot()
        .characters
        .into_iter()
        .find(|character| character.nickname == "Bravo")
        .expect("Bravo is still in the roster");

    assert_eq!(bravo.class, Some(Class::Eniripsa));
    assert_eq!(bravo.gender, Some(Gender::Female));
    assert!(!bravo.online);
    assert!(!bravo.excluded, "the game logging him out is not a choice");

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);

    assert_eq!(in_cycle(&state), ["Alpha", "Bravo"]);
}

#[test]
fn a_character_the_game_logged_out_takes_his_window_out_of_the_walk() {
    let (_directory, mut state) = opened(Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo"), client(3, "Charlie")]);
    state.apply_windows(&[client(1, "Alpha"), client(3, "Charlie")]);

    let plan = state.walk_plan();

    assert!(
        !plan.watched.contains(&WindowId::from_raw(2)),
        "a client back on the login screen takes no click"
    );
    assert_eq!(
        plan.next.get(&WindowId::from_raw(1)).copied(),
        Some(WindowId::from_raw(3)),
        "the walk steps over the one who left"
    );
}

#[test]
fn the_authorization_is_taken_away_in_the_middle_of_an_evening() {
    let (_directory, mut state) = opened(Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    state.set_paired(4242);
    state.enable_relay(Surface::Window);

    let denied = state.apply_denied();

    assert!(denied.changed);
    assert!(!state.is_granted());
    assert!(in_cycle(&state).is_empty(), "Multifus sees nobody any more");
    assert_eq!(
        denied.relayed_gone,
        ["Alpha".to_owned(), "Bravo".to_owned()]
    );
    assert!(denied.none_relayed_left);
    assert_eq!(
        nicknames(&state),
        ["Alpha", "Bravo"],
        "the roster survives a lost right"
    );

    let quiet = state.apply_denied();

    assert!(!quiet.changed, "a lost right is said once");

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);

    assert!(state.is_granted());
    assert_eq!(in_cycle(&state), ["Alpha", "Bravo"]);
}

#[test]
fn multifus_opened_before_the_authorization_was_given() {
    let (_directory, mut state) = opened(Launch::Session);

    let denied = state.apply_denied();

    assert!(denied.changed, "the refusal is worth saying");
    assert!(nicknames(&state).is_empty());
    assert!(!state.is_granted());

    state.apply_windows(&[client(1, "Alpha")]);

    assert!(state.is_granted());
    assert_eq!(in_cycle(&state), ["Alpha"]);
}

#[test]
fn a_shortcut_struck_while_everybody_is_set_aside_goes_nowhere() {
    let (_directory, mut state) = opened(Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    state.toggle_excluded("Alpha");
    state.toggle_excluded("Bravo");

    assert_eq!(
        state.decide_shortcut(ShortcutAction::Next, "Alpha"),
        ShortcutEffect::Settled(ShortcutOutcome::NobodyInCycle)
    );
}

#[test]
fn a_shortcut_steps_over_the_client_that_just_closed() {
    let (_directory, mut state) = opened(Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo"), client(3, "Charlie")]);
    state.apply_windows(&[client(1, "Alpha"), client(3, "Charlie")]);

    assert_eq!(
        state.decide_shortcut(ShortcutAction::Next, "Alpha"),
        ShortcutEffect::Focus {
            nickname: "Charlie".to_owned(),
            window: WindowId::from_raw(3),
        }
    );
}

#[test]
fn a_shortcut_struck_on_the_last_client_left_stays_where_it_is() {
    let (_directory, mut state) = opened(Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    state.apply_windows(&[client(1, "Alpha")]);

    assert_eq!(
        state.decide_shortcut(ShortcutAction::Next, "Alpha"),
        ShortcutEffect::Focus {
            nickname: "Alpha".to_owned(),
            window: WindowId::from_raw(1),
        },
        "the only one left in the cycle is the one in front of you"
    );
}

#[test]
fn setting_aside_a_client_multifus_never_met_changes_nothing() {
    let (_directory, mut state) = opened(Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha")]);

    assert_eq!(
        state.decide_shortcut(ShortcutAction::ToggleExcluded, "Inconnu"),
        ShortcutEffect::Settled(ShortcutOutcome::NotInRoster {
            nickname: "Inconnu".to_owned(),
        })
    );
    assert_eq!(in_cycle(&state), ["Alpha"]);
}

#[test]
fn a_roster_learnt_before_the_clients_open_puts_nobody_in_the_cycle() {
    let (directory, mut first) = opened(Launch::ByHand);
    first.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    first.set_gender("Alpha", Some(Gender::Male));
    drop(first);

    let mut second = reopened(&directory, Launch::Session);

    assert_eq!(nicknames(&second), ["Alpha", "Bravo"]);
    assert!(
        in_cycle(&second).is_empty(),
        "Multifus opened before Dofus, so nobody is there yet"
    );
    assert_eq!(
        second.decide_shortcut(ShortcutAction::Next, "Alpha"),
        ShortcutEffect::Settled(ShortcutOutcome::NobodyInCycle)
    );

    second.apply_windows(&[client(7, "Bravo")]);

    assert_eq!(
        in_cycle(&second),
        ["Bravo"],
        "only the client that opened is in the cycle"
    );
    assert_eq!(second.window_of("Alpha"), None);
}

#[test]
fn a_multifus_killed_with_traces_on_screen_owes_them_at_the_next_scan() {
    let (directory, mut died) = opened(Launch::ByHand);
    died.apply_windows(&[client(1, "Alpha")]);
    died.set_class("Alpha", Some(Class::Xelor));
    died.set_gender("Alpha", Some(Gender::Male));
    paint_everything(&mut died);
    drop(died);

    let mut reborn = reopened(&directory, Launch::ByHand);

    assert!(reborn.wore_portrait("Alpha"), "the trace outlived the kill");
    assert!(
        reborn.portraits_to_give_back().is_empty(),
        "nothing can be given back before a scan says where Alpha is"
    );

    reborn.apply_windows(&[client(1, "Alpha")]);

    assert_eq!(
        reborn.portraits_to_give_back(),
        vec![("Alpha".to_owned(), WindowId::from_raw(1))]
    );

    reborn.forget_window("Alpha");

    assert!(!reborn.wore_portrait("Alpha"));
    assert!(reborn.portraits_to_give_back().is_empty());
}

#[test]
fn the_first_line_of_the_journal_says_how_multifus_was_opened() {
    let (_directory, state) = opened(Launch::ByHand);

    let first = state
        .snapshot()
        .journal
        .into_iter()
        .next()
        .expect("a journal that opens on something");

    assert_eq!(
        first.event,
        JournalEvent::Started {
            version: "0.1.0".to_owned(),
            system: "test".to_owned(),
            launch: Launch::ByHand,
        }
    );
}
