use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::sync::mpsc;
use std::sync::mpsc::Sender;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::thread;

use tauri::image::Image;
use tauri::menu::Menu;
use tauri::menu::MenuEvent;
use tauri::menu::MenuItem;
use tauri::menu::PredefinedMenuItem;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Wry;

use crate::app::journal::JournalEvent;
use crate::app::journal::Surface;
use crate::app::journal::TrayOutcome;
use crate::app::journal::WalkFrom;
use crate::app::journal::Work;
use crate::app::journal_file;
use crate::app::main_window;
use crate::app::relay;
use crate::app::rune_table;
use crate::app::runtime;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::app::state::Multifus;
use crate::app::update;
use crate::app::view::CharacterView;
use crate::app::view::Screen;
use crate::app::walk;
use crate::platform::PlatformError;
use crate::platform::WindowId;

const MENU_CHARACTERS: &str = "Personnages";
const MENU_SHORTCUTS: &str = "Raccourcis";
const MENU_QUICK_REPLIES: &str = "Réponses rapides";
const MENU_AUTO_FOCUS_SCREEN: &str = "AutoFocus";
const MENU_WALK_SCREEN: &str = "Déplacement rapide";
const MENU_WHEEL_SCREEN: &str = "Roue";
const MENU_RUNE_TABLE_SCREEN: &str = "Tableau des runes";
const MENU_RELAY: &str = "Messages privés";
const MENU_SETTINGS: &str = "Paramètres";
const MENU_ABOUT: &str = "À propos";
const MENU_QUIT: &str = "Quitter Multifus";
const MENU_NOBODY: &str = "Aucun personnage connecté";
const MENU_EXCLUDED: &str = " (exclu)";
const MENU_MAXIMIZE_ALL: &str = "Agrandir les fenêtres";
const MENU_AUTO_FOCUS_ON: &str = "Activer l'AutoFocus";
const MENU_WALK_ON: &str = "Activer le Déplacement rapide";
const MENU_WALK_OFF: &str = "Désactiver le Déplacement rapide";
const MENU_RUNE_TABLE_ON: &str = "Montrer le tableau des runes";
const MENU_RUNE_TABLE_OFF: &str = "Cacher le tableau des runes";
const MENU_RUNE_TABLE_HOME: &str = "Remettre le tableau à sa position initiale";
const MENU_AUTO_FOCUS_OFF: &str = "Désactiver l'AutoFocus";
const MENU_WAKE_MINIMIZED: &str = "Aller chercher les fenêtres réduites";
const MENU_LEAVE_MINIMIZED: &str = "Laisser les fenêtres réduites";
const MENU_RELAY_SETUP: &str = "Configurer les messages privés…";
const MENU_RELAY_ON: &str = "Recevoir mes messages privés";
const MENU_RELAY_OFF: &str = "Ne plus les recevoir";
const MENU_DENIED: &str = "Autorisation manquante";
const MENU_JOURNAL: &str = "Montrer le journal";

fn update_label(version: &str) -> String {
    format!("Installer la mise à jour {version}")
}

#[cfg(target_os = "macos")]
const MENU_OPEN_SETTINGS: &str = "Ouvrir Réglages Système";
#[cfg(not(target_os = "macos"))]
const MENU_OPEN_SETTINGS: &str = "Ouvrir les réglages du système";

const TRAY_ID: &str = "multifus";

const SCREEN_PREFIX: &str = "multifus://screen/";

const QUIT_ID: &str = "multifus://quit";

const NOBODY_ID: &str = "multifus://nobody";

const MAXIMIZE_ALL_ID: &str = "multifus://maximize-all";

const AUTO_FOCUS_ID: &str = "multifus://auto-focus";

const WALK_ID: &str = "multifus://walk";

const RUNE_TABLE_ID: &str = "multifus://rune-table";

const RUNE_TABLE_HOME_ID: &str = "multifus://rune-table-home";

