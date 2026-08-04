//! Where the three other modules are wired together and handed to the interface.
//!
//! [`crate::domain`] is pure, [`crate::platform`] is the boundary with the
//! system, [`crate::config`] is the file. None of the three knows the others'
//! callers. This module is the one that does: it loads the configuration at
//! startup, keeps it in the Tauri state, writes it back whenever it changes,
//! watches the game windows, turns a game notification into a focus, and hands
//! React a single snapshot of all of it.
//!
//! No business logic lives here. Deciding who comes next in the cycle, what kind
//! a notification is, whether a character is in the cycle at all, that is
//! `domain`'s and it stays there.
//!
//! The interface language lives on the React side. This module therefore never
//! writes a sentence for the user: the journal carries structured events, see
//! [`journal::JournalEvent`], and the French is written once, in the strings file
//! of the interface.

pub mod commands;
pub mod journal;
pub mod runtime;
pub mod state;
pub mod view;

use std::sync::Mutex;

use tauri::AppHandle;
use tauri::Manager;

use crate::config::ConfigError;
use crate::config::ConfigStore;
use crate::platform::PlatformNotificationWatcher;
use crate::platform::PlatformWindowManager;

pub use state::AppState;
pub use state::Multifus;
pub use state::WatcherState;
pub use view::Snapshot;

/// Loads the configuration and puts everything multifus needs in the Tauri state.
///
/// A configuration that could not be read is no reason to refuse to start:
/// [`ConfigStore::load`] always comes back with a usable one and says what it
/// cost, and that reason travels to the interface inside the snapshot. Only the
/// system having no configuration directory at all stops multifus here, since
/// there would then be nowhere to ever write.
pub fn setup(app: &AppHandle) -> Result<(), ConfigError> {
    let store = ConfigStore::for_app(app)?;
    let loaded = store.load();
    let version = app.package_info().version.to_string();

    app.manage::<AppState>(Mutex::new(Multifus::new(store, version, loaded)));
    app.manage(PlatformWindowManager::new());
    app.manage::<WatcherState>(Mutex::new(PlatformNotificationWatcher::new()));

    runtime::start(app.clone());

    Ok(())
}
