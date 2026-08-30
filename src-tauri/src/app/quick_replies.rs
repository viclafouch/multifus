use std::thread;
use std::time::Duration;

use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_clipboard_manager::ClipboardExt;

use crate::app::journal::JournalEvent;
use crate::app::journal::QuickReplyFailure;
use crate::app::state::AppState;
use crate::app::state::hold;
use crate::app::state::paste_sender;
use crate::config::QuickReplyId;
use crate::platform::Clipboard;
use crate::platform::PasteSender;
use crate::platform::PlatformError;
use crate::platform::Result;

const GIVE_BACK_AFTER: Duration = Duration::from_millis(150);

const EXCERPT_LENGTH: usize = 40;

struct AppClipboard<'a>(&'a AppHandle);

impl Clipboard for AppClipboard<'_> {
    fn text(&self) -> Option<String> {
        self.0.clipboard().read_text().ok()
    }

    fn set_text(&self, text: &str) -> Result<()> {
        self.0
            .clipboard()
            .write_text(text.to_owned())
            .map_err(|error| PlatformError::system("writing to the clipboard", error.to_string()))
    }
}

struct Paste<'a> {
    clipboard: &'a dyn Clipboard,
    sender: &'a dyn PasteSender,
    state: &'a AppState,
}

pub fn paste(app: &AppHandle, id: QuickReplyId) {
    hand_over(
        &Paste {
            clipboard: &AppClipboard(app),
            sender: paste_sender(app),
            state: app.state::<AppState>().inner(),
        },
        id,
    );
}

fn hand_over(paste: &Paste, id: QuickReplyId) {
    let Some(text) = hold(paste.state).quick_reply_text(id) else {
        return failed(paste, QuickReplyFailure::Gone);
    };

    let excerpt = excerpt_of(&text);
    let borrowed = paste.clipboard.text();

    if let Err(error) = paste.clipboard.set_text(&text) {
        return failed(
            paste,
            QuickReplyFailure::ClipboardRefused {
                detail: error.to_string(),
            },
        );
    }

    match paste.sender.send_paste_combination() {
        Ok(()) => {
            thread::sleep(GIVE_BACK_AFTER);

            hold(paste.state).log(JournalEvent::QuickReplyPasted { excerpt });
        }
        Err(error) => failed(
            paste,
            QuickReplyFailure::PasteRefused {
                detail: error.to_string(),
            },
        ),
    }

    give_back(paste, borrowed);
}

fn give_back(paste: &Paste, borrowed: Option<String>) {
    let Some(borrowed) = borrowed else {
        return;
    };

    if let Err(error) = paste.clipboard.set_text(&borrowed) {
        failed(
            paste,
            QuickReplyFailure::ClipboardNotGivenBack {
                detail: error.to_string(),
            },
        );
    }
}

fn failed(paste: &Paste, reason: QuickReplyFailure) {
    hold(paste.state).log_unless_repeated(JournalEvent::QuickReplyFailed { reason });
}

