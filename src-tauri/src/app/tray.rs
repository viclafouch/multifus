//! The system tray icon, and the roster it shows without opening the window.
//!
//! multifus is meant to be launched and forgotten, so the window is not the
//! application: closing it leaves the icon behind, and quitting is a menu item.
//! The menu lists the connected characters in cycle order with their veille, and
//! clicking one brings its window to the front. Only the connected ones are
//! there: a system tray is a place one jumps from, and an item for a character
//! whose client is closed would be an item that cannot do anything.
//!
//! **This module writes French, and it is the only one on this side that does.**
//! The rule everywhere else is that the Rust side never holds a sentence for the
//! user, because the journal crosses the bridge as structured events and the
//! interface owns the wording. A menu of the system is a third surface, one React
//! cannot draw at all: an `NSMenu` is built here or nowhere. So the words live at
//! the top of this file, in one block, and `src/lib/strings.ts` stays the one
//! place that holds the words of the *window*.
//!
//! **The lock of [`crate::app::state`] is never held while touching this icon.**
//! Every setter of a tray or of a menu goes through Tauri's
//! `run_item_main_thread!`, which posts the work to the main thread and then
//! blocks on a channel with no timeout; the main thread is where every command
//! takes that lock. It is the same shape as the global shortcut plugin, and the
//! same rule is what keeps it safe.
//!
//! **Nothing the system asks for is done on the thread it asks on.** A menu event
//! arrives on the main thread, and focusing a client is an Accessibility round
//! trip that a hung game would hold until the system's messaging timeout. So a
//! character click is queued and answered on the worker below, exactly as a
//! shortcut is.

use std::sync::mpsc;
use std::sync::mpsc::Sender;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::thread;

use tauri::menu::Menu;
use tauri::menu::MenuEvent;
use tauri::menu::MenuItem;
use tauri::menu::PredefinedMenuItem;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Wry;

use crate::app::journal::JournalEvent;
use crate::app::journal::TrayOutcome;
use crate::app::main_window;
use crate::app::runtime;
use crate::app::state::lock;
use crate::app::update;
use crate::app::view::CharacterView;
use crate::app::view::Screen;
use crate::platform::PlatformError;
use crate::platform::PlatformWindowManager;
use crate::platform::WindowManager;

// The words of the menu. See the note at the top of this module for why they are
// here and not in the strings file of the interface.
// The four screens carry the names the rail gives them, so that the menu and the
// window call the same place by the same word.
const MENU_CHARACTERS: &str = "Personnages";
const MENU_SHORTCUTS: &str = "Raccourcis";
const MENU_AUTO_FOCUS_SCREEN: &str = "AutoFocus";
const MENU_ABOUT: &str = "À propos";
const MENU_QUIT: &str = "Quitter multifus";
const MENU_NOBODY: &str = "Aucun personnage connecté";
const MENU_ASLEEP: &str = " (en veille)";
// The two settings say the verb rather than wear a tick. A ticked noun sat next
// to the four screen names and read like one of them: « AutoFocus » looked like
// somewhere to go, not something to switch. A line that starts with a verb can
// only be an action, and the verb it starts with says which way it will go.
const MENU_AUTO_FOCUS_ON: &str = "Activer l'AutoFocus";
const MENU_AUTO_FOCUS_OFF: &str = "Désactiver l'AutoFocus";
const MENU_DENIED: &str = "Autorisation manquante";

/// The line that names the version that is out. Only ever there when a check
/// has found one, since a menu item that says « nothing new » is an item that
/// has never been worth a click.
fn update_label(version: &str) -> String {
    format!("Installer la mise à jour {version}")
}

// Each system calls its own pane by its own name, exactly as the window does.
#[cfg(target_os = "macos")]
const MENU_OPEN_SETTINGS: &str = "Ouvrir Réglages Système";
#[cfg(not(target_os = "macos"))]
const MENU_OPEN_SETTINGS: &str = "Ouvrir les réglages du système";

