use std::thread;
use std::time::Duration;

use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_clipboard_manager::ClipboardExt;

use crate::app::journal::JournalEvent;
use crate::app::journal::QuickReplyFailure;
use crate::app::state::lock;
use crate::config::QuickReplyId;
use crate::platform::PasteSender;
use crate::platform::PlatformPasteSender;

const GIVE_BACK_AFTER: Duration = Duration::from_millis(150);

const EXCERPT_LENGTH: usize = 40;

pub fn paste(app: &AppHandle, id: QuickReplyId) {
    let Some(text) = lock(app).quick_reply_text(id) else {
        return failed(app, QuickReplyFailure::Gone);
    };

    let excerpt = excerpt_of(&text);
    let borrowed = app.clipboard().read_text().ok();

    if let Err(error) = app.clipboard().write_text(text) {
        return failed(
            app,
            QuickReplyFailure::ClipboardRefused {
                detail: error.to_string(),
            },
        );
    }

    match app.state::<PlatformPasteSender>().send_paste_combination() {
        Ok(()) => {
            thread::sleep(GIVE_BACK_AFTER);

            lock(app).log(JournalEvent::QuickReplyPasted { excerpt });
        }
        Err(error) => failed(
            app,
            QuickReplyFailure::PasteRefused {
                detail: error.to_string(),
            },
        ),
    }

    give_back(app, borrowed);
}

fn give_back(app: &AppHandle, borrowed: Option<String>) {
    let Some(borrowed) = borrowed else {
        return;
    };

    if let Err(error) = app.clipboard().write_text(borrowed) {
        failed(
            app,
            QuickReplyFailure::ClipboardNotGivenBack {
                detail: error.to_string(),
            },
        );
    }
}

fn failed(app: &AppHandle, reason: QuickReplyFailure) {
    lock(app).log_unless_repeated(JournalEvent::QuickReplyFailed { reason });
}

fn excerpt_of(text: &str) -> String {
    text.chars().take(EXCERPT_LENGTH).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_excerpt_stops_at_forty_characters_and_never_inside_one() {
        let text = "é".repeat(60);

        assert_eq!(excerpt_of(&text).chars().count(), EXCERPT_LENGTH);
        assert_eq!(excerpt_of("prix libre"), "prix libre");
    }
}
