use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::app::autostart;
use crate::app::journal::JournalEvent;
use crate::app::journal::RelayStop;
use crate::app::journal::Surface;
use crate::app::journal::WalkFrom;
use crate::app::journal_file;
use crate::app::relay;
use crate::app::runtime;
use crate::app::shortcuts;
use crate::app::state::lock;
use crate::app::update;
use crate::app::view::ShortcutAction;
use crate::app::view::Snapshot;
use crate::app::walk;
use crate::config::QuickReplyId;
use crate::domain::Class;
use crate::domain::Gender;
use crate::domain::NotificationKind;

#[tauri::command]
pub fn snapshot(app: AppHandle) -> Snapshot {
    lock(&app).snapshot()
}

#[tauri::command]
pub fn refresh(app: AppHandle) -> Snapshot {
    runtime::refresh(&app);

    runtime::emit_snapshot(&app)
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
pub fn toggle_asleep(app: AppHandle, nickname: String) -> Snapshot {
    lock(&app).toggle_asleep(&nickname);

    runtime::emit_snapshot(&app)
}

#[tauri::command]
pub fn set_gender_asleep(app: AppHandle, gender: Gender, asleep: bool) -> Snapshot {
    lock(&app).set_gender_asleep(gender, asleep);

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

#[tauri::command]
pub fn set_short_titles(app: AppHandle, short: bool) -> Snapshot {
    lock(&app).set_short_titles(short);

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
