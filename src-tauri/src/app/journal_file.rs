use std::path::PathBuf;

use tauri::plugin::TauriPlugin;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Runtime;
use tauri_plugin_log::RotationStrategy;
use tauri_plugin_log::Target;
use tauri_plugin_log::TargetKind;
use tauri_plugin_log::TimezoneStrategy;
use tauri_plugin_opener::OpenerExt;

use crate::app::journal::JournalEntry;
use crate::app::journal::JournalEvent;
use crate::app::state::lock;

const TARGET: &str = "journal";

const FILE_NAME: &str = "journal";

const FILE_EXTENSION: &str = "log";

const MAX_FILE_SIZE: u128 = 1_000_000;

const KEPT_FILES: usize = 8;

pub fn plugin<R: Runtime>() -> TauriPlugin<R> {
    let builder = tauri_plugin_log::Builder::new()
        .clear_targets()
        .target(Target::new(TargetKind::LogDir {
            file_name: Some(FILE_NAME.to_owned()),
        }))
        .filter(|metadata| metadata.target() == TARGET)
        .rotation_strategy(RotationStrategy::KeepSome(KEPT_FILES))
        .max_file_size(MAX_FILE_SIZE)
        .timezone_strategy(TimezoneStrategy::UseLocal);

    #[cfg(debug_assertions)]
    let builder = builder.target(Target::new(TargetKind::Stdout));

    builder.build()
}

pub fn append(entry: &JournalEntry) {
    match serde_json::to_string(entry) {
        Ok(line) => log::info!(target: TARGET, "{line}"),
        Err(error) => {
            log::info!(target: TARGET, r#"{{"id":{},"unwritable":"{error}"}}"#, entry.id);
        }
    }
}

pub fn reveal(app: &AppHandle) {
    let revealed = path(app).and_then(|path| {
        app.opener()
            .reveal_item_in_dir(path)
            .map_err(|error| error.to_string())
    });

    if let Err(detail) = revealed {
        lock(app).log(JournalEvent::OpenFailed { detail });
    }
}

fn path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_log_dir()
        .map(|directory| directory.join(FILE_NAME).with_extension(FILE_EXTENSION))
        .map_err(|error| error.to_string())
}
