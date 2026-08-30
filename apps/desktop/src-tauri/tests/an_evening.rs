mod common;

use common::client;
use common::decided;
use common::in_cycle;
use common::nicknames;
use common::opened;
use common::paint_everything;
use common::reopened;

use multifus_lib::app::Multifus;
use multifus_lib::app::journal::JournalEvent;
use multifus_lib::app::journal::Launch;
use multifus_lib::app::journal::Outcome;
use multifus_lib::app::journal::Surface;
use multifus_lib::app::state::Decision;
use multifus_lib::app::state::ShortcutEffect;
use multifus_lib::app::view::ShortcutAction;
use multifus_lib::domain::Class;
use multifus_lib::domain::Gender;
use multifus_lib::domain::NotificationKind;
use multifus_lib::platform::WindowId;

fn written(state: &Multifus) -> Vec<JournalEvent> {
    state
        .snapshot()
        .journal
        .into_iter()
        .map(|entry| entry.event)
        .collect()
}

#[test]
fn an_evening_of_dofus_from_the_first_client_to_the_last() {
    let (_directory, mut state) = opened(Launch::ByHand);

    assert!(nicknames(&state).is_empty(), "a first launch knows nobody");
    assert!(!state.is_walk_enabled());
    assert_eq!(state.snapshot().config.problem, None);

    let arrived =
        state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo"), client(3, "Charlie")]);

    assert!(arrived.changed);
    assert_eq!(nicknames(&state), ["Alpha", "Bravo", "Charlie"]);
    assert_eq!(in_cycle(&state), ["Alpha", "Bravo", "Charlie"]);

    state.set_class("Alpha", Some(Class::Iop));
    state.set_gender("Alpha", Some(Gender::Male));

    let wanted = state.looks_to_paint();
    let alpha = wanted
        .iter()
        .find(|painting| painting.nickname == "Alpha")
        .expect("Alpha wants a head of his own");

    assert!(alpha.look.portrait.is_some());

    paint_everything(&mut state);

    assert!(state.wore_portrait("Alpha"));
    assert!(
        state.looks_to_paint().is_empty(),
        "nothing is painted twice"
    );

    state.toggle_excluded("Bravo");

    assert_eq!(in_cycle(&state), ["Alpha", "Charlie"]);
    assert_eq!(
        decided(&mut state, ShortcutAction::Next, "Alpha"),
        ShortcutEffect::Focus {
            nickname: "Charlie".to_owned(),
            window: WindowId::from_raw(3),
        }
    );

    let plan = state.walk_plan();

    assert_eq!(
        plan.watched.len(),
        3,
        "a click counts on Bravo's window too"
    );
    assert_eq!(
        plan.next.get(&WindowId::from_raw(1)).copied(),
        Some(WindowId::from_raw(3)),
        "a click on Alpha lands on Charlie"
    );

    assert_eq!(
        state.decide("Charlie", Some(NotificationKind::Combat)),
        Decision::Focus(WindowId::from_raw(3))
    );

    let logged_out = state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);

    assert!(logged_out.changed);
    assert_eq!(in_cycle(&state), ["Alpha"], "Bravo is still excluded");
    assert_eq!(nicknames(&state), ["Alpha", "Bravo", "Charlie"]);
    assert_eq!(
        state.decide("Charlie", Some(NotificationKind::Combat)),
        Decision::Ignored(Outcome::NoWindow)
    );

    state.apply_windows(&[]);

    assert!(in_cycle(&state).is_empty());
    assert_eq!(
        state.portraits_to_give_back(),
        vec![("Alpha".to_owned(), WindowId::from_raw(1))],
        "a client that closed is still owed the head Multifus posed"
    );
}

