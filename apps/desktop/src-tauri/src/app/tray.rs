use std::panic::AssertUnwindSafe;
use std::panic::catch_unwind;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::sync::mpsc;
use std::sync::mpsc::Sender;
use std::thread;

use tauri::AppHandle;
use tauri::Manager;
use tauri::Wry;
use tauri::image::Image;
use tauri::menu::Menu;
use tauri::menu::MenuEvent;
use tauri::menu::MenuItem;
use tauri::menu::PredefinedMenuItem;

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
use crate::app::state::Multifus;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::app::update;
use crate::app::view::CharacterView;
use crate::app::view::Screen;
use crate::app::walk;
use crate::config::Language;
use crate::platform::PlatformError;
use crate::platform::WindowId;

struct MenuWords {
    characters: &'static str,
    shortcuts: &'static str,
    quick_replies: &'static str,
    auto_focus_screen: &'static str,
    walk_screen: &'static str,
    wheel_screen: &'static str,
    rune_table_screen: &'static str,
    relay: &'static str,
    settings: &'static str,
    about: &'static str,
    quit: &'static str,
    nobody: &'static str,
    excluded: &'static str,
    maximize_all: &'static str,
    auto_focus_on: &'static str,
    auto_focus_off: &'static str,
    walk_on: &'static str,
    walk_off: &'static str,
    rune_table_on: &'static str,
    rune_table_off: &'static str,
    rune_table_home: &'static str,
    wake_minimized: &'static str,
    leave_minimized: &'static str,
    relay_setup: &'static str,
    relay_on: &'static str,
    relay_off: &'static str,
    denied: &'static str,
    open_settings: &'static str,
    journal: &'static str,
}

const FRENCH_MENU: MenuWords = MenuWords {
    characters: "Personnages",
    shortcuts: "Raccourcis",
    quick_replies: "Réponses rapides",
    auto_focus_screen: "AutoFocus",
    walk_screen: "Déplacement rapide",
    wheel_screen: "Roue des personnages",
    rune_table_screen: "Tableau des runes",
    relay: "Messages privés",
    settings: "Paramètres",
    about: "À propos",
    quit: "Quitter Multifus",
    nobody: "Aucun personnage connecté",
    excluded: " (exclu)",
    maximize_all: "Agrandir les fenêtres",
    auto_focus_on: "Activer l'AutoFocus",
    auto_focus_off: "Désactiver l'AutoFocus",
    walk_on: "Activer le Déplacement rapide",
    walk_off: "Désactiver le Déplacement rapide",
    rune_table_on: "Montrer le tableau des runes",
    rune_table_off: "Cacher le tableau des runes",
    rune_table_home: "Remettre le tableau à sa position initiale",
    wake_minimized: "Aller chercher les fenêtres réduites",
    leave_minimized: "Laisser les fenêtres réduites",
    relay_setup: "Configurer les messages privés…",
    relay_on: "Recevoir mes messages privés",
    relay_off: "Ne plus les recevoir",
    denied: "Autorisation manquante",
    open_settings: if cfg!(target_os = "macos") {
        "Ouvrir Réglages Système"
    } else {
        "Ouvrir les réglages du système"
    },
    journal: "Montrer le journal",
};

const ENGLISH_MENU: MenuWords = MenuWords {
    characters: "Characters",
    shortcuts: "Shortcuts",
    quick_replies: "Quick replies",
    auto_focus_screen: "AutoFocus",
    walk_screen: "Quick move",
    wheel_screen: "Character wheel",
    rune_table_screen: "Rune table",
    relay: "Private messages",
    settings: "Settings",
    about: "About",
    quit: "Quit Multifus",
    nobody: "Nobody online",
    excluded: " (set aside)",
    maximize_all: "Maximize the windows",
    auto_focus_on: "Turn AutoFocus on",
    auto_focus_off: "Turn AutoFocus off",
    walk_on: "Turn Quick move on",
    walk_off: "Turn Quick move off",
    rune_table_on: "Show the rune table",
    rune_table_off: "Hide the rune table",
    rune_table_home: "Put the table back where it started",
    wake_minimized: "Go and fetch minimized windows",
    leave_minimized: "Leave minimized windows alone",
    relay_setup: "Set up private messages…",
    relay_on: "Get my private messages",
    relay_off: "Stop getting them",
    denied: "Permission missing",
    open_settings: if cfg!(target_os = "macos") {
        "Open System Settings"
    } else {
        "Open the system settings"
    },
    journal: "Show the log",
};