/// The one icon multifus puts in the system tray.
const TRAY_ID: &str = "multifus";

/// What every screen item's identifier starts with. The screen follows, as its
/// own serialised name.
const SCREEN_PREFIX: &str = "multifus://screen/";

/// The item that ends the process. The only way out once the window no longer
/// quits.
const QUIT_ID: &str = "multifus://quit";

/// The item shown when nobody is connected, which answers rather than does.
const NOBODY_ID: &str = "multifus://nobody";

/// The tick that suspends the AutoFocus without forgetting the seven kinds.
const AUTO_FOCUS_ID: &str = "multifus://auto-focus";

/// The item that replaces multifus with the version that is out and restarts it.
const UPDATE_ID: &str = "multifus://update";

/// The line that says multifus is not allowed to work, and the one that leads
/// to the pane where that is fixed.
const DENIED_ID: &str = "multifus://denied";
const OPEN_SETTINGS_ID: &str = "multifus://open-settings";

/// What every character item's identifier starts with.
///
/// The nickname follows, whatever it contains: the prefix is what gets stripped
/// back off, so nothing about the shape of a pseudo is assumed here.
const CHARACTER_PREFIX: &str = "multifus://character/";

/// The queue a clicked character travels on, from the main thread to the worker.
type TrayQueue = Sender<String>;

/// The menu as it is on screen right now, `None` when nobody knows.
///
/// What makes [`refresh`] free to be called from anywhere. `None` is not an
/// empty menu: it is the state before the first build and after a failed one,
/// and it always rebuilds.
type ShownMenu = Mutex<Option<Contents>>;

/// Everything the menu draws, and the whole of what it is compared on.
///
/// A field that does not travel here is a change the menu would sleep through,
/// which is the one mistake this type exists to make impossible.
#[derive(Debug, Clone, PartialEq, Eq)]
struct Contents {
    entries: Vec<Entry>,
    auto_focus: bool,
    granted: bool,
    /// The version a check found, `None` when there is nothing to offer.
    update: Option<String>,
}

/// One line of the menu: the character it aims at, and what it says.
#[derive(Debug, Clone, PartialEq, Eq)]
struct Entry {
    nickname: String,
    label: String,
}

/// The tooltip, which is what the icon says without being clicked.
fn tooltip(connected: usize) -> String {
    match connected {
        0 => "multifus, aucun personnage connecté".to_owned(),
        1 => "multifus, 1 personnage connecté".to_owned(),
        count => format!("multifus, {count} personnages connectés"),
    }
}

/// Everything the menu should say right now.
///
/// Read in one pass under the lock, so the tick and the lines can never come
/// from two different moments.
fn contents(app: &AppHandle) -> Contents {
    let state = lock(app);

    Contents {
        entries: entries(&state.connected()),
        auto_focus: state.is_auto_focus_enabled(),
        granted: state.is_granted(),
        update: state.available_update(),
    }
}

/// What the menu should say about the connected characters.
fn entries(connected: &[CharacterView]) -> Vec<Entry> {
    connected
        .iter()
        .map(|character| Entry {
            nickname: character.nickname.clone(),
            label: if character.asleep {
                format!("{}{MENU_ASLEEP}", character.nickname)
            } else {
                character.nickname.clone()
            },
        })
        .collect()
}