const WAKE_MINIMIZED_ID: &str = "multifus://wake-minimized";

const UPDATE_ID: &str = "multifus://update";

const JOURNAL_ID: &str = "multifus://journal";

const RELAY_ID: &str = "multifus://relay";

const DENIED_ID: &str = "multifus://denied";
const OPEN_SETTINGS_ID: &str = "multifus://open-settings";

const CHARACTER_PREFIX: &str = "multifus://character/";

#[derive(Debug, Clone, PartialEq, Eq)]
enum TrayWork {
    Focus { nickname: String },
    MaximizeAll,
    RuneTable,
    RecallRuneTable,
}

type TrayQueue = Sender<TrayWork>;

type ShownMenu = Mutex<Option<Contents>>;

#[derive(Debug, Clone, PartialEq, Eq)]
struct Contents {
    entries: Vec<Entry>,
    auto_focus: bool,
    walk: bool,
    rune_table: bool,
    wakes_minimized: bool,
    granted: bool,
    update: Option<String>,
    relay: RelayItem,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum RelayItem {
    NotReady,
    Off,
    On,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct Entry {
    nickname: String,
    label: String,
}

fn tooltip(connected: usize) -> String {
    match connected {
        0 => "Multifus, aucun personnage connecté".to_owned(),
        1 => "Multifus, 1 personnage connecté".to_owned(),
        count => format!("Multifus, {count} personnages connectés"),
    }
}

fn contents(state: &Multifus) -> Contents {
    Contents {
        entries: entries(&state.connected()),
        auto_focus: state.is_auto_focus_enabled(),
        walk: state.is_walk_enabled(),
        rune_table: state.is_rune_table_open(),
        wakes_minimized: state.wakes_minimized(),
        granted: state.is_granted(),
        update: state.available_update(),
        relay: relay_item(state),
    }
}

fn relay_item(state: &Multifus) -> RelayItem {
    match (state.is_relay_active(), state.is_relay_ready()) {
        (true, _) => RelayItem::On,
        (false, true) => RelayItem::Off,
        (false, false) => RelayItem::NotReady,
    }
}

fn relay_label(item: RelayItem) -> &'static str {
    match item {
        RelayItem::NotReady => MENU_RELAY_SETUP,
        RelayItem::Off => MENU_RELAY_ON,
        RelayItem::On => MENU_RELAY_OFF,
    }
}

fn entries(connected: &[CharacterView]) -> Vec<Entry> {
    connected
        .iter()
        .map(|character| Entry {
            nickname: character.nickname.clone(),
            label: if character.excluded {
                format!("{}{MENU_EXCLUDED}", character.nickname)
            } else {
                character.nickname.clone()
            },
        })
        .collect()
}

#[cfg(target_os = "macos")]
fn tray_image() -> Image<'static> {
    tauri::include_image!("./icons/tray.png")
}

#[cfg(target_os = "windows")]
fn tray_image() -> Image<'static> {
    tauri::include_image!("./icons/32x32.png")
}

pub fn setup(app: &AppHandle) {
    app.manage::<ShownMenu>(Mutex::new(None));

    start_worker(app);

    let built = tauri::tray::TrayIconBuilder::with_id(TRAY_ID)
        .icon(tray_image())
        .icon_as_template(cfg!(target_os = "macos"))
        .tooltip(tooltip(0))
        .on_menu_event(on_menu_event)
        .build(app);

    match built {
        Ok(_) => refresh(app),
        Err(error) => lock(app).log(JournalEvent::TrayFailed {
            detail: error.to_string(),
        }),
    }
}

#[must_use]
pub fn is_present(app: &AppHandle) -> bool {
    app.tray_by_id(TRAY_ID).is_some()
}

