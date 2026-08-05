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

use tauri::Manager;
use tauri::Window;
use tauri::WindowEvent;
use tauri::Wry;
use tauri_plugin_autostart::MacosLauncher;

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
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        // No shortcut is declared here and no handler either: which combinations
        // to lay down is read from the configuration, and each one carries its
        // own handler so that a key press already knows which action it is. See
        // `app::shortcuts`.
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // No argument is passed to the started process: multifus reads its
        // configuration and shows its window the same way whether it was opened
        // by hand or by the session. See `app::autostart` for the launcher.
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|tauri_app| {
            // The one failure that stops multifus here: no configuration
            // directory at all means there is nowhere to ever write. Everything
            // else a load can hit comes back inside the snapshot instead, so
            // that the user reads why their roster is empty rather than
            // wondering.
            app::setup(tauri_app.handle())?;

            Ok(())
        })
        .on_window_event(hide_rather_than_quit)
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
            app::commands::set_start_at_login,
            app::commands::reset,
            app::commands::dismiss_config_problem,
            app::commands::reveal_quarantined_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running multifus");
}

/// Closing the window puts it away instead of ending multifus.
///
/// The whole point of step 8: the window is a board one consults, and the
/// application goes on watching the roster and answering the shortcuts without
/// it. Quitting is the system tray's job.
///
/// **Unless there is no system tray icon.** If putting it up failed, hiding the
/// window here would leave a running process with no window, no menu and no way
/// back. In that case the close is let through and multifus ends, which is the
/// worse of two behaviours and by far the better of two failures.
fn hide_rather_than_quit(window: &Window<Wry>, event: &WindowEvent) {
    let WindowEvent::CloseRequested { api, .. } = event else {
        return;
    };

    if !app::tray::is_present(window.app_handle()) {
        return;
    }

    api.prevent_close();

    drop(window.hide());
}
