use tempfile::TempDir;

use multifus_lib::app::journal::JournalEvent;
use multifus_lib::app::journal::Launch;
use multifus_lib::app::journal::ShortcutOutcome;
use multifus_lib::app::journal::Surface;
use multifus_lib::app::state::ShortcutEffect;
use multifus_lib::app::view::ScreenSaverView;
use multifus_lib::app::view::ShortcutAction;
use multifus_lib::app::Multifus;
use multifus_lib::app::MultifusParams;
use multifus_lib::config::ConfigStore;
use multifus_lib::domain::Class;
use multifus_lib::domain::Gender;
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

fn paint_everything(state: &mut Multifus) {
    for painting in state.looks_to_paint() {
        state.remember_painted(&painting);
    }
}

#[test]
fn dofus_was_already_running_when_multifus_opened() {
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);

    let first_scan =
        state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo"), client(3, "Charlie")]);

    assert!(first_scan.changed, "three clients at once is a change");
    assert_eq!(in_cycle(&state), ["Alpha", "Bravo", "Charlie"]);
    assert!(state.is_granted(), "a scan that answers proves the right");

    let same_scan =
        state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo"), client(3, "Charlie")]);

    assert!(!same_scan.changed, "the next scan finds nothing new to say");
}

#[test]
fn the_clients_open_one_after_the_other() {
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);

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
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);

    assert_eq!(
        GameWindow::from_title(WindowId::from_raw(1), "Dofus Retro"),
        None,
        "a title without a nickname names nobody"
    );

    state.apply_windows(&[]);

    assert!(
        nicknames(&state).is_empty(),
        "a client with no nickname adds nobody to the roster"
    );
}

#[test]
fn a_character_who_comes_back_on_a_new_client_keeps_one_line_in_the_roster() {
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);

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
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    state.set_class("Bravo", Some(Class::Eniripsa));
    state.set_gender("Bravo", Some(Gender::Female));

    let alone = state.apply_windows(&[client(1, "Alpha")]);

    assert!(alone.changed);
    assert_eq!(in_cycle(&state), ["Alpha"], "Bravo left the cycle alone");
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
    assert!(!bravo.asleep, "the game logging him out is not a choice");

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);

    assert_eq!(
        in_cycle(&state),
        ["Alpha", "Bravo"],
        "he comes back where he was"
    );
}

#[test]
fn a_character_the_game_logged_out_takes_his_window_out_of_the_walk() {
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);

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
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    state.set_paired(4242);
    state.enable_relay(Surface::Window);

    let denied = state.apply_denied();

    assert!(denied.changed);
    assert!(!state.is_granted());
    assert!(in_cycle(&state).is_empty(), "Multifus sees nobody any more");
    assert_eq!(
        denied.relayed_gone,
        ["Alpha".to_owned(), "Bravo".to_owned()],
        "both were relayed, and both are gone"
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
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::Session);

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
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    state.toggle_asleep("Alpha");
    state.toggle_asleep("Bravo");

    assert_eq!(
        state.decide_shortcut(ShortcutAction::Next, "Alpha"),
        ShortcutEffect::Settled(ShortcutOutcome::NobodyInCycle)
    );
}

#[test]
fn a_shortcut_that_aims_at_a_client_which_just_closed_says_so() {
    let directory = TempDir::new().expect("a temporary directory");
    let mut state = start(&directory, Launch::ByHand);

    state.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);

    assert_eq!(
        state.decide_shortcut(ShortcutAction::Next, "Alpha"),
        ShortcutEffect::Focus {
            nickname: "Bravo".to_owned(),
            window: WindowId::from_raw(2),
        }
    );

    state.apply_denied();

    assert_eq!(
        state.decide_shortcut(ShortcutAction::Next, "Alpha"),
        ShortcutEffect::Settled(ShortcutOutcome::NobodyInCycle),
        "nobody is online, so there is nobody to go to"
    );
}

#[test]
fn a_roster_learnt_before_the_clients_open_puts_nobody_in_the_cycle() {
    let directory = TempDir::new().expect("a temporary directory");
    let mut first = start(&directory, Launch::ByHand);
    first.apply_windows(&[client(1, "Alpha"), client(2, "Bravo")]);
    first.set_gender("Alpha", Some(Gender::Male));
    drop(first);

    let mut second = start(&directory, Launch::Session);

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
    let directory = TempDir::new().expect("a temporary directory");
    let mut died = start(&directory, Launch::ByHand);
    died.apply_windows(&[client(1, "Alpha")]);
    died.set_class("Alpha", Some(Class::Xelor));
    died.set_gender("Alpha", Some(Gender::Male));
    paint_everything(&mut died);
    drop(died);

    let mut reborn = start(&directory, Launch::ByHand);

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
    let directory = TempDir::new().expect("a temporary directory");
    let state = start(&directory, Launch::ByHand);

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