pub fn refresh(app: &AppHandle) {
    let Some(icon) = app.tray_by_id(TRAY_ID) else {
        return;
    };

    let wanted = contents(&lock(app));

    {
        let mut shown = shown_menu(app);

        if shown.as_ref() == Some(&wanted) {
            return;
        }

        *shown = Some(wanted.clone());
    }

    let built = build_menu(app, &wanted).and_then(|menu| {
        icon.set_menu(Some(menu))?;
        icon.set_tooltip(Some(tooltip(wanted.entries.len())))
    });

    if built.is_err() {
        *shown_menu(app) = None;
    }

    report(app, built);
}

fn build_menu(app: &AppHandle, contents: &Contents) -> tauri::Result<Menu<Wry>> {
    let menu = Menu::new(app)?;

    if !contents.granted {
        menu.append(&MenuItem::with_id(
            app,
            DENIED_ID,
            MENU_DENIED,
            false,
            None::<&str>,
        )?)?;
        menu.append(&MenuItem::with_id(
            app,
            OPEN_SETTINGS_ID,
            MENU_OPEN_SETTINGS,
            true,
            None::<&str>,
        )?)?;
        menu.append(&PredefinedMenuItem::separator(app)?)?;
    }

    if contents.entries.is_empty() {
        menu.append(&MenuItem::with_id(
            app,
            NOBODY_ID,
            MENU_NOBODY,
            false,
            None::<&str>,
        )?)?;
    }

    for entry in &contents.entries {
        menu.append(&MenuItem::with_id(
            app,
            format!("{CHARACTER_PREFIX}{}", entry.nickname),
            &entry.label,
            true,
            None::<&str>,
        )?)?;
    }

    menu.append(&MenuItem::with_id(
        app,
        MAXIMIZE_ALL_ID,
        MENU_MAXIMIZE_ALL,
        true,
        None::<&str>,
    )?)?;

    menu.append(&PredefinedMenuItem::separator(app)?)?;

    menu.append(&MenuItem::with_id(
        app,
        AUTO_FOCUS_ID,
        switch_label(contents.auto_focus, MENU_AUTO_FOCUS_OFF, MENU_AUTO_FOCUS_ON),
        true,
        None::<&str>,
    )?)?;

    menu.append(&MenuItem::with_id(
        app,
        WALK_ID,
        switch_label(contents.walk, MENU_WALK_OFF, MENU_WALK_ON),
        true,
        None::<&str>,
    )?)?;

    menu.append(&MenuItem::with_id(
        app,
        RUNE_TABLE_ID,
        switch_label(contents.rune_table, MENU_RUNE_TABLE_OFF, MENU_RUNE_TABLE_ON),
        true,
        None::<&str>,
    )?)?;

    if contents.rune_table {
        menu.append(&MenuItem::with_id(
            app,
            RUNE_TABLE_HOME_ID,
            MENU_RUNE_TABLE_HOME,
            true,
            None::<&str>,
        )?)?;
    }

    menu.append(&MenuItem::with_id(
        app,
        WAKE_MINIMIZED_ID,
        switch_label(
            contents.wakes_minimized,
            MENU_LEAVE_MINIMIZED,
            MENU_WAKE_MINIMIZED,
        ),
        true,
        None::<&str>,
    )?)?;

    menu.append(&MenuItem::with_id(
        app,
        RELAY_ID,
        relay_label(contents.relay),
        true,
        None::<&str>,
    )?)?;

    menu.append(&PredefinedMenuItem::separator(app)?)?;

    for screen in Screen::ALL {
        menu.append(&MenuItem::with_id(
            app,
            format!("{SCREEN_PREFIX}{}", screen_id(screen)),
            screen_label(screen),
            true,
            None::<&str>,
        )?)?;
    }

    menu.append(&MenuItem::with_id(
        app,
        JOURNAL_ID,
        MENU_JOURNAL,
        true,
        None::<&str>,
    )?)?;

    menu.append(&PredefinedMenuItem::separator(app)?)?;

    if let Some(version) = &contents.update {
        menu.append(&MenuItem::with_id(
            app,
            UPDATE_ID,
            update_label(version),
            true,
            None::<&str>,
        )?)?;
    }

    menu.append(&MenuItem::with_id(
        app,
        QUIT_ID,
        MENU_QUIT,
        true,
        None::<&str>,
    )?)?;

    Ok(menu)
}

