//! multifus: a multi-account window manager for Dofus Retro.
//!
//! Four modules, and the dependency runs one way through them. [`domain`] is the
//! business core and is pure: no system call, no Tauri, no file. [`platform`] is
//! the boundary with the operating system, windows and notifications, one
//! implementation per system. [`config`] is the file that survives a restart.
//! [`app`] is where the three meet Tauri, and it is the only one that knows the
//! interface exists.

pub mod app;
pub mod config;
pub mod domain;
pub mod platform;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        // No shortcut is declared here and no handler either: which combinations
        // to lay down is read from the configuration, and each one carries its
        // own handler so that a key press already knows which action it is. See
        // `app::shortcuts`.
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|tauri_app| {
            // The one failure that stops multifus here: no configuration
            // directory at all means there is nowhere to ever write. Everything
            // else a load can hit comes back inside the snapshot instead, so
            // that the user reads why their roster is empty rather than
            // wondering.
            app::setup(tauri_app.handle())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app::commands::snapshot,
            app::commands::refresh,
            app::commands::request_authorization,
            app::commands::open_authorization_settings,
            app::commands::set_gender,
            app::commands::toggle_asleep,
            app::commands::set_gender_asleep,
            app::commands::reorder,
            app::commands::remove_character,
            app::commands::set_shortcut,
            app::commands::set_auto_focus,
            app::commands::reset,
            app::commands::dismiss_config_problem,
            app::commands::reveal_quarantined_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
