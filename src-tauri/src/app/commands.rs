//! What React is allowed to ask multifus to do.
//!
//! Every command that changes something returns the whole [`Snapshot`], so the
//! interface never has to guess what a change did to the rest of the screen and
//! two panels can never disagree. The window scan sends the same shape on the
//! same event, so React has one payload to handle and one place to handle it.
//!
//! Almost nothing here returns a `Result`. A save that fails, a system that
//! refuses, a file that will not open: none of them stop multifus, all of them
//! belong in the journal and, when the user has to act, in the snapshot. A
//! command that answered with an error string would put a second, English,
//! parallel channel next to those two.

use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::app::journal::JournalEvent;
use crate::app::runtime;
use crate::app::state::lock;
use crate::app::view::ShortcutAction;
use crate::app::view::Snapshot;
use crate::domain::Gender;
use crate::domain::NotificationKind;

/// The macOS settings pane that grants Accessibility.
///
/// The user has to go there by hand: the system dialog only offers to open it,
/// and only the first time it is asked. Sending them straight to the right pane
/// is the difference between an explanation screen and a dead end.
#[cfg(target_os = "macos")]
const AUTHORIZATION_SETTINGS_URL: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

/// The Windows pane for notification access, for step 9.
#[cfg(target_os = "windows")]
const AUTHORIZATION_SETTINGS_URL: &str = "ms-settings:privacy-notifications";

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

    lock(&app).snapshot()
}

/// Opens the system dialog for the authorization multifus needs.
#[tauri::command]
pub fn request_authorization(app: AppHandle) -> Snapshot {
    runtime::request_authorization(&app);

    lock(&app).snapshot()
}

/// Sends the user to the settings pane that grants it, since the system dialog
/// only offers to do so once.
#[tauri::command]
pub fn open_authorization_settings(app: AppHandle) {
    let opened = app
        .opener()
        .open_url(AUTHORIZATION_SETTINGS_URL, None::<&str>);

    if let Err(error) = opened {
        lock(&app).log(JournalEvent::OpenFailed {
            detail: error.to_string(),
        });
    }
}

// -- The characters screen ------------------------------------------------

/// Assigns a gender, or takes it away when the user clicks the one already on.
#[tauri::command]
pub fn set_gender(app: AppHandle, nickname: String, gender: Option<Gender>) -> Snapshot {
    let mut state = lock(&app);
    state.set_gender(&nickname, gender);

    state.snapshot()
}

/// Puts a character to sleep, or wakes it up. Not written to the file, ADR 0004.
#[tauri::command]
pub fn toggle_asleep(app: AppHandle, nickname: String) -> Snapshot {
    let mut state = lock(&app);
    state.toggle_asleep(&nickname);

    state.snapshot()
}

/// One of the two grouped actions of the characters screen.
#[tauri::command]
pub fn set_gender_asleep(app: AppHandle, gender: Gender, asleep: bool) -> Snapshot {
    let mut state = lock(&app);
    state.set_gender_asleep(gender, asleep);

    state.snapshot()
}

/// The new cycle order, as the drag and drop left it.
#[tauri::command]
pub fn reorder(app: AppHandle, order: Vec<String>) -> Snapshot {
    let mut state = lock(&app);
    state.reorder(&order);

    state.snapshot()
}

/// Takes a character out of the roster for good.
#[tauri::command]
pub fn remove_character(app: AppHandle, nickname: String) -> Snapshot {
    let mut state = lock(&app);
    state.remove(&nickname);

    state.snapshot()
}

// -- The shortcuts and AutoFocus screens ----------------------------------

/// Binds a combination to an action, or clears it with `null`.
///
/// Nothing here decides whether the system will accept it. The plugin of step 7
/// is what finds out, at the moment it registers, and the refusal has to reach
/// this screen then rather than leave the user with no shortcut and no message.
#[tauri::command]
pub fn set_shortcut(
    app: AppHandle,
    action: ShortcutAction,
    accelerator: Option<String>,
) -> Snapshot {
    let mut state = lock(&app);
    state.set_shortcut(action, accelerator);

    state.snapshot()
}

/// Flips one of the seven switches. Global, never per character, perimetre.md.
#[tauri::command]
pub fn set_auto_focus(app: AppHandle, kind: NotificationKind, enabled: bool) -> Snapshot {
    let mut state = lock(&app);
    state.set_auto_focus(kind, enabled);

    state.snapshot()
}

// -- The about screen -----------------------------------------------------

/// Everything back to the defaults, roster included. The interface asks first.
#[tauri::command]
pub fn reset(app: AppHandle) -> Snapshot {
    lock(&app).reset();

    // The connected characters come straight back, without their genders.
    runtime::refresh(&app);

    lock(&app).snapshot()
}

/// Drops the warning about the configuration file once it has been read.
#[tauri::command]
pub fn dismiss_config_problem(app: AppHandle) -> Snapshot {
    let mut state = lock(&app);
    state.dismiss_problem();

    state.snapshot()
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
    }
}