fn on_menu_event(app: &AppHandle, event: MenuEvent) {
    let id = event.id().as_ref();

    if id == QUIT_ID {
        lock(app).log(JournalEvent::Quit);

        app.exit(0);

        return;
    }

    if id == JOURNAL_ID {
        journal_file::reveal(app);

        return;
    }

    if let Some(name) = id.strip_prefix(SCREEN_PREFIX) {
        let Some(screen) = screen_of(name) else {
            return;
        };

        runtime::navigate(app, screen);
        main_window::show(app);

        return;
    }

    if id == UPDATE_ID {
        update::install(app);

        return;
    }

    if id == OPEN_SETTINGS_ID {
        runtime::open_authorization_settings(app);

        return;
    }

    if id == AUTO_FOCUS_ID {
        lock(app).toggle_auto_focus();

        runtime::emit_snapshot(app);

        return;
    }

    if id == WALK_ID {
        walk::toggle(app, WalkFrom::Tray);

        runtime::emit_snapshot(app);

        return;
    }

    if id == RUNE_TABLE_ID {
        hand_over(app, TrayWork::RuneTable);

        return;
    }

    if id == RUNE_TABLE_HOME_ID {
        hand_over(app, TrayWork::RecallRuneTable);

        return;
    }

    if id == WAKE_MINIMIZED_ID {
        lock(app).toggle_wakes_minimized();

        runtime::emit_snapshot(app);

        return;
    }

    if id == RELAY_ID {
        if lock(app).is_relay_ready() {
            relay::run::toggle(app);
        } else {
            runtime::navigate(app, Screen::Relay);
            main_window::show(app);
        }

        return;
    }

    if id == MAXIMIZE_ALL_ID {
        hand_over(app, TrayWork::MaximizeAll);

        return;
    }

    if let Some(nickname) = id.strip_prefix(CHARACTER_PREFIX) {
        hand_over(
            app,
            TrayWork::Focus {
                nickname: nickname.to_owned(),
            },
        );
    }
}

fn foreground_game_window(app: &AppHandle) -> Option<WindowId> {
    windows(app)
        .foreground_game_window()
        .ok()
        .flatten()
        .map(|window| window.id())
}

fn hand_over(app: &AppHandle, work: TrayWork) {
    drop(app.state::<TrayQueue>().send(work));
}

fn switch_label(on: bool, undo: &'static str, redo: &'static str) -> &'static str {
    if on {
        undo
    } else {
        redo
    }
}

fn screen_id(screen: Screen) -> &'static str {
    match screen {
        Screen::Characters => "characters",
        Screen::Shortcuts => "shortcuts",
        Screen::QuickReplies => "quickReplies",
        Screen::AutoFocus => "autoFocus",
        Screen::Walk => "walk",
        Screen::Wheel => "wheel",
        Screen::RuneTable => "runeTable",
        Screen::Relay => "relay",
        Screen::Settings => "settings",
        Screen::About => "about",
    }
}

fn screen_of(name: &str) -> Option<Screen> {
    Screen::ALL
        .into_iter()
        .find(|screen| screen_id(*screen) == name)
}

fn screen_label(screen: Screen) -> &'static str {
    match screen {
        Screen::Characters => MENU_CHARACTERS,
        Screen::Shortcuts => MENU_SHORTCUTS,
        Screen::QuickReplies => MENU_QUICK_REPLIES,
        Screen::AutoFocus => MENU_AUTO_FOCUS_SCREEN,
        Screen::Walk => MENU_WALK_SCREEN,
        Screen::Wheel => MENU_WHEEL_SCREEN,
        Screen::RuneTable => MENU_RUNE_TABLE_SCREEN,
        Screen::Relay => MENU_RELAY,
        Screen::Settings => MENU_SETTINGS,
        Screen::About => MENU_ABOUT,
    }
}

