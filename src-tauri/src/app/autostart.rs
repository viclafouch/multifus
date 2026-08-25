use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;

use crate::app::journal::JournalEvent;
use crate::app::state::lock;

pub fn reconcile(app: &AppHandle) {
    let wanted = lock(app).starts_at_login();
    let manager = app.autolaunch();

    let outcome = if wanted {
        manager.enable()
    // Removing nothing fails on Windows, at every launch of a fresh install.
    } else if matches!(manager.is_enabled(), Ok(false)) {
        Ok(())
    } else {
        manager.disable()
    };

    let mut state = lock(app);

    match outcome {
        Ok(()) => {
            state.log_unless_repeated(JournalEvent::StartAtLoginReconciled { enabled: wanted });
        }
        Err(error) => {
            state.log(JournalEvent::StartAtLoginFailed {
                detail: error.to_string(),
            });
        }
    }
}