/// Puts the icon in the system tray and starts the thread that answers it.
///
/// A failure here costs the icon and nothing else: the window, the shortcuts and
/// the AutoFocus are untouched, so it is written down and multifus carries on.
/// What it does cost is the way to quit, which is why the close of the window is
/// only intercepted when [`is_present`] says there is an icon to fall back on.
pub fn setup(app: &AppHandle) {
    app.manage::<ShownMenu>(Mutex::new(None));

    start_worker(app);

    let built = tauri::tray::TrayIconBuilder::with_id(TRAY_ID)
        .icon(tauri::include_image!("./icons/tray.png"))
        // macOS recolours a template image itself, white on a dark menu bar and
        // black on a light one. Without this the glyph goes up as it is drawn
        // and disappears into one of the two.
        .icon_as_template(true)
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

/// There is an icon in the system tray, so closing the window is not losing multifus.
#[must_use]
pub fn is_present(app: &AppHandle) -> bool {
    app.tray_by_id(TRAY_ID).is_some()
}

/// Makes the menu match the roster, and does nothing when it already does.
///
/// **Idempotent, and that is what lets it be called from anywhere.** Every path
/// that emits a snapshot ends here, settings changes included, so the rule of
/// the project stays a single line: what changes the roster emits a snapshot.
/// The cost of that generosity is one comparison, since a menu whose lines have
/// not moved is not rebuilt.
///
/// A menu the user has open at that moment is not disturbed: the system keeps
/// tracking the one it is showing, and the new one takes over at the next click.
/// The worst that costs is a click on a character that has just gone, which the
/// worker answers with the same « fenêtre disparue » as anything else would.
pub fn refresh(app: &AppHandle) {
    let Some(icon) = app.tray_by_id(TRAY_ID) else {
        return;
    };

    // The lock is taken and given back here, before a single menu call. See the
    // note at the top of this module.
    let wanted = contents(app);

    // And this one is given back too, for the same reason: holding it across a
    // menu setter would let a background thread waiting on the main thread meet
    // a main thread waiting on this.
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
        // What is on screen is now unknown rather than what was just asked for,
        // so the next call has to try again instead of finding itself in step.
        *shown_menu(app) = None;
    }

    report(app, built);
}

/// The menu as it stands: who is connected, then the two things a system tray icon
/// is for.
fn build_menu(app: &AppHandle, contents: &Contents) -> tauri::Result<Menu<Wry>> {
    let menu = Menu::new(app)?;

    // A refused authorization comes first, because nothing below it works. The
    // window would say the same thing, but the whole point of this icon is not
    // having to open the window: multifus gone deaf has to be readable from the
    // system tray, with the way to fix it right underneath.
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
        // Not an empty menu: an icon whose menu says nothing reads as broken,
        // and « nobody is connected » is the answer being looked for.
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

    menu.append(&PredefinedMenuItem::separator(app)?)?;

    // The one setting worth reaching without opening the window: an evening
    // where the focus has to stop moving is called off from here in one click.
    // It suspends the seven kinds rather than clearing them, so turning it back
    // on gives back exactly what was there.
    menu.append(&MenuItem::with_id(
        app,
        AUTO_FOCUS_ID,
        switch_label(contents.auto_focus, MENU_AUTO_FOCUS_OFF, MENU_AUTO_FOCUS_ON),
        true,
        None::<&str>,
    )?)?;

    // Four lines rather than one « Ouvrir », because opening the window is never
    // the thing one wants: going to one of its screens is. The rail is three
    // clicks away otherwise, and this icon exists to save exactly those.
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

    menu.append(&PredefinedMenuItem::separator(app)?)?;

    // Next to the way out rather than at the top, and for the same reason it is
    // offered here at all: installing restarts multifus, so it sits with the
    // other item that ends the process and not among the ones that do not.
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

/// An item was clicked, on the main thread.
///
/// Showing the window and ending the process are both cheap and both belong to
/// this thread, so they happen here. A character is a system call into a game
/// client, so it is queued.
fn on_menu_event(app: &AppHandle, event: MenuEvent) {
    let id = event.id().as_ref();

    if id == QUIT_ID {
        // The only way out. `exit` carries a code, which is how the run loop
        // tells this apart from a window the user merely closed.
        app.exit(0);

        return;
    }

    if let Some(name) = id.strip_prefix(SCREEN_PREFIX) {
        let Some(screen) = screen_of(name) else {
            return;
        };

        // The window comes forward first, so that the screen it lands on is the
        // one that was asked for rather than the one it was left on.
        runtime::navigate(app, screen);
        main_window::show(app);

        return;
    }

    if id == UPDATE_ID {
        // The download is asked for and not waited on: what comes back through
        // the snapshot is the menu losing this line, and then multifus
        // restarting on its own. See `app::update`.
        update::install(app);

        return;
    }

    if id == OPEN_SETTINGS_ID {
        runtime::open_authorization_settings(app);

        return;
    }

    if id == AUTO_FOCUS_ID {
        // The tick the system has already drawn is not the truth. The state
        // flips, and what the menu shows next comes back through the snapshot,
        // like every other surface.
        lock(app).toggle_auto_focus();

        runtime::emit_snapshot(app);

        return;
    }

    if let Some(nickname) = id.strip_prefix(CHARACTER_PREFIX) {
        // A send that fails means the worker never came up, which
        // [`start_worker`] has already written down. Saying it again on every
        // click would only bury it.
        drop(app.state::<TrayQueue>().send(nickname.to_owned()));
    }
}

/// What a setting's line says: the verb that undoes it when it is on, the verb
/// that does it when it is off.
fn switch_label(on: bool, undo: &'static str, redo: &'static str) -> &'static str {
    if on {
        undo
    } else {
        redo
    }
}

