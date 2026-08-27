pub mod app;
pub mod config;
pub mod domain;
pub mod platform;
#[cfg(test)]
pub mod test_doubles;

use tauri_plugin_autostart::MacosLauncher;

use crate::app::main_window;

pub fn run() {
    tauri::Builder::default()
        .plugin(app::journal_file::plugin())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![main_window::FROM_SESSION_ARG]),
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|tauri_app| {
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
            app::commands::set_class,
            app::commands::toggle_excluded,
            app::commands::set_gender_excluded,
            app::commands::reorder,
            app::commands::remove_character,
            app::commands::set_shortcut,
            app::commands::reset_shortcuts,
            app::commands::add_quick_reply,
            app::commands::set_quick_reply_text,
            app::commands::set_quick_reply_shortcut,
            app::commands::remove_quick_reply,
            app::commands::set_auto_focus,
            app::commands::set_auto_focus_enabled,
            app::commands::set_wakes_minimized,
            app::commands::set_walk_enabled,
            app::commands::set_banner_corner,
            app::commands::set_banner_screen,
            app::commands::banner_screens,
            app::commands::banner_step,
            app::commands::set_start_at_login,
            app::commands::set_maximize_on_launch,
            app::commands::set_short_titles,
            app::commands::set_paint_portraits,
            app::commands::set_ungroup_taskbar,
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
        .expect("error while building Multifus")
        .run(app::runtime::on_run_event);
}