#[test]
fn a_multifus_that_was_killed_finds_its_roster_and_its_traces_again() {
    let (directory, mut died) = opened(Launch::ByHand);
    died.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    died.set_class("Alpha", Some(Class::Cra));
    died.set_gender("Alpha", Some(Gender::Female));
    died.toggle_excluded("Bravo");

    paint_everything(&mut died);

    drop(died);

    let mut reborn = reopened(&directory, Launch::Session);

    assert_eq!(nicknames(&reborn), ["Alpha", "Bravo"]);
    assert!(reborn.wore_portrait("Alpha"), "the trace outlived the run");
    assert!(!reborn.is_walk_enabled(), "the walk starts off, every time");

    let snapshot = reborn.snapshot();

    assert_eq!(snapshot.characters[0].class, Some(Class::Cra));
    assert_eq!(snapshot.characters[0].gender, Some(Gender::Female));
    assert!(
        snapshot
            .characters
            .iter()
            .all(|character| !character.online),
        "nobody is online until the first scan"
    );

    reborn.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);

    assert_eq!(
        in_cycle(&reborn),
        ["Alpha", "Bravo"],
        "nobody stays excluded across a restart"
    );
    assert!(
        written(&reborn).contains(&JournalEvent::Started {
            version: "0.1.0".to_owned(),
            system: "test".to_owned(),
            launch: Launch::Session,
        }),
        "the first line says the session opened it"
    );
}

#[test]
fn an_evening_with_the_relay_says_who_left_and_when_there_is_nobody_left() {
    let (directory, mut state) = opened(Launch::ByHand);
    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);

    assert!(!state.is_relay_ready(), "no bot yet");

    state.set_paired(4242);

    assert!(state.is_relay_ready());
    assert!(state.enable_relay(Surface::Window));
    assert!(state.relays("Alpha"));

    state.set_relayed("Bravo", false);

    assert!(!state.relays("Bravo"));

    let gone = state.apply_windows(&[client(2, "Bravo")]);

    assert_eq!(gone.relayed_gone, ["Alpha".to_owned()]);
    assert!(gone.none_relayed_left, "Bravo is not relayed");

    let quiet = state.apply_windows(&[client(2, "Bravo")]);

    assert!(quiet.relayed_gone.is_empty(), "a departure is said once");

    state.set_unpaired();

    assert!(!state.is_relay_ready());
    assert!(!reopened(&directory, Launch::ByHand).is_relay_active());
}

#[test]
fn a_wheel_opened_in_the_middle_of_an_evening_shows_the_team_and_lands_on_one() {
    let (directory, mut state) = opened(Launch::ByHand);
    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo"), client(3, "Charlie")]);
    state.set_class("Bravo", Some(Class::Cra));
    state.set_gender("Bravo", Some(Gender::Female));
    state.set_main("Charlie", true);
    state.toggle_excluded("Bravo");

    let plan = state.wheel_plan(Some(WindowId::from_raw(1)));

    assert_eq!(
        plan.slices
            .iter()
            .map(|slice| slice.nickname.clone())
            .collect::<Vec<_>>(),
        ["Alpha", "Bravo", "Charlie"],
        "the wheel is a choice made by hand, and it never sets a character aside"
    );
    assert!(plan.slices[0].here, "the player starts on Alpha");
    assert!(plan.slices[2].main);
    assert_eq!(plan.slices[1].class, Some(Class::Cra));
    assert_eq!(plan.windows[1], WindowId::from_raw(2));

    let frozen = state.wheel_plan(Some(WindowId::from_raw(1)));

    state.apply_windows(&[client(1, "Alpha")]);

    assert_eq!(
        state.wheel_plan(None).slices.len(),
        1,
        "the turn that follows the hold sees two clients close"
    );
    assert_eq!(
        frozen.windows[1],
        WindowId::from_raw(2),
        "the wheel that was opened keeps the window it was opened with"
    );

    state.set_wheel_diameter(300);

    assert_eq!(state.snapshot().wheel.diameter, 300);
    assert_eq!(reopened(&directory, Launch::ByHand).wheel_diameter(), 300);
}
