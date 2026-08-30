pub mod autostart;
pub mod banner;
pub mod clicks;
pub mod commands;
pub mod journal;
pub mod journal_file;
pub mod main_window;
pub mod overlay;
pub mod portraits;
pub mod quick_replies;
pub mod relay;
pub mod rune_table;
pub mod runtime;
pub mod shortcuts;
pub mod state;
pub mod tray;
pub mod update;
pub mod view;
pub mod walk;
pub mod wheel;

use std::sync::Arc;
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
use crate::platform::key_labels;

pub use state::AppState;
pub use state::Multifus;
pub use state::MultifusParams;
pub use state::PasteState;
pub use state::WatcherState;
pub use state::WindowState;
pub use view::Snapshot;

pub fn setup(app: &AppHandle) -> Result<(), ConfigError> {
    install_crypto_provider();

    let store = ConfigStore::for_app(app)?;
    let loaded = store.load();
    let keeper = PlatformDisplayKeeper::new();
    let windows: WindowState = Arc::new(PlatformWindowManager::new(
        loaded.settings.traces.short_titles,
    ));

    app.manage::<AppState>(Mutex::new(Multifus::new(MultifusParams {
        store,
        loaded,
        version: app.package_info().version.to_string(),
        system: system(),
        keyboard: key_labels(),
        launch: main_window::launch(),
        screen_saver: screen_saver(&keeper),
        taskbar_combines: windows.taskbar_combines().unwrap_or(true),
    })));
    let _ = windows.unlock_foreground();

    app.manage::<WindowState>(windows);
    app.manage::<PasteState>(Arc::new(PlatformPasteSender::new()));
    app.manage::<WatcherState>(Mutex::new(PlatformNotificationWatcher::new()));

    relay::run::setup(app, keeper);

    banner::setup(app);

    walk::setup(app);

    wheel::setup(app);

    rune_table::setup(app);

    shortcuts::start(app);
    shortcuts::apply(app);

    tray::setup(app);

    autostart::reconcile(app);

    update::setup(app);

    runtime::start(app.clone());

    main_window::show_on_launch(app);

    Ok(())
}

fn install_crypto_provider() {
    drop(rustls::crypto::ring::default_provider().install_default());
}

fn screen_saver(keeper: &PlatformDisplayKeeper) -> ScreenSaverView {
    keeper
        .screen_saver_delay()
        .map_or(ScreenSaverView::Unknown, ScreenSaverView::from)
}

fn system() -> String {
    format!(
        "{} {} {}",
        tauri_plugin_os::platform(),
        tauri_plugin_os::version(),
        tauri_plugin_os::arch()
    )
}