const SPANISH_MENU: MenuWords = MenuWords {
    characters: "Personajes",
    shortcuts: "Atajos",
    quick_replies: "Respuestas rápidas",
    auto_focus_screen: "AutoFocus",
    walk_screen: "Movimiento rápido",
    wheel_screen: "Rueda de personajes",
    rune_table_screen: "Tabla de runas",
    relay: "Mensajes privados",
    settings: "Ajustes",
    about: "Acerca de",
    quit: "Salir de Multifus",
    nobody: "Ningún personaje conectado",
    excluded: " (apartado)",
    maximize_all: "Maximizar las ventanas",
    auto_focus_on: "Activar el AutoFocus",
    auto_focus_off: "Desactivar el AutoFocus",
    walk_on: "Encender el Movimiento rápido",
    walk_off: "Apagar el Movimiento rápido",
    rune_table_on: "Mostrar la tabla de runas",
    rune_table_off: "Ocultar la tabla de runas",
    rune_table_home: "Devolver la tabla a su posición inicial",
    wake_minimized: "Ir a buscar las ventanas minimizadas",
    leave_minimized: "Dejar las ventanas minimizadas",
    relay_setup: "Configurar los mensajes privados…",
    relay_on: "Recibir mis mensajes privados",
    relay_off: "Dejar de recibirlos",
    denied: "Falta la autorización",
    open_settings: if cfg!(target_os = "macos") {
        "Abrir Ajustes del Sistema"
    } else {
        "Abrir la configuración del sistema"
    },
    journal: "Mostrar el registro",
};

fn words(language: Language) -> &'static MenuWords {
    match language {
        Language::Fr => &FRENCH_MENU,
        Language::En => &ENGLISH_MENU,
        Language::Es => &SPANISH_MENU,
    }
}

fn update_label(version: &str, language: Language) -> String {
    match language {
        Language::Fr => format!("Installer la mise à jour {version}"),
        Language::En => format!("Install update {version}"),
        Language::Es => format!("Instalar la actualización {version}"),
    }
}

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
    language: Language,
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

fn tooltip(connected: usize, language: Language) -> String {
    match (language, connected) {
        (Language::Fr, 0) => "Multifus, aucun personnage connecté".to_owned(),
        (Language::Fr, 1) => "Multifus, 1 personnage connecté".to_owned(),
        (Language::Fr, count) => format!("Multifus, {count} personnages connectés"),
        (Language::En, 0) => "Multifus, nobody online".to_owned(),
        (Language::En, 1) => "Multifus, 1 character online".to_owned(),
        (Language::En, count) => format!("Multifus, {count} characters online"),
        (Language::Es, 0) => "Multifus, ningún personaje conectado".to_owned(),
        (Language::Es, 1) => "Multifus, 1 personaje conectado".to_owned(),
        (Language::Es, count) => format!("Multifus, {count} personajes conectados"),
    }
}

