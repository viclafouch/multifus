//! What React is allowed to ask Multifus to do.
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
//! refuses, a file that will not open: none of them stop Multifus, all of them
//! belong in the journal and, when the user has to act, in the snapshot. A
//! command that answered with an error string would put a second, English,
//! parallel channel next to those two.

use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::app::autostart;
use crate::app::journal::JournalEvent;
use crate::app::journal::RelayStop;
use crate::app::journal::Surface;
use crate::app::journal_file;
use crate::app::relay;
use crate::app::runtime;
use crate::app::shortcuts;
use crate::app::state::lock;
use crate::app::update;
use crate::app::view::ShortcutAction;
use crate::app::view::Snapshot;
use crate::config::QuickReplyId;
use crate::domain::Gender;
use crate::domain::NotificationKind;

/// Everything the six screens draw. Called once on mount, before the interface
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

/// Opens the system dialog for the authorization Multifus needs.
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

/// Adds an empty quick reply at the end of the list. Nothing is laid on the system,
/// a quick reply being born without a combination.
#[tauri::command]
pub fn add_quick_reply(app: AppHandle) -> Snapshot {
    lock(&app).add_quick_reply();

    runtime::emit_snapshot(&app)
}

/// Rewrites the line a quick reply pastes, folded onto one line.
///
/// Called when the field loses the focus and not on every key press: this writes
/// the configuration to disk.
#[tauri::command]
pub fn set_quick_reply_text(app: AppHandle, id: QuickReplyId, text: String) -> Snapshot {
    lock(&app).set_quick_reply_text(id, &text);

    runtime::emit_snapshot(&app)
}

/// Binds a combination to a quick reply, or clears it with `null`. Everything is laid
/// on the system again right after, exactly as [`set_shortcut`] does.
#[tauri::command]
pub fn set_quick_reply_shortcut(
    app: AppHandle,
    id: QuickReplyId,
    accelerator: Option<String>,
) -> Snapshot {
    lock(&app).set_quick_reply_shortcut(id, accelerator);

    shortcuts::apply(&app);

    runtime::emit_snapshot(&app)
}

/// Takes a quick reply away. No confirmation, like taking a character out.
#[tauri::command]
pub fn remove_quick_reply(app: AppHandle, id: QuickReplyId) -> Snapshot {
    lock(&app).remove_quick_reply(id);

    // Its combination has to come off the system, or it would keep firing at a
    // quick reply that is not there until the next launch.
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
    lock(&app).set_auto_focus_enabled(enabled, Surface::Window);

    runtime::emit_snapshot(&app)
}

/// Says whether a notification takes a window out of the Dock.
///
/// Only the AutoFocus reads this. A shortcut and a click in the system tray were
/// asked for by the user, so they bring the window back either way.
#[tauri::command]
pub fn set_wakes_minimized(app: AppHandle, wakes: bool) -> Snapshot {
    lock(&app).set_wakes_minimized(wakes, Surface::Window);

    runtime::emit_snapshot(&app)
}

/// Asks Multifus to start with the session, or to stop doing so.
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

/// Says whether a client that opens has its window filled to the screen. Only
/// the ones that open after this, the others not having been launched.
#[tauri::command]
pub fn set_maximize_on_launch(app: AppHandle, maximize: bool) -> Snapshot {
    lock(&app).set_maximize_on_launch(maximize);

    runtime::emit_snapshot(&app)
}

/// Says whether a game window's title is cut down to the bare nickname.
///
/// The windows are not renamed here: the write waits on the client's own message
/// pump, and a command runs on the main thread, where it would freeze the
/// window. The scan is rung instead, so the taskbar follows the click rather
/// than the interval.
#[tauri::command]
pub fn set_short_titles(app: AppHandle, short: bool) -> Snapshot {
    lock(&app).set_short_titles(short);

    runtime::wake();

    runtime::emit_snapshot(&app)
}

// -- The relay screen -----------------------------------------------------