fn start_worker(app: &AppHandle) {
    let (queue, works) = mpsc::channel::<TrayWork>();

    let spawned = thread::Builder::new()
        .name("multifus-tray".to_owned())
        .spawn({
            let app = app.clone();

            move || {
                for work in works {
                    if catch_unwind(AssertUnwindSafe(|| carry_out(&app, &work))).is_err() {
                        lock(&app).log_unless_repeated(JournalEvent::Panicked { work: Work::Tray });
                    }
                }
            }
        });

    if let Err(error) = spawned {
        lock(app).log(JournalEvent::TrayFailed {
            detail: error.to_string(),
        });
    }

    app.manage::<TrayQueue>(queue);
}

fn carry_out(app: &AppHandle, work: &TrayWork) {
    match work {
        TrayWork::Focus { nickname } => focus(app, nickname),
        TrayWork::MaximizeAll => {
            runtime::maximize_all(app, Surface::Tray);

            runtime::emit_snapshot(app);
        }
        TrayWork::RuneTable => {
            rune_table::toggle(app, foreground_game_window(app));

            runtime::emit_snapshot(app);
        }
        TrayWork::RecallRuneTable => rune_table::recall(app),
    }
}

fn focus(app: &AppHandle, nickname: &str) {
    let window = lock(app).window_of(nickname);

    let outcome = match window {
        None => TrayOutcome::NoWindow,
        Some(window) => match windows(app).focus(window) {
            Ok(()) => TrayOutcome::Focused,
            Err(PlatformError::WindowGone) => TrayOutcome::NoWindow,
            Err(error) => TrayOutcome::FocusFailed {
                detail: error.to_string(),
            },
        },
    };

    lock(app).log(JournalEvent::TrayFocus {
        nickname: nickname.to_owned(),
        outcome,
    });
}

fn report<T>(app: &AppHandle, outcome: tauri::Result<T>) {
    if let Err(error) = outcome {
        lock(app).log_unless_repeated(JournalEvent::TrayFailed {
            detail: error.to_string(),
        });
    }
}

