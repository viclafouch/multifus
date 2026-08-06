//! The three pages the pairing sends the user to, and nothing else.
//!
//! **The interface names a destination, it never hands over a URL.** Same rule
//! as [`crate::app::commands::reveal_quarantined_config`], which takes its path
//! from the state: nothing that crosses the bridge can point this somewhere it
//! was not meant to go. The addresses live here, in Rust, and React knows three
//! words.

use serde::Deserialize;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::app::journal::JournalEvent;
use crate::app::runtime;
use crate::app::state::lock;

/// Telegram in a browser, where the whole setup happens.
///
/// The official client needs no install and logs in by showing a code the
/// telephone scans once. It is what turns the bot token from fifty characters to
/// retype by hand into a copy and paste on the machine multifus runs on.
const WEB_URL: &str = "https://web.telegram.org";

/// BotFather, the official bot that makes bots. A `t.me` link opens the
/// conversation in Telegram itself when it is installed.
const BOT_FATHER_URL: &str = "https://t.me/botfather";

/// The Telegram FAQ, in French, which carries a section on bots. The bot
/// documentation proper only exists in English, so this is what can be offered.
const FAQ_URL: &str = "https://telegram.org/faq/fr";

/// One of the three pages the relay screen offers to open.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RelayLink {
    /// Telegram in a browser, where the setup is done.
    Web,
    /// The bot that creates bots.
    BotFather,
    /// What a bot is, in French.
    Faq,
}

impl RelayLink {
    /// Where it goes.
    #[must_use]
    fn url(self) -> &'static str {
        match self {
            Self::Web => WEB_URL,
            Self::BotFather => BOT_FATHER_URL,
            Self::Faq => FAQ_URL,
        }
    }
}

/// Hands the page to the browser, or to Telegram for a `t.me` address.
///
/// A refusal is written down and sent out on the spot: nothing comes back from
/// this command, so the journal line would otherwise wait for a passing
/// snapshot. Same shape as [`runtime::open_authorization_settings`].
pub fn open(app: &AppHandle, link: RelayLink) {
    let opened = app.opener().open_url(link.url(), None::<&str>);

    if let Err(error) = opened {
        lock(app).log(JournalEvent::OpenFailed {
            detail: error.to_string(),
        });

        runtime::emit_snapshot(app);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_link_is_an_official_telegram_address() {
        // The addresses are in the interface of an application somebody else may
        // one day install. A typo here sends them somewhere nobody checked.
        for link in [RelayLink::Web, RelayLink::BotFather, RelayLink::Faq] {
            let url = link.url();

            assert!(url.starts_with("https://"), "{url} is not https");
            assert!(
                url.contains("telegram.org") || url.starts_with("https://t.me/"),
                "{url} is not a Telegram address"
            );
        }
    }

    #[test]
    fn the_three_links_go_to_three_different_places() {
        assert_ne!(RelayLink::Web.url(), RelayLink::BotFather.url());
        assert_ne!(RelayLink::BotFather.url(), RelayLink::Faq.url());
        assert_ne!(RelayLink::Web.url(), RelayLink::Faq.url());
    }
}