/// Puts a character in or out of the relay. Kept indefinitely, ADR 0011.
#[tauri::command]
pub fn set_relayed(app: AppHandle, nickname: String, relayed: bool) -> Snapshot {
    lock(&app).set_relayed(&nickname, relayed);

    // Unticking the last one stops a running relay rather than leaving it armed
    // and mute, which is the state ADR 0011 declares does not exist.
    relay::run::stop_if_unready(&app, RelayStop::NoRelayedCharacter);

    runtime::emit_snapshot(&app)
}

/// Says whether the text of a private message goes out with it, ADR 0008.
#[tauri::command]
pub fn set_send_body(app: AppHandle, send_body: bool) -> Snapshot {
    lock(&app).set_send_body(send_body);

    runtime::emit_snapshot(&app)
}

/// Pairs the relay with a bot, from the token the user pasted.
///
/// Comes back with the pairing in flight and not with its answer: it is two
/// network round trips and a keychain that can raise a dialog. What it finds
/// arrives in a snapshot of its own, exactly as [`check_update`] does.
///
/// **The token goes in and never comes back.** No command returns one, and none
/// can: a read hands back a `BotToken`, which is not `Serialize`. See ADR 0009.
#[tauri::command]
pub fn pair_relay(app: AppHandle, token: String) -> Snapshot {
    relay::pairing::pair(&app, token);

    runtime::emit_snapshot(&app)
}

/// Moves the switch of the Relais screen, the twin of the tray item.
///
/// Comes back with the switching in flight: it reads the keychain, and ADR 0009
/// measured that blocking.
#[tauri::command]
pub fn set_relay_active(app: AppHandle, active: bool) -> Snapshot {
    relay::run::set_active(&app, active, Surface::Window);

    // Read and not emitted, unlike the commands above: `set_active` emits on
    // every path that moved something, and a second one rebuilds the tray menu
    // and pushes the same bytes twice.
    lock(&app).snapshot()
}

/// Sends one message to the telephone, on demand, to prove the chain works.
///
/// Comes back with the sending in flight, like [`pair_relay`]: with no relay
/// running it reads the keychain, and ADR 0009 measured that blocking.
#[tauri::command]
pub fn test_relay(app: AppHandle) -> Snapshot {
    relay::run::test(&app);

    // Read and not emitted, for the reason given on [`set_relay_active`].
    lock(&app).snapshot()
}

/// Forgets the bot: the token leaves the keychain, the chat leaves the file.
#[tauri::command]
pub fn unpair_relay(app: AppHandle) -> Snapshot {
    relay::pairing::unpair(&app);

    runtime::emit_snapshot(&app)
}

/// Opens one of the three Telegram pages the pairing sends the user to.
///
/// The interface names a destination and never an address, see
/// [`crate::app::relay::links`].
#[tauri::command]
pub fn open_relay_link(app: AppHandle, link: relay::RelayLink) {
    relay::links::open(&app, link);
}

// -- The about screen -----------------------------------------------------

/// Everything back to the defaults, roster included. The interface asks first.
#[tauri::command]
pub fn reset(app: AppHandle) -> Snapshot {
    lock(&app).reset();

    // The chat went with the rest of the file, so there is nowhere left to
    // write. The token stays in the keychain, which only unlinking erases.
    relay::run::stop_if_unready(&app, RelayStop::NoLongerPaired);

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

/// Downloads the update that was found and restarts Multifus on it.
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

/// Shows the journal file in the system's own file browser.
///
/// The other half of the export, next to the copy button that was already there.
/// The clipboard carries the entries the window holds, this carries the weeks: see
/// [`crate::app::journal_file`]. The same item sits in the menu of the system
/// tray, since a journal reachable only through the window is a journal reachable
/// only on the days nothing is wrong with the window.
#[tauri::command]
pub fn reveal_journal(app: AppHandle) {
    journal_file::reveal(&app);
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
