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

use tauri_plugin_autostart::MacosLauncher;

use crate::app::main_window;

/// Builds multifus and hands it to the event loop.
///
/// No mobile entry point: this application targets macOS and Windows and
/// nothing else, see perimetre.md.
///
/// Nothing intercepts the exit. The window is never destroyed, only hidden, so
/// the « last window closed » exit this application would have to prevent never
/// happens; and preventing it anyway would take `Cmd+Q` away from a macOS user
/// for no gain. What ends multifus is the Quit item of the system tray, or the
/// system's own quit, and both are meant to.
///
/// The run loop is given a callback, which is why this builds and runs in two
/// steps rather than calling `run` on the builder. The one event it answers is
/// the Dock icon being clicked, see [`main_window::show_on_dock_click`].
pub fn run() {
    tauri::Builder::default()
        // First, so that everything the setup below writes is already on disk.
        // Nothing of it is exposed to the webview: the capability grants no
        // `log:` permission, because the journal is multifus's own account of
        // what it did and not a channel React can write into. See
        // `app::journal_file`.
        .plugin(app::journal_file::plugin())
        // Read from Rust only, for the one line of the journal that says which
        // operating system this was. No permission granted either.
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        // No shortcut is declared here and no handler either: which combinations
        // to lay down is read from the configuration, and each one carries its
        // own handler so that a key press already knows which action it is. See
        // `app::shortcuts`.
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // The one argument multifus is ever started with, and the only thing
        // that tells a session start apart from a launch by hand. What each of
        // the two shows is `app::main_window`'s to say; the launcher that
        // carries the argument is `app::autostart`.
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![main_window::FROM_SESSION_ARG]),
        ))
        // Nothing of the updater is exposed to the webview: the check and the
        // install are commands of multifus, so the window and the system tray
        // read the one state that travels in the snapshot. See `app::update`.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|tauri_app| {
            // The one failure that stops multifus here: no configuration
            // directory at all means there is nowhere to ever write. Everything
            // else a load can hit comes back inside the snapshot instead, so
            // that the user reads why their roster is empty rather than
            // wondering.
            app::setup(tauri_app.handle())?;

            Ok(())
        })
        .on_window_event(main_window::hide_rather_than_quit)
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
            app::commands::set_auto_focus_enabled,
            app::commands::set_wakes_minimized,
            app::commands::set_start_at_login,
            app::commands::set_relayed,
            app::commands::set_send_body,
            app::commands::pair_relay,
            app::commands::set_relay_active,
            app::commands::test_relay,
            app::commands::unpair_relay,
            app::commands::open_relay_link,
            app::commands::reset,
            app::commands::check_update,
            app::commands::install_update,
            app::commands::dismiss_config_problem,
            app::commands::reveal_journal,
            app::commands::reveal_quarantined_config,
        ])
        .build(tauri::generate_context!())
        .expect("error while building multifus")
        .run(main_window::show_on_dock_click);
}
