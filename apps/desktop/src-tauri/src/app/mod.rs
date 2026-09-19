pub mod autostart;
pub mod banner;
pub mod clicks;
pub mod commands;
pub mod journal;
pub mod journal_file;
pub mod links;
pub mod main_window;
pub mod overlay;
pub mod panics;
pub mod portraits;
pub mod quick_texts;
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
use crate::config::Language;
use crate::platform::DisplayKeeper;
use crate::platform::PlatformDisplayKeeper;
use crate::platform::PlatformNotificationWatcher;
use crate::platform::PlatformPasteSender;
use crate::platform::PlatformWindowManager;
use crate::platform::key_labels;
use crate::platform::matches_windows_eleven;

pub use state::AppState;
pub use state::Multifus;
pub use state::MultifusParams;
pub use state::PasteState;
pub use state::WatcherState;
pub use state::WindowState;
pub use view::Snapshot;

pub fn setup(app: &AppHandle) -> Result<(), ConfigError> {
    panics::watch(app);

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
        system_language: Language::of_system(),
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

    main_window::hold_until_ready(app);

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

struct SystemNameParams<'a> {
    platform: &'a str,
    version: &'a str,
    arch: &'a str,
    is_windows_eleven: bool,
}

fn system() -> String {
    named_system(SystemNameParams {
        platform: tauri_plugin_os::platform(),
        version: &tauri_plugin_os::version().to_string(),
        arch: tauri_plugin_os::arch(),
        is_windows_eleven: matches_windows_eleven(),
    })
}

fn named_system(params: SystemNameParams<'_>) -> String {
    let SystemNameParams {
        platform,
        version,
        arch,
        is_windows_eleven,
    } = params;

    let arch = match arch {
        "aarch64" => "arm64",
        "x86_64" => "x64",
        other => other,
    };

    match platform {
        "macos" => format!("macOS {version} ({arch})"),
        "windows" => format!("{} ({arch})", named_windows(version, is_windows_eleven)),
        other => format!("{other} {version} ({arch})"),
    }
}

fn named_windows(version: &str, is_windows_eleven: bool) -> String {
    let name = if is_windows_eleven {
        "Windows 11"
    } else {
        "Windows 10"
    };

    match version.split('.').nth(2) {
        Some(build) => format!("{name} {build}"),
        None => format!("{name} {version}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_mac_is_named_the_way_apple_writes_it() {
        assert_eq!(
            named_system(SystemNameParams {
                platform: "macos",
                version: "26.0.0",
                arch: "aarch64",
                is_windows_eleven: false,
            }),
            "macOS 26.0.0 (arm64)"
        );
    }

    #[test]
    fn windows_eleven_is_named_by_its_marketing_name_and_its_build() {
        assert_eq!(
            named_system(SystemNameParams {
                platform: "windows",
                version: "10.0.26100",
                arch: "x86_64",
                is_windows_eleven: true,
            }),
            "Windows 11 26100 (x64)",
            "every Windows 11 still answers 10.0 when asked its version"
        );
    }

    #[test]
    fn windows_ten_keeps_its_own_name_and_the_architecture_its_installers_use() {
        assert_eq!(
            named_system(SystemNameParams {
                platform: "windows",
                version: "10.0.19045",
                arch: "x86_64",
                is_windows_eleven: false,
            }),
            "Windows 10 19045 (x64)"
        );
    }

    #[test]
    fn a_windows_that_does_not_say_its_build_is_written_as_the_system_gives_it() {
        assert_eq!(
            named_system(SystemNameParams {
                platform: "windows",
                version: "10.0",
                arch: "x86_64",
                is_windows_eleven: true,
            }),
            "Windows 11 10.0 (x64)"
        );
    }

    #[test]
    fn a_platform_we_do_not_know_is_written_as_the_system_gives_it() {
        assert_eq!(
            named_system(SystemNameParams {
                platform: "linux",
                version: "6.12",
                arch: "riscv64",
                is_windows_eleven: false,
            }),
            "linux 6.12 (riscv64)"
        );
    }
}