fn contents(state: &Multifus) -> Contents {
    Contents {
        language: state.language(),
        entries: entries(&state.connected(), state.language()),
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

fn relay_label(item: RelayItem, language: Language) -> &'static str {
    let words = words(language);

    match item {
        RelayItem::NotReady => words.relay_setup,
        RelayItem::Off => words.relay_on,
        RelayItem::On => words.relay_off,
    }
}

fn entries(connected: &[CharacterView], language: Language) -> Vec<Entry> {
    let aside = words(language).excluded;

    connected
        .iter()
        .map(|character| Entry {
            nickname: character.nickname.clone(),
            label: if character.excluded {
                format!("{}{aside}", character.nickname)
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
        .tooltip(tooltip(0, lock(app).language()))
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
        icon.set_tooltip(Some(tooltip(wanted.entries.len(), wanted.language)))
    });

    if built.is_err() {
        *shown_menu(app) = None;
    }

    report(app, built);
}

fn build_menu(app: &AppHandle, contents: &Contents) -> tauri::Result<Menu<Wry>> {
    let menu = Menu::new(app)?;
    let words = words(contents.language);

    if !contents.granted {
        menu.append(&MenuItem::with_id(
            app,
            DENIED_ID,
            words.denied,
            false,
            None::<&str>,
        )?)?;
        menu.append(&MenuItem::with_id(
            app,
            OPEN_SETTINGS_ID,
            words.open_settings,
            true,
            None::<&str>,
        )?)?;
        menu.append(&PredefinedMenuItem::separator(app)?)?;
    }

    if contents.entries.is_empty() {
        menu.append(&MenuItem::with_id(
            app,
            NOBODY_ID,
            words.nobody,
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
        words.maximize_all,
        true,
        None::<&str>,
    )?)?;

    menu.append(&PredefinedMenuItem::separator(app)?)?;

    menu.append(&MenuItem::with_id(
        app,
        AUTO_FOCUS_ID,
        switch_label(
            contents.auto_focus,
            words.auto_focus_off,
            words.auto_focus_on,
        ),
        true,
        None::<&str>,
    )?)?;

    menu.append(&MenuItem::with_id(
        app,
        WALK_ID,
        switch_label(contents.walk, words.walk_off, words.walk_on),
        true,
        None::<&str>,
    )?)?;

    menu.append(&MenuItem::with_id(
        app,
        RUNE_TABLE_ID,
        switch_label(
            contents.rune_table,
            words.rune_table_off,
            words.rune_table_on,
        ),
        true,
        None::<&str>,
    )?)?;

    if contents.rune_table {
        menu.append(&MenuItem::with_id(
            app,
            RUNE_TABLE_HOME_ID,
            words.rune_table_home,
            true,
            None::<&str>,
        )?)?;
    }

    menu.append(&MenuItem::with_id(
        app,
        WAKE_MINIMIZED_ID,
        switch_label(
            contents.wakes_minimized,
            words.leave_minimized,
            words.wake_minimized,
        ),
        true,
        None::<&str>,
    )?)?;

    menu.append(&MenuItem::with_id(
        app,
        RELAY_ID,
        relay_label(contents.relay, contents.language),
        true,
        None::<&str>,
    )?)?;

    menu.append(&PredefinedMenuItem::separator(app)?)?;

    for screen in Screen::ALL {
        menu.append(&MenuItem::with_id(
            app,
            format!("{SCREEN_PREFIX}{}", screen_id(screen)),
            screen_label(screen, contents.language),
            true,
            None::<&str>,
        )?)?;
    }

    menu.append(&MenuItem::with_id(
        app,
        JOURNAL_ID,
        words.journal,
        true,
        None::<&str>,
    )?)?;

    menu.append(&PredefinedMenuItem::separator(app)?)?;

    if let Some(version) = &contents.update {
        menu.append(&MenuItem::with_id(
            app,
            UPDATE_ID,
            update_label(version, contents.language),
            true,
            None::<&str>,
        )?)?;
    }

    menu.append(&MenuItem::with_id(
        app,
        QUIT_ID,
        words.quit,
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
    if on { undo } else { redo }
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

fn screen_label(screen: Screen, language: Language) -> &'static str {
    let words = words(language);

    match screen {
        Screen::Characters => words.characters,
        Screen::Shortcuts => words.shortcuts,
        Screen::QuickReplies => words.quick_replies,
        Screen::AutoFocus => words.auto_focus_screen,
        Screen::Walk => words.walk_screen,
        Screen::Wheel => words.wheel_screen,
        Screen::RuneTable => words.rune_table_screen,
        Screen::Relay => words.relay,
        Screen::Settings => words.settings,
        Screen::About => words.about,
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
            color: None,
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
        let listed = entries(
            &[connected("Alpha", false), connected("Bravo", true)],
            Language::Fr,
        );

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
        assert_eq!(
            tooltip(0, Language::Fr),
            "Multifus, aucun personnage connecté"
        );
        assert_eq!(tooltip(1, Language::Fr), "Multifus, 1 personnage connecté");
        assert_eq!(
            tooltip(6, Language::Fr),
            "Multifus, 6 personnages connectés"
        );
        assert_eq!(tooltip(0, Language::En), "Multifus, nobody online");
        assert_eq!(tooltip(1, Language::En), "Multifus, 1 character online");
        assert_eq!(tooltip(6, Language::En), "Multifus, 6 characters online");
        assert_eq!(
            tooltip(0, Language::Es),
            "Multifus, ningún personaje conectado"
        );
        assert_eq!(tooltip(1, Language::Es), "Multifus, 1 personaje conectado");
        assert_eq!(
            tooltip(6, Language::Es),
            "Multifus, 6 personajes conectados"
        );
    }

    #[test]
    fn a_switch_of_the_menu_offers_the_gesture_that_undoes_what_is_on() {
        let french = words(Language::Fr);

        assert_eq!(
            switch_label(true, french.walk_off, french.walk_on),
            "Désactiver le Déplacement rapide"
        );
        assert_eq!(
            switch_label(false, french.walk_off, french.walk_on),
            "Activer le Déplacement rapide"
        );
        assert_eq!(
            switch_label(true, french.leave_minimized, french.wake_minimized),
            "Laisser les fenêtres réduites"
        );
    }

    #[test]
    fn every_screen_of_the_rail_is_named_once_in_the_menu_and_read_back() {
        for screen in Screen::ALL {
            assert_eq!(screen_of(screen_id(screen)), Some(screen));
        }

        let ids = Screen::ALL.map(screen_id);

        assert_eq!(ids.len(), ids.iter().collect::<HashSet<_>>().len());

        for language in Language::ALL {
            let labels = Screen::ALL.map(|screen| screen_label(screen, language));

            assert!(labels.iter().all(|label| !label.is_empty()));
            assert_eq!(labels.len(), labels.iter().collect::<HashSet<_>>().len());
        }
    }

    #[test]
    fn a_menu_line_that_names_no_screen_takes_the_window_nowhere() {
        assert_eq!(screen_of("journal"), None);
        assert_eq!(screen_of(""), None);
        assert_eq!(screen_of("Characters"), None);
    }

    #[test]
    fn the_update_line_names_the_version_it_is_about_to_install() {
        assert_eq!(
            update_label("0.2.0", Language::Fr),
            "Installer la mise à jour 0.2.0"
        );
        assert_eq!(update_label("0.2.0", Language::En), "Install update 0.2.0");
        assert_eq!(
            update_label("0.2.0", Language::Es),
            "Instalar la actualización 0.2.0"
        );
    }

    #[test]
    fn the_relay_item_says_a_different_thing_for_each_of_its_three_states() {
        let labels = [RelayItem::NotReady, RelayItem::Off, RelayItem::On]
            .map(|item| relay_label(item, Language::Fr));

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
    fn a_menu_shown_in_one_language_is_rebuilt_when_the_other_is_picked() {
        let french = Contents {
            language: Language::Fr,
            entries: Vec::new(),
            auto_focus: true,
            walk: false,
            rune_table: false,
            wakes_minimized: true,
            granted: true,
            update: None,
            relay: RelayItem::NotReady,
        };

        assert_ne!(
            french,
            Contents {
                language: Language::En,
                ..french.clone()
            },
            "the language has to move the comparison, or the menu stays in French"
        );
    }

    #[test]
    fn a_running_relay_is_never_offered_as_something_to_switch_on() {
        let mut contents = Contents {
            language: Language::Fr,
            entries: Vec::new(),
            auto_focus: true,
            walk: false,
            rune_table: false,
            wakes_minimized: true,
            granted: true,
            update: None,
            relay: RelayItem::NotReady,
        };

        assert_eq!(
            relay_label(contents.relay, contents.language),
            "Configurer les messages privés…"
        );

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
