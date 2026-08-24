//! The paste of ADR 0012, written once for both systems.
//!
//! Only the third step crosses the boundary, [`PasteSender`]: the clipboard is
//! the same code on macOS and on Windows, so it lives above it. The five steps
//! and the rule that keeps them off the lock are in `docs/plan.md`, temps 3.

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

/// How long the game is given to read the clipboard before the old text goes
/// back. Measured on 24 August 2026, three times the floor of 50 ms.
const GIVE_BACK_AFTER: Duration = Duration::from_millis(150);

/// How much of the text the journal keeps, ADR 0012.
const EXCERPT_LENGTH: usize = 40;

/// Pastes a quick reply into the game, once a combination bound to it has fired.
///
/// The guard of perimetre.md is [`crate::app::shortcuts`]'s: this is only ever
/// called with a game window in front.
pub fn paste(app: &AppHandle, id: QuickReplyId) {
    // Read under the lock and never carried on the queue: a quick reply rewritten
    // while multifus runs must paste what it says now.
    let Some(text) = lock(app).quick_reply_text(id) else {
        return failed(app, QuickReplyFailure::Gone);
    };

    let excerpt = excerpt_of(&text);
    let borrowed = app.clipboard().read_text().ok();

    // Nothing is given back when this fails: the clipboard was never touched.
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

/// Puts back what the user had copied.
///
/// A clipboard holding an image reads as no text at all: it is lost, and the
/// screen says so rather than the journal. A refusal here is the other thing.
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

/// Writes down where a quick reply stopped. The snapshot goes out from the caller.
fn failed(app: &AppHandle, reason: QuickReplyFailure) {
    // Mashing a key outside the game says the same thing about the same press,
    // and written every time it would flush a journal of two hundred lines.
    lock(app).log_unless_repeated(JournalEvent::QuickReplyFailed { reason });
}

/// The head of the text, cut on a character and never inside one.
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
