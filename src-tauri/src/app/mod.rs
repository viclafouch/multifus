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
//! The interface language lives on the React side. Nothing here writes a
//! sentence for the user: the journal carries structured events, see
//! [`journal::JournalEvent`], and the French is written once, in the strings file
//! of the interface.
//!
//! [`tray`] is the one exception, and it says so at its top. A menu of the system
//! is a surface React cannot draw at all, so its words are built here or nowhere.

pub mod autostart;
pub mod commands;
pub mod journal;
pub mod journal_file;
pub mod main_window;
pub mod quick_replies;
pub mod relay;
pub mod runtime;
pub mod shortcuts;
pub mod state;
pub mod tray;
pub mod update;
pub mod view;

use std::sync::Mutex;

use tauri::AppHandle;
use tauri::Manager;

use crate::app::view::ScreenSaverView;
use crate::config::ConfigError;
use crate::config::ConfigStore;
use crate::platform::DisplayKeeper;
use crate::platform::PlatformDisplayKeeper;
use crate::platform::PlatformNotificationWatcher;
use crate::platform::PlatformPasteSender;
use crate::platform::PlatformWindowManager;

pub use state::AppState;
pub use state::Multifus;
pub use state::MultifusParams;
pub use state::WatcherState;
pub use view::Snapshot;

/// Loads the configuration and puts everything Multifus needs in the Tauri state.
///
/// A configuration that could not be read is no reason to refuse to start:
/// [`ConfigStore::load`] always comes back with a usable one and says what it
/// cost, and that reason travels to the interface inside the snapshot. Only the
/// system having no configuration directory at all stops Multifus here, since
/// there would then be nowhere to ever write.
pub fn setup(app: &AppHandle) -> Result<(), ConfigError> {
    install_crypto_provider();

    let store = ConfigStore::for_app(app)?;
    let loaded = store.load();
    let keeper = PlatformDisplayKeeper::new();

    // The first line of the journal is written by this constructor, so everything
    // that line has to carry is gathered before anything else runs.
    app.manage::<AppState>(Mutex::new(Multifus::new(MultifusParams {
        store,
        loaded,
        version: app.package_info().version.to_string(),
        system: system(),
        launch: main_window::launch(),
        screen_saver: screen_saver(&keeper),
    })));
    app.manage(PlatformWindowManager::new());
    app.manage(PlatformPasteSender::new());
    app.manage::<WatcherState>(Mutex::new(PlatformNotificationWatcher::new()));

    relay::run::setup(app, keeper);

    // The queue exists before any combination is laid down, so that a shortcut
    // fired in the same breath as the registration has somewhere to go.
    shortcuts::start(app);
    shortcuts::apply(app);

    // The icon goes up before the scan does, so that the first roster it reports
    // finds a menu to fill instead of building one a moment later.
    tray::setup(app);

    // What the file asks for is pushed onto the system at every launch, which is
    // also what repairs a registration left pointing at a moved application.
    autostart::reconcile(app);

    // After the icon, since the answer comes back through a snapshot and the
    // menu is one of the two surfaces that draw it.
    update::setup(app);

    runtime::start(app.clone());

    // Last, and after the icon, which is one of the two things it asks about.
    main_window::show_on_launch(app);

    Ok(())
}

/// Lays down the cryptographic provider every HTTPS call stands on. Nobody else
/// does before the updater's first check, and a relay sent before that fails.
fn install_crypto_provider() {
    drop(rustls::crypto::ring::default_provider().install_default());
}

/// What the screen saver of this machine is set to, asked once here rather than
/// at each activation. See `docs/macos.md`.
fn screen_saver(keeper: &PlatformDisplayKeeper) -> ScreenSaverView {
    keeper
        .screen_saver_delay()
        .map_or(ScreenSaverView::Unknown, ScreenSaverView::from)
}

/// The system Multifus is running on, for the head of the journal.
///
/// The version matters more than the name here: the macOS banner tree ADR 0002
/// stands on belongs to an operating system version, so « the AutoFocus stopped
/// after an update » is a sentence this string either supports or does not. The
/// architecture comes along because the release is Apple Silicon only for now.
///
/// Neither the hostname nor the locale, which `tauri-plugin-os` would also give:
/// this ends up in a file meant to be handed over, and neither of them helps read
/// it.
fn system() -> String {
    format!(
        "{} {} {}",
        tauri_plugin_os::platform(),
        tauri_plugin_os::version(),
        tauri_plugin_os::arch()
    )
}
