//! What React is allowed to ask multifus to do.
//!
//! Every command that changes something returns the whole [`Snapshot`], so the
//! interface never has to guess what a change did to the rest of the screen and
//! two panels can never disagree. The window scan sends the same shape on the
//! same event, so React has one payload to handle and one place to handle it.
//!
//! **That answer comes from [`runtime::emit_snapshot`] and is never built here.**
//! A command that called `snapshot()` itself would answer the interface without
//! telling the system tray, and the two would drift apart the moment a character
//! was put to sleep from the window. One door out, and both surfaces are behind
//! it.
//!
//! Almost nothing here returns a `Result`. A save that fails, a system that
//! refuses, a file that will not open: none of them stop multifus, all of them
//! belong in the journal and, when the user has to act, in the snapshot. A
//! command that answered with an error string would put a second, English,
//! parallel channel next to those two.

use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::app::autostart;
use crate::app::journal::JournalEvent;
use crate::app::runtime;
use crate::app::shortcuts;
use crate::app::state::lock;
use crate::app::update;
use crate::app::view::ShortcutAction;
use crate::app::view::Snapshot;
use crate::domain::Gender;
use crate::domain::NotificationKind;

/// Everything the four screens draw. Called once on mount, before the interface
/// starts listening for the rest.
#[tauri::command]
pub fn snapshot(app: AppHandle) -> Snapshot {
    lock(&app).snapshot()
}

/// Looks at the game windows now rather than at the next turn of the scan.
#[tauri::command]
pub fn refresh(app: AppHandle) -> Snapshot {
    runtime::refresh(&app);

    runtime::emit_snapshot(&app)
}

/// Opens the system dialog for the authorization multifus needs.
#[tauri::command]
pub fn request_authorization(app: AppHandle) -> Snapshot {
    runtime::request_authorization(&app);

    runtime::emit_snapshot(&app)
}

/// Sends the user to the settings pane that grants it, since the system dialog
/// only offers to do so once.
#[tauri::command]
pub fn open_authorization_settings(app: AppHandle) {
    runtime::open_authorization_settings(&app);
}

// -- The characters screen ------------------------------------------------

/// Assigns a gender, or takes it away when the user clicks the one already on.
#[tauri::command]
pub fn set_gender(app: AppHandle, nickname: String, gender: Option<Gender>) -> Snapshot {
    lock(&app).set_gender(&nickname, gender);

    runtime::emit_snapshot(&app)
}

/// Puts a character to sleep, or wakes it up. Not written to the file, ADR 0004.
#[tauri::command]
pub fn toggle_asleep(app: AppHandle, nickname: String) -> Snapshot {
    lock(&app).toggle_asleep(&nickname);

    runtime::emit_snapshot(&app)
}

/// One of the two grouped actions of the characters screen.
#[tauri::command]
pub fn set_gender_asleep(app: AppHandle, gender: Gender, asleep: bool) -> Snapshot {
    lock(&app).set_gender_asleep(gender, asleep);

    runtime::emit_snapshot(&app)
}

/// The new cycle order, as the drag and drop left it.
#[tauri::command]
pub fn reorder(app: AppHandle, order: Vec<String>) -> Snapshot {
    lock(&app).reorder(&order);

    runtime::emit_snapshot(&app)
}

/// Takes a character out of the roster for good.
#[tauri::command]
pub fn remove_character(app: AppHandle, nickname: String) -> Snapshot {
    lock(&app).remove(&nickname);

    runtime::emit_snapshot(&app)
}

// -- The shortcuts and AutoFocus screens ----------------------------------

/// Binds a combination to an action, or clears it with `null`.
///
/// The four are laid on the system again right after, and the snapshot that
/// comes back carries what the system answered for each of them. A combination
/// it turns down therefore reaches this screen on the spot, instead of leaving
/// the user with a shortcut that is written down and does nothing.
#[tauri::command]
pub fn set_shortcut(
    app: AppHandle,
    action: ShortcutAction,
    accelerator: Option<String>,
) -> Snapshot {
    lock(&app).set_shortcut(action, accelerator);

    shortcuts::apply(&app);

    runtime::emit_snapshot(&app)
}

