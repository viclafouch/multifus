use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::app::autostart;
use crate::app::banner;
use crate::app::journal::JournalEvent;
use crate::app::journal::RelayStop;
use crate::app::journal::Surface;
use crate::app::journal::WalkFrom;
use crate::app::journal_file;
use crate::app::relay;
use crate::app::rune_table;
use crate::app::runtime;
use crate::app::shortcuts;
use crate::app::state::lock;
use crate::app::update;
use crate::app::view::BannerStep;
use crate::app::view::ClientsView;
use crate::app::view::DisplayView;
use crate::app::view::ShortcutAction;
use crate::app::view::Snapshot;
use crate::app::view::WheelStep;
use crate::app::walk;
use crate::app::wheel;
use crate::config::BannerCorner;
use crate::config::QuickReplyId;
use crate::domain::Class;
use crate::domain::Gender;
use crate::domain::NotificationKind;

#[tauri::command]
pub fn snapshot(app: AppHandle) -> Snapshot {
    lock(&app).snapshot()
}

#[tauri::command]
pub fn request_authorization(app: AppHandle) -> Snapshot {
    runtime::request_authorization(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn open_authorization_settings(app: AppHandle) {
    runtime::open_authorization_settings(&app);
}

#[tauri::command]
pub fn set_gender(app: AppHandle, nickname: String, gender: Option<Gender>) -> Snapshot {
    lock(&app).set_gender(&nickname, gender);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_class(app: AppHandle, nickname: String, class: Option<Class>) -> Snapshot {
    lock(&app).set_class(&nickname, class);

    runtime::wake();

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn toggle_excluded(app: AppHandle, nickname: String) -> Snapshot {
    lock(&app).toggle_excluded(&nickname);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_main(app: AppHandle, nickname: String, main: bool) -> Snapshot {
    lock(&app).set_main(&nickname, main);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_gender_excluded(app: AppHandle, gender: Gender, excluded: bool) -> Snapshot {
    lock(&app).set_gender_excluded(gender, excluded);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn reorder(app: AppHandle, order: Vec<String>) -> Snapshot {
    lock(&app).reorder(&order);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn remove_character(app: AppHandle, nickname: String) -> Snapshot {
    lock(&app).remove(&nickname);

    shortcuts::apply(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_shortcut(
    app: AppHandle,
    action: ShortcutAction,
    accelerator: Option<String>,
) -> Snapshot {
    lock(&app).set_shortcut(action, accelerator);

    shortcuts::apply(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn suspend_shortcuts(app: AppHandle) -> Snapshot {
    shortcuts::suspend(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn resume_shortcuts(app: AppHandle) -> Snapshot {
    shortcuts::apply(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_character_shortcut(
    app: AppHandle,
    nickname: String,
    accelerator: Option<String>,
) -> Snapshot {
    lock(&app).set_character_shortcut(&nickname, accelerator);

    shortcuts::apply(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn reset_shortcuts(app: AppHandle) -> Snapshot {
    lock(&app).reset_shortcuts();

    shortcuts::apply(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn add_quick_reply(app: AppHandle) -> Snapshot {
    lock(&app).add_quick_reply();

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_quick_reply_text(app: AppHandle, id: QuickReplyId, text: String) -> Snapshot {
    lock(&app).set_quick_reply_text(id, &text);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_quick_reply_shortcut(
    app: AppHandle,
    id: QuickReplyId,
    accelerator: Option<String>,
) -> Snapshot {
    lock(&app).set_quick_reply_shortcut(id, accelerator);

    shortcuts::apply(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn remove_quick_reply(app: AppHandle, id: QuickReplyId) -> Snapshot {
    lock(&app).remove_quick_reply(id);

    shortcuts::apply(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_auto_focus(app: AppHandle, kind: NotificationKind, enabled: bool) -> Snapshot {
    lock(&app).set_auto_focus(kind, enabled);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_auto_focus_enabled(app: AppHandle, enabled: bool) -> Snapshot {
    lock(&app).set_auto_focus_enabled(enabled, Surface::Window);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_walk_enabled(app: AppHandle, enabled: bool) -> Snapshot {
    walk::set_enabled(&app, enabled, WalkFrom::Window);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_banner_corner(app: AppHandle, corner: BannerCorner) -> Snapshot {
    lock(&app).set_banner_corner(corner);

    banner::preview(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_banner_screen(app: AppHandle, screen: Option<String>) -> Snapshot {
    lock(&app).set_banner_screen(screen);

    banner::preview(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn banner_screens(app: AppHandle) -> Vec<DisplayView> {
    banner::screens(&app)
}

#[tauri::command]
pub fn banner_step(app: AppHandle) -> BannerStep {
    lock(&app).banner_step()
}

#[tauri::command]
pub fn set_wheel_diameter(app: AppHandle, diameter: u32) -> Snapshot {
    lock(&app).set_wheel_diameter(diameter);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn preview_wheel(app: AppHandle, crowd: usize) -> Snapshot {
    wheel::preview(&app, crowd);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn wheel_display(app: AppHandle) -> Option<DisplayView> {
    wheel::display(&app)
}

#[tauri::command]
pub fn wheel_step(app: AppHandle) -> Option<WheelStep> {
    wheel::step(&app)
}

#[tauri::command]
pub fn wheel_wiped(app: AppHandle, generation: u64) {
    wheel::wiped(&app, generation);
}

#[tauri::command(async)]
pub fn size_rune_table(app: AppHandle, width: u32) {
    rune_table::size(&app, width);
}

#[tauri::command(async)]
pub fn set_rune_table_width(app: AppHandle, width: u32) -> Snapshot {
    rune_table::size(&app, width);

    lock(&app).save();

    runtime::emit_snapshot(&app)
}

#[tauri::command(async)]
pub fn fade_rune_table(app: AppHandle, transparency: u32) {
    rune_table::fade(&app, transparency);
}

#[tauri::command(async)]
pub fn set_rune_table_transparency(app: AppHandle, transparency: u32) -> Snapshot {
    rune_table::fade(&app, transparency);

    lock(&app).save();

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn rune_table_look(app: AppHandle) -> f64 {
    rune_table::look(&app)
}

#[tauri::command(async)]
pub fn set_rune_table_everywhere(app: AppHandle, everywhere: bool) -> Snapshot {
    {
        let mut state = lock(&app);

        state.set_rune_table_everywhere(everywhere);
        state.save();
    }

    rune_table::spread(&app, everywhere);

    runtime::emit_snapshot(&app)
}

#[tauri::command(async)]
pub fn preview_rune_table(app: AppHandle) -> Snapshot {
    rune_table::preview(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command(async)]
pub fn close_rune_table(app: AppHandle) -> Snapshot {
    rune_table::close(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn move_rune_table(app: AppHandle, by_x: f64, by_y: f64) {
    rune_table::shift(&app, by_x, by_y);
}

#[tauri::command]
pub fn rune_table_settled(app: AppHandle) {
    rune_table::settled(&app);
}

#[tauri::command(async)]
pub fn recall_rune_table(app: AppHandle) -> Snapshot {
    rune_table::recall(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command(async)]
pub fn rune_table_measured(app: AppHandle, ratio: f64) {
    rune_table::measured(&app, ratio);
}

#[tauri::command]
pub fn set_wakes_minimized(app: AppHandle, wakes: bool) -> Snapshot {
    lock(&app).set_wakes_minimized(wakes, Surface::Window);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_start_at_login(app: AppHandle, start_at_login: bool) -> Snapshot {
    lock(&app).set_start_at_login(start_at_login);

    autostart::reconcile(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_maximize_on_launch(app: AppHandle, maximize: bool) -> Snapshot {
    lock(&app).set_maximize_on_launch(maximize);

    runtime::emit_snapshot(&app)
}

#[tauri::command(async)]
pub fn maximize_all_clients(app: AppHandle) -> Snapshot {
    runtime::maximize_all(&app, Surface::Window);

    runtime::emit_snapshot(&app)
}

#[tauri::command(async)]
pub fn clients(app: AppHandle) -> ClientsView {
    runtime::clients(&app)
}

#[tauri::command]
pub fn watch_clients(app: AppHandle, watching: bool) {
    runtime::watch_clients(&app, watching);
}

#[tauri::command]
pub fn set_short_titles(app: AppHandle, short: bool) -> Snapshot {
    lock(&app).set_short_titles(short);

    runtime::wake();

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_paint_portraits(app: AppHandle, paint: bool) -> Snapshot {
    lock(&app).set_paint_portraits(paint);

    runtime::wake();

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_ungroup_taskbar(app: AppHandle, ungroup: bool) -> Snapshot {
    lock(&app).set_ungroup_taskbar(ungroup);

    runtime::wake();

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_relayed(app: AppHandle, nickname: String, relayed: bool) -> Snapshot {
    lock(&app).set_relayed(&nickname, relayed);

    relay::run::stop_if_unready(&app, RelayStop::NoRelayedCharacter);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_send_body(app: AppHandle, send_body: bool) -> Snapshot {
    lock(&app).set_send_body(send_body);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn pair_relay(app: AppHandle, token: String) -> Snapshot {
    relay::pairing::pair(&app, token);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_relay_active(app: AppHandle, active: bool) -> Snapshot {
    relay::run::set_active(&app, active, Surface::Window);

    lock(&app).snapshot()
}

#[tauri::command]
pub fn test_relay(app: AppHandle) -> Snapshot {
    relay::run::test(&app);

    lock(&app).snapshot()
}

#[tauri::command]
pub fn unpair_relay(app: AppHandle) -> Snapshot {
    relay::pairing::unpair(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn open_relay_link(app: AppHandle, link: relay::RelayLink) {
    relay::links::open(&app, link);
}

#[tauri::command]
pub fn reset(app: AppHandle) -> Snapshot {
    lock(&app).reset();

    relay::pairing::forget_bot(&app);

    relay::run::stop_if_unready(&app, RelayStop::NoLongerPaired);

    shortcuts::apply(&app);

    autostart::reconcile(&app);

    runtime::refresh(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn check_update(app: AppHandle) -> Snapshot {
    update::check(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn install_update(app: AppHandle) -> Snapshot {
    update::install(&app);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn dismiss_config_problem(app: AppHandle) -> Snapshot {
    lock(&app).dismiss_problem();

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn reveal_journal(app: AppHandle) {
    journal_file::reveal(&app);
}

#[tauri::command]
pub fn reveal_quarantined_config(app: AppHandle) {
    let Some(path) = lock(&app).quarantined_path().map(str::to_owned) else {
        return;
    };

    if let Err(error) = app.opener().reveal_item_in_dir(path) {
        lock(&app).log(JournalEvent::OpenFailed {
            detail: error.to_string(),
        });

        runtime::emit_snapshot(&app);
    }
}