fn shown_menu(app: &AppHandle) -> MutexGuard<'_, Option<Contents>> {
    app.state::<ShownMenu>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use super::*;
    use crate::app::view::ShortcutStatus;
    use crate::config::Settings;
    use crate::domain::Character;
    use crate::domain::Roster;
    use crate::test_doubles;
    use crate::test_doubles::directory;

    fn connected(nickname: &str, excluded: bool) -> CharacterView {
        CharacterView {
            nickname: nickname.to_owned(),
            gender: None,
            class: None,
            main: false,
            excluded,
            online: true,
            relayed: true,
            shortcut: None,
            shortcut_status: ShortcutStatus::Unbound,
        }
    }

    #[test]
    fn the_menu_carries_the_characters_on_screen_and_the_switches_as_they_stand() {
        let directory = directory();
        let mut state = test_doubles::multifus(
            &directory,
            test_doubles::intact(Settings {
                roster: Roster::from_characters(vec![
                    Character::new("Alpha"),
                    Character::new("Bravo"),
                ]),
                ..Settings::default()
            }),
        );

        state.apply_windows(&[test_doubles::game_window(1, "Alpha")]);

        let shown = contents(&state);

        assert_eq!(
            shown.entries,
            vec![Entry {
                nickname: "Alpha".to_owned(),
                label: "Alpha".to_owned(),
            }],
            "the character whose window the scan did not find is gone from the menu"
        );
        assert!(shown.granted);
        assert!(!shown.walk);
        assert_eq!(shown.relay, RelayItem::NotReady);
        assert_eq!(shown.update, None);
    }

    #[test]
    fn the_menu_only_differs_when_something_it_shows_differs() {
        let directory = directory();
        let mut state = test_doubles::multifus(
            &directory,
            test_doubles::intact(Settings {
                roster: Roster::from_characters(vec![Character::new("Alpha")]),
                ..Settings::default()
            }),
        );

        state.apply_windows(&[test_doubles::game_window(1, "Alpha")]);

        let shown = contents(&state);

        state.apply_windows(&[test_doubles::game_window(1, "Alpha")]);

        assert_eq!(contents(&state), shown);

        state.set_walk_enabled(true, WalkFrom::Shortcut);

        assert_ne!(contents(&state), shown);
    }

    #[test]
    fn the_menu_names_every_connected_character_and_says_which_are_set_aside() {
        let listed = entries(&[connected("Alpha", false), connected("Bravo", true)]);

        assert_eq!(
            listed,
            vec![
                Entry {
                    nickname: "Alpha".to_owned(),
                    label: "Alpha".to_owned(),
                },
                Entry {
                    nickname: "Bravo".to_owned(),
                    label: "Bravo (exclu)".to_owned(),
                },
            ]
        );
    }

    #[test]
    fn the_tooltip_counts_the_characters_and_agrees_with_itself() {
        assert_eq!(tooltip(0), "Multifus, aucun personnage connecté");
        assert_eq!(tooltip(1), "Multifus, 1 personnage connecté");
        assert_eq!(tooltip(6), "Multifus, 6 personnages connectés");
    }

    #[test]
    fn a_switch_of_the_menu_offers_the_gesture_that_undoes_what_is_on() {
        assert_eq!(
            switch_label(true, MENU_WALK_OFF, MENU_WALK_ON),
            "Désactiver le Déplacement rapide"
        );
        assert_eq!(
            switch_label(false, MENU_WALK_OFF, MENU_WALK_ON),
            "Activer le Déplacement rapide"
        );
        assert_eq!(
            switch_label(true, MENU_LEAVE_MINIMIZED, MENU_WAKE_MINIMIZED),
            "Laisser les fenêtres réduites"
        );
    }

    #[test]
    fn every_screen_of_the_rail_is_named_once_in_the_menu_and_read_back() {
        for screen in Screen::ALL {
            assert_eq!(screen_of(screen_id(screen)), Some(screen));
            assert!(!screen_label(screen).is_empty());
        }

        let ids = Screen::ALL.map(screen_id);
        let labels = Screen::ALL.map(screen_label);

        assert_eq!(ids.len(), ids.iter().collect::<HashSet<_>>().len());
        assert_eq!(labels.len(), labels.iter().collect::<HashSet<_>>().len());
    }

    #[test]
    fn a_menu_line_that_names_no_screen_takes_the_window_nowhere() {
        assert_eq!(screen_of("journal"), None);
        assert_eq!(screen_of(""), None);
        assert_eq!(screen_of("Characters"), None);
    }

    #[test]
    fn the_update_line_names_the_version_it_is_about_to_install() {
        assert_eq!(update_label("0.2.0"), "Installer la mise à jour 0.2.0");
    }

    #[test]
    fn the_relay_item_says_a_different_thing_for_each_of_its_three_states() {
        let labels = [RelayItem::NotReady, RelayItem::Off, RelayItem::On].map(relay_label);

        assert_eq!(
            labels,
            [
                "Configurer les messages privés…",
                "Recevoir mes messages privés",
                "Ne plus les recevoir"
            ]
        );
    }

    #[test]
    fn a_running_relay_is_never_offered_as_something_to_switch_on() {
        let mut contents = Contents {
            entries: Vec::new(),
            auto_focus: true,
            walk: false,
            rune_table: false,
            wakes_minimized: true,
            granted: true,
            update: None,
            relay: RelayItem::NotReady,
        };

        assert_eq!(relay_label(contents.relay), MENU_RELAY_SETUP);

        contents.relay = RelayItem::On;

        assert_ne!(
            contents,
            Contents {
                relay: RelayItem::NotReady,
                ..contents.clone()
            },
            "the relay has to move the comparison, or the menu sleeps through it"
        );
    }
}
