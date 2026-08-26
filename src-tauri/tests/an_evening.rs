use tempfile::TempDir;

use multifus_lib::app::journal::JournalEvent;
use multifus_lib::app::journal::Launch;
use multifus_lib::app::journal::Outcome;
use multifus_lib::app::journal::Surface;
use multifus_lib::app::state::Decision;
use multifus_lib::app::state::ShortcutEffect;
use multifus_lib::app::view::ScreenSaverView;
use multifus_lib::app::view::ShortcutAction;
use multifus_lib::app::Multifus;
use multifus_lib::app::MultifusParams;
use multifus_lib::config::ConfigStore;
use multifus_lib::domain::Class;
use multifus_lib::domain::Gender;
use multifus_lib::domain::NotificationKind;
use multifus_lib::platform::GameWindow;
use multifus_lib::platform::WindowId;

fn start(directory: &TempDir, launch: Launch) -> Multifus {
    let store = ConfigStore::in_directory(directory.path());
    let loaded = store.load();

    Multifus::new(MultifusParams {
        store,
        loaded,
        version: "0.1.0".to_owned(),
        system: "test".to_owned(),
        launch,
        screen_saver: ScreenSaverView::Never,
        taskbar_combines: true,
    })
}

fn client(pid: u64, nickname: &str) -> GameWindow {
    let title = format!("{nickname} - Dofus Retro v1.48.21");

    GameWindow::from_title(WindowId::from_raw(pid), &title).expect("a game window")
}

fn nicknames(state: &Multifus) -> Vec<String> {
    state
        .snapshot()
        .characters
        .into_iter()
        .map(|character| character.nickname)
        .collect()
}

fn in_cycle(state: &Multifus) -> Vec<String> {
    state
        .snapshot()
        .characters
        .into_iter()
        .filter(|character| character.online && !character.asleep)
        .map(|character| character.nickname)
        .collect()
}

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
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);

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

    for painting in &wanted {
        state.remember_painted(painting);
    }

    assert!(state.wore_portrait("Alpha"));
    assert!(
        state.looks_to_paint().is_empty(),
        "nothing is painted twice"
    );

    state.toggle_asleep("Bravo");

    assert_eq!(in_cycle(&state), ["Alpha", "Charlie"]);
    assert_eq!(
        state.decide_shortcut(ShortcutAction::Next, "Alpha"),
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
    assert_eq!(in_cycle(&state), ["Alpha"], "Bravo is still set aside");
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
    let directory = TempDir::new().expect("a temporary directory");
    let mut died = start(&directory, Launch::ByHand);
    died.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    died.set_class("Alpha", Some(Class::Cra));
    died.set_gender("Alpha", Some(Gender::Female));
    died.toggle_asleep("Bravo");

    for painting in died.looks_to_paint() {
        died.remember_painted(&painting);
    }

    drop(died);

    let mut reborn = start(&directory, Launch::Session);

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
        "nobody stays set aside across a restart"
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
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);
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
    assert!(!start(&directory, Launch::ByHand).is_relay_active());
}