/// Flips one of the seven switches. Global, never per character, perimetre.md.
#[tauri::command]
pub fn set_auto_focus(app: AppHandle, kind: NotificationKind, enabled: bool) -> Snapshot {
    lock(&app).set_auto_focus(kind, enabled);

    runtime::emit_snapshot(&app)
}

/// Suspends the AutoFocus as a whole, or brings it back.
///
/// The same switch the system tray carries, and the reason the interface has to
/// show it: turned off from the menu, the seven rows would otherwise sit there
/// lit and do nothing.
#[tauri::command]
pub fn set_auto_focus_enabled(app: AppHandle, enabled: bool) -> Snapshot {
    lock(&app).set_auto_focus_enabled(enabled);

    runtime::emit_snapshot(&app)
}

/// Says whether a notification takes a window out of the Dock.
///
/// Only the AutoFocus reads this. A shortcut and a click in the system tray were
/// asked for by the user, so they bring the window back either way.
#[tauri::command]
pub fn set_wakes_minimized(app: AppHandle, wakes: bool) -> Snapshot {
    lock(&app).set_wakes_minimized(wakes);

    runtime::emit_snapshot(&app)
}

/// Asks multifus to start with the session, or to stop doing so.
///
/// The configuration is written first and the system is made to follow, never
/// the other way round: what the file holds is the intent, and the registration
/// on disk is only ever its consequence. See [`crate::app::autostart`].
#[tauri::command]
pub fn set_start_at_login(app: AppHandle, start_at_login: bool) -> Snapshot {
    lock(&app).set_start_at_login(start_at_login);

    autostart::reconcile(&app);

    runtime::emit_snapshot(&app)
}

// -- The about screen -----------------------------------------------------

/// Everything back to the defaults, roster included. The interface asks first.
#[tauri::command]
pub fn reset(app: AppHandle) -> Snapshot {
    lock(&app).reset();

    // The four default combinations are not the ones that were on the system a
    // moment ago, so they have to be laid down again.
    shortcuts::apply(&app);

    // A reset unchecks the start with the session, and the registration on disk
    // has to go with it rather than survive the setting that asked for it.
    autostart::reconcile(&app);

    // The connected characters come straight back, without their genders.
    runtime::refresh(&app);

    runtime::emit_snapshot(&app)
}

/// Asks the endpoint whether a newer version is out.
///
/// Comes back with the check in flight rather than with its answer: the request
/// is a network round trip, and what it finds arrives through a snapshot of its
/// own. See [`crate::app::update`].
#[tauri::command]
pub fn check_update(app: AppHandle) -> Snapshot {
    update::check(&app);

    runtime::emit_snapshot(&app)
}

/// Downloads the update that was found and restarts multifus on it.
#[tauri::command]
pub fn install_update(app: AppHandle) -> Snapshot {
    update::install(&app);

    runtime::emit_snapshot(&app)
}

/// Drops the warning about the configuration file once it has been read.
#[tauri::command]
pub fn dismiss_config_problem(app: AppHandle) -> Snapshot {
    lock(&app).dismiss_problem();

    runtime::emit_snapshot(&app)
}

/// Shows the file that was set aside, in the system's own file browser.
///
/// The path is taken from the state and never from the interface, so nothing
/// that crosses the bridge can point this at another file.
#[tauri::command]
pub fn reveal_quarantined_config(app: AppHandle) {
    let Some(path) = lock(&app).quarantined_path().map(str::to_owned) else {
        return;
    };

    if let Err(error) = app.opener().reveal_item_in_dir(path) {
        lock(&app).log(JournalEvent::OpenFailed {
            detail: error.to_string(),
        });

        // Same as above: nothing comes back from this command, so the journal
        // line has to be sent rather than wait for a passing snapshot.
        runtime::emit_snapshot(&app);
    }
}