fn excerpt_of(text: &str) -> String {
    text.chars().take(EXCERPT_LENGTH).collect()
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;
    use std::sync::PoisonError;

    use super::*;
    use crate::config::Settings;
    use crate::test_doubles::app_state;
    use crate::test_doubles::directory;
    use crate::test_doubles::journalled;

    #[derive(Debug, Default)]
    struct FakeClipboard {
        text: Mutex<Option<String>>,
        refusal: Option<PlatformError>,
    }

    impl FakeClipboard {
        fn holding(text: &str) -> Self {
            Self {
                text: Mutex::new(Some(text.to_owned())),
                refusal: None,
            }
        }

        fn read(&self) -> Option<String> {
            self.text
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .clone()
        }
    }

    impl Clipboard for FakeClipboard {
        fn text(&self) -> Option<String> {
            self.read()
        }

        fn set_text(&self, text: &str) -> Result<()> {
            match self.refusal.clone() {
                Some(refusal) => Err(refusal),
                None => {
                    *self.text.lock().unwrap_or_else(PoisonError::into_inner) =
                        Some(text.to_owned());

                    Ok(())
                }
            }
        }
    }

    #[derive(Debug, Default)]
    struct FakePasteSender {
        refusal: Option<PlatformError>,
        sent: Mutex<u32>,
    }

    impl FakePasteSender {
        fn sent(&self) -> u32 {
            *self.sent.lock().unwrap_or_else(PoisonError::into_inner)
        }
    }

    impl PasteSender for FakePasteSender {
        fn send_paste_combination(&self) -> Result<()> {
            *self.sent.lock().unwrap_or_else(PoisonError::into_inner) += 1;

            match self.refusal.clone() {
                Some(refusal) => Err(refusal),
                None => Ok(()),
            }
        }
    }

    fn one_quick_reply() -> (QuickReplyId, String, Settings) {
        let settings = Settings::default();
        let reply = &settings.quick_replies[0];
        let id = reply.id;
        let text = reply.text.clone();

        (id, text, settings)
    }

    #[test]
    fn an_excerpt_stops_at_forty_characters_and_never_inside_one() {
        let text = "é".repeat(60);

        assert_eq!(excerpt_of(&text).chars().count(), EXCERPT_LENGTH);
        assert_eq!(excerpt_of("prix libre"), "prix libre");
    }

    #[test]
    fn what_was_in_the_clipboard_before_the_paste_is_there_again_after() {
        let directory = directory();
        let (id, _text, settings) = one_quick_reply();
        let state = app_state(&directory, settings);
        let clipboard = FakeClipboard::holding("une amulette du bouftou, 5000 kamas");
        let sender = FakePasteSender::default();

        hand_over(
            &Paste {
                clipboard: &clipboard,
                sender: &sender,
                state: &state,
            },
            id,
        );

        assert_eq!(sender.sent(), 1);
        assert_eq!(
            clipboard.read(),
            Some("une amulette du bouftou, 5000 kamas".to_owned())
        );
        assert!(
            journalled(&state)
                .iter()
                .any(|event| matches!(event, JournalEvent::QuickReplyPasted { .. }))
        );
    }

    #[test]
    fn an_empty_clipboard_is_left_empty_and_the_reply_is_not_given_back() {
        let directory = directory();
        let (id, text, settings) = one_quick_reply();
        let state = app_state(&directory, settings);
        let clipboard = FakeClipboard::default();
        let sender = FakePasteSender::default();

        hand_over(
            &Paste {
                clipboard: &clipboard,
                sender: &sender,
                state: &state,
            },
            id,
        );

        assert_eq!(
            clipboard.read(),
            Some(text),
            "nothing was borrowed, so nothing is handed back"
        );
    }

    #[test]
    fn a_combination_the_system_refuses_still_gives_the_clipboard_back() {
        let directory = directory();
        let (id, _text, settings) = one_quick_reply();
        let state = app_state(&directory, settings);
        let clipboard = FakeClipboard::holding("prix libre");
        let sender = FakePasteSender {
            refusal: Some(PlatformError::system("pasting", "the system said no")),
            ..FakePasteSender::default()
        };

        hand_over(
            &Paste {
                clipboard: &clipboard,
                sender: &sender,
                state: &state,
            },
            id,
        );

        assert_eq!(clipboard.read(), Some("prix libre".to_owned()));
        assert!(journalled(&state).iter().any(|event| matches!(
            event,
            JournalEvent::QuickReplyFailed {
                reason: QuickReplyFailure::PasteRefused { .. }
            }
        )));
    }

    #[test]
    fn a_clipboard_that_will_not_be_written_to_leaves_the_game_alone() {
        let directory = directory();
        let (id, _text, settings) = one_quick_reply();
        let state = app_state(&directory, settings);
        let clipboard = FakeClipboard {
            text: Mutex::new(Some("prix libre".to_owned())),
            refusal: Some(PlatformError::system("writing to the clipboard", "busy")),
        };
        let sender = FakePasteSender::default();

        hand_over(
            &Paste {
                clipboard: &clipboard,
                sender: &sender,
                state: &state,
            },
            id,
        );

        assert_eq!(sender.sent(), 0, "nothing is pasted that was never copied");
        assert_eq!(clipboard.read(), Some("prix libre".to_owned()));
    }

    #[test]
    fn a_quick_reply_that_was_removed_pastes_nothing_at_all() {
        let directory = directory();
        let (id, _text, settings) = one_quick_reply();
        let state = app_state(&directory, settings);
        let clipboard = FakeClipboard::holding("prix libre");
        let sender = FakePasteSender::default();

        hold(&state).remove_quick_reply(id);

        hand_over(
            &Paste {
                clipboard: &clipboard,
                sender: &sender,
                state: &state,
            },
            id,
        );

        assert_eq!(sender.sent(), 0);
        assert_eq!(clipboard.read(), Some("prix libre".to_owned()));
        assert!(journalled(&state).iter().any(|event| matches!(
            event,
            JournalEvent::QuickReplyFailed {
                reason: QuickReplyFailure::Gone
            }
        )));
    }
}
