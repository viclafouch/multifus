//! Starting with the session, and the reconciliation that keeps it honest.
//!
//! `tauri-plugin-autostart` registers a **path**, not an application. On macOS
//! it writes `~/Library/LaunchAgents/<name>.plist` holding the absolute path of
//! the binary inside the bundle; move the application, rename it, and `launchd`
//! finds nothing at the next session and says nothing about it. Worse, the
//! plugin's `is_enabled` only checks that the plist file exists: it never
//! compares the path it holds with the one running. Asked whether multifus
//! starts with the session, it would answer yes on a registration that has been
//! pointing at a hole for weeks.
//!
//! So the system is not the source of truth here, the configuration is.
//! [`Settings::start_at_login`](crate::config::Settings) carries what the user
//! asked for, and [`reconcile`] makes the system match it at every launch. A
//! wanted registration is therefore rewritten each time multifus starts, which
//! costs one file write and means an application that was moved repairs itself
//! the first time it is opened by hand.
//!
//! That also covers macOS 13 and later, where the user can switch the entry off
//! from Réglages Système, Général, Ouverture. The plist stays, `is_enabled` keeps
//! saying yes, and only the switch inside multifus is worth believing.
//!
//! `MacosLauncher::LaunchAgent` rather than `AppleScript`: the second drives
//! System Events through osascript, which asks for an Automation authorization
//! of its own. multifus already lives on one authorization the user has to grant
//! by hand, and a second one to tick a checkbox is not a trade worth making.

use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;

use crate::app::journal::JournalEvent;
use crate::app::state::lock;

/// Makes the system match what the configuration asks for.
///
/// Called at startup and again every time the switch moves. A failure costs the
/// registration and nothing else: multifus runs, the journal says what the
/// system refused, and the switch on screen keeps showing the intent rather than
/// silently flipping back.
///
/// The lock is taken to read the intent and given back before the plugin is
/// touched, which writes a file and reads a directory.
pub fn reconcile(app: &AppHandle) {
    let wanted = lock(app).starts_at_login();
    let manager = app.autolaunch();

    // Enabling an already enabled registration is what rewrites the path, so it
    // is done unconditionally rather than only on a change.
    let outcome = if wanted {
        manager.enable()
    } else {
        manager.disable()
    };

    if let Err(error) = outcome {
        lock(app).log(JournalEvent::StartAtLoginFailed {
            detail: error.to_string(),
        });
    }
}
