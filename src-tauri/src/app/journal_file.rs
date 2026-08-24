//! Where the journal lives on disk, how much of it is kept, and how it is shown.
//!
//! [`crate::app::journal`] owns the events, this module owns the file. The split
//! is what keeps the journal free of any dependency on Tauri or on a logging
//! crate: it hands an entry to [`append`] and knows nothing more.
//!
//! **The retention is the whole reason this module exists.** The journal used to
//! be two hundred entries in memory that died with the process, which is a few
//! minutes of active play: a défilement between two characters writes one line
//! per key press. Multifus is launched and forgotten, so the question it answers
//! is asked hours later, or the next morning. See ADR 0006.
//!
//! **Nothing is written by anybody but Multifus.** The logging plugin exposes a
//! command to the webview, and the capability deliberately does not grant it: the
//! journal is Multifus's own account of what it did, and a channel React could
//! write into would make it something else. The filter below is the second half
//! of that: only lines this module produces reach the file, so a chatty
//! dependency cannot bury the one thing being looked for.
//!
//! The location is the plugin's `LogDir`, which is the convention of each system
//! and not a choice made here:
//!
//! | System  | Where                                          |
//! | ------- | ---------------------------------------------- |
//! | macOS   | `~/Library/Logs/com.viclafouch.multifus`        |
//! | Windows | `%LOCALAPPDATA%\com.viclafouch.multifus\logs`   |
//!
//! On macOS that is the one folder a user is told to look in when somebody asks
//! them for logs, and Console.app reads it. On Windows it is `LocalAppData` and
//! not `Roaming`, which is right: a journal describes what happened on one
//! machine and has no business following a profile onto another.

use std::path::PathBuf;

use tauri::plugin::TauriPlugin;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Runtime;
use tauri_plugin_log::RotationStrategy;
use tauri_plugin_log::Target;
use tauri_plugin_log::TargetKind;
use tauri_plugin_log::TimezoneStrategy;
use tauri_plugin_opener::OpenerExt;

use crate::app::journal::JournalEntry;
use crate::app::journal::JournalEvent;
use crate::app::state::lock;

/// The `log` target every entry is written under.
///
/// It is also what the file shows between brackets before the event, and what
/// the filter keys on, so that nothing but the journal ever lands in there.
const TARGET: &str = "journal";

/// The name of the file, without the extension the plugin adds.
///
/// [`path`] derives the whole name from it rather than spelling it out a second
/// time: two constants for one name means renaming one of them leaves [`reveal`]
/// pointing at a file that does not exist.
const FILE_NAME: &str = "journal";

/// What the plugin appends to [`FILE_NAME`], read from its rotation code.
const FILE_EXTENSION: &str = "log";

/// How large the current file grows before it is rotated.
///
/// One entry is on the order of a hundred and fifty bytes, so this is roughly
/// seven thousand of them: several days of ordinary play, and more than one
/// evening of heavy défilement.
const MAX_FILE_SIZE: u128 = 1_000_000;

/// How many rotated files are kept beside the current one.
///
/// Eight of them and the current one is a nine megabyte ceiling, which buys the
/// several weeks this was written for while staying a number one can defend to
/// somebody looking at their disk. Rotation goes by size and not by date, so
/// « weeks » is a consequence of how much is played and not a promise; what is
/// promised is the ceiling.
const KEPT_FILES: usize = 8;

/// The logging plugin, configured for one job and one writer.
pub fn plugin<R: Runtime>() -> TauriPlugin<R> {
    let builder = tauri_plugin_log::Builder::new()
        .clear_targets()
        .target(Target::new(TargetKind::LogDir {
            file_name: Some(FILE_NAME.to_owned()),
        }))
        // Only what [`append`] writes. Tauri, the updater and the HTTP stack all
        // speak through the same facade, and a journal buried under their
        // handshakes is a journal nobody reads to the end.
        .filter(|metadata| metadata.target() == TARGET)
        .rotation_strategy(RotationStrategy::KeepSome(KEPT_FILES))
        .max_file_size(MAX_FILE_SIZE)
        // The same clock the window formats its lines with, so that an hour read
        // in the drawer and an hour read in the file are the same hour. It also
        // settles the format, which is why none is set here.
        .timezone_strategy(TimezoneStrategy::UseLocal);

    // In development the terminal is where this is read, and `tauri dev` is the
    // one context where the file is the less convenient of the two.
    #[cfg(debug_assertions)]
    let builder = builder.target(Target::new(TargetKind::Stdout));

    builder.build()
}

/// Writes one entry to the file.
///
/// Every entry, and only through here. One level for all of them and never a
/// severity: how serious an event is, is a reading the interface does from the
/// event itself, and a second severity table on this side would be a second
/// source of truth for it. The cost is `[INFO]` on every line of the file, which
/// is noise and is worth less than that duplication.
///
/// A journal built by a test, or one running before the plugin is installed,
/// writes nowhere and says nothing about it. That is what the `log` facade does
/// with no logger behind it, and it is the right answer: a journal is not worth
/// failing a launch over.
pub fn append(entry: &JournalEntry) {
    match serde_json::to_string(entry) {
        Ok(line) => log::info!(target: TARGET, "{line}"),
        // The event types are plain data and cannot fail to serialise, so this
        // is unreachable rather than unlikely. It still says so rather than
        // dropping the line, since a journal that quietly skips entries is worse
        // than one that admits it skipped one.
        Err(error) => {
            log::info!(target: TARGET, r#"{{"id":{},"unwritable":"{error}"}}"#, entry.id);
        }
    }
}

/// Shows the journal in the system's own file browser.
///
/// The export, and the reason the copy button was not enough on its own: a
/// transcript on the clipboard is the two hundred entries the window holds,
/// while the file is the weeks. Both are offered, because they answer at two
/// different distances from the failure.
///
/// Reachable from the menu of the system tray as well as from the window, and
/// that is not a convenience. The day this is wanted is a day something is
/// wrong, and [`JournalEvent::WindowFailed`] is one of the things that can be
/// wrong: a journal reachable only from a window that will not come back is a
/// journal reachable on the good days alone.
pub fn reveal(app: &AppHandle) {
    let revealed = path(app).and_then(|path| {
        app.opener()
            .reveal_item_in_dir(path)
            .map_err(|error| error.to_string())
    });

    if let Err(detail) = revealed {
        lock(app).log(JournalEvent::OpenFailed { detail });
    }
}

/// Where the current file is, or why it could not be named.
///
/// Rotated files sit beside it, carrying a date, and revealing the current one
/// puts the whole folder on screen anyway.
fn path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_log_dir()
        .map(|directory| directory.join(FILE_NAME).with_extension(FILE_EXTENSION))
        .map_err(|error| error.to_string())
}