/// The stable name a screen travels under, in the menu and on the bridge.
fn screen_id(screen: Screen) -> &'static str {
    match screen {
        Screen::Characters => "characters",
        Screen::Shortcuts => "shortcuts",
        Screen::AutoFocus => "autoFocus",
        Screen::About => "about",
    }
}

/// The screen a clicked item names, `None` for one this version does not know.
fn screen_of(name: &str) -> Option<Screen> {
    Screen::ALL
        .into_iter()
        .find(|screen| screen_id(*screen) == name)
}

/// What the menu calls each screen.
fn screen_label(screen: Screen) -> &'static str {
    match screen {
        Screen::Characters => MENU_CHARACTERS,
        Screen::Shortcuts => MENU_SHORTCUTS,
        Screen::AutoFocus => MENU_AUTO_FOCUS_SCREEN,
        Screen::About => MENU_ABOUT,
    }
}

/// Starts the thread that answers a clicked character, for the life of the
/// process.
fn start_worker(app: &AppHandle) {
    let (queue, nicknames) = mpsc::channel::<String>();

    let spawned = thread::Builder::new()
        .name("multifus-tray".to_owned())
        .spawn({
            let app = app.clone();

            move || {
                for nickname in nicknames {
                    focus(&app, &nickname);
                }
            }
        });

    if let Err(error) = spawned {
        // Without this thread every item of the menu is dead. It has to be said
        // rather than swallowed.
        lock(app).log(JournalEvent::TrayFailed {
            detail: error.to_string(),
        });
    }

    app.manage::<TrayQueue>(queue);
}

/// Brings a character's window to the front, on the worker thread.
fn focus(app: &AppHandle, nickname: &str) {
    let window = lock(app).window_of(nickname);

    let outcome = match window {
        // The menu was built from a roster this character has left since. A
        // click on a stale item lands here, and says so.
        None => TrayOutcome::NoWindow,
        Some(window) => match app.state::<PlatformWindowManager>().focus(window) {
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

/// Writes down what the system refused, and swallows nothing.
fn report<T>(app: &AppHandle, outcome: tauri::Result<T>) {
    if let Err(error) = outcome {
        lock(app).log_unless_repeated(JournalEvent::TrayFailed {
            detail: error.to_string(),
        });
    }
}

/// What the menu shows, taken even if a previous holder panicked. See the note
/// on [`crate::app::state::lock`].
fn shown_menu(app: &AppHandle) -> MutexGuard<'_, Option<Contents>> {
    app.state::<ShownMenu>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}
