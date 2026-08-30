use serde::Deserialize;
use tauri::AppHandle;

use crate::app::links::open_url;

const WEB_URL: &str = "https://web.telegram.org";

const BOT_FATHER_URL: &str = "https://t.me/botfather";

const FAQ_URL: &str = "https://telegram.org/faq/fr";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RelayLink {
    Web,
    BotFather,
    Faq,
}

impl RelayLink {
    #[must_use]
    fn url(self) -> &'static str {
        match self {
            Self::Web => WEB_URL,
            Self::BotFather => BOT_FATHER_URL,
            Self::Faq => FAQ_URL,
        }
    }
}

pub fn open(app: &AppHandle, link: RelayLink) {
    open_url(app, link.url());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_link_is_an_official_telegram_address() {
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
