use std::path::Path;

use serde::Deserialize;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::app::journal::JournalEvent;
use crate::app::runtime;
use crate::app::state::lock;
#[cfg(target_os = "windows")]
use crate::platform::matches_windows_eleven;

const SOURCE_URL: &str = "https://github.com/viclafouch/multifus";

const ISSUES_URL: &str = "https://github.com/viclafouch/multifus/issues";

const FORUM_URL: &str = "https://www.dofus-retro.com/fr/forum/12-suggestions-retours/2950-pourquoi-ankama-autorise-outils-crees-communaute";

const POST_URL: &str = "https://x.com/DOFUSRetro_FR/status/2031323028072681799";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AboutLink {
    Source,
    Issues,
    Forum,
    Post,
}

impl AboutLink {
    #[must_use]
    fn url(self) -> &'static str {
        match self {
            Self::Source => SOURCE_URL,
            Self::Issues => ISSUES_URL,
            Self::Forum => FORUM_URL,
            Self::Post => POST_URL,
        }
    }
}

#[cfg(target_os = "macos")]
const AUTHORIZATION_PAGE_URL: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

#[cfg(target_os = "macos")]
const NOTIFICATIONS_PAGE_URL: &str =
    "x-apple.systempreferences:com.apple.Notifications-Settings.extension";

#[cfg(target_os = "macos")]
fn focus_page_url() -> &'static str {
    "x-apple.systempreferences:com.apple.Focus-Settings.extension"
}

#[cfg(target_os = "windows")]
const AUTHORIZATION_PAGE_URL: &str = "ms-settings:privacy-notifications";

#[cfg(target_os = "windows")]
const NOTIFICATIONS_PAGE_URL: &str = "ms-settings:notifications";

#[cfg(target_os = "windows")]
const FOCUS_ASSIST_PAGE_URL: &str = "ms-settings:quiethours";

#[cfg(target_os = "windows")]
fn focus_page_url() -> &'static str {
    if matches_windows_eleven() {
        NOTIFICATIONS_PAGE_URL
    } else {
        FOCUS_ASSIST_PAGE_URL
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SystemPage {
    Authorization,
    Notifications,
    Focus,
}

impl SystemPage {
    #[must_use]
    fn url(self) -> &'static str {
        match self {
            Self::Authorization => AUTHORIZATION_PAGE_URL,
            Self::Notifications => NOTIFICATIONS_PAGE_URL,
            Self::Focus => focus_page_url(),
        }
    }
}

pub fn open_system_page(app: &AppHandle, page: SystemPage) {
    open_url(app, page.url());
}

pub fn open_about(app: &AppHandle, link: AboutLink) {
    open_url(app, link.url());
}

pub fn open_url(app: &AppHandle, url: &str) {
    if let Err(error) = app.opener().open_url(url, None::<&str>) {
        failed(app, error.to_string());
    }
}

pub fn reveal(app: &AppHandle, path: impl AsRef<Path>) {
    if let Err(error) = app.opener().reveal_item_in_dir(path) {
        failed(app, error.to_string());
    }
}

pub fn failed(app: &AppHandle, detail: String) {
    lock(app).log(JournalEvent::OpenFailed { detail });

    runtime::emit_snapshot(app);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_project_links_go_to_the_repository() {
        for link in [AboutLink::Source, AboutLink::Issues] {
            let url = link.url();

            assert!(
                url.starts_with("https://github.com/viclafouch/multifus"),
                "{url} is not the repository"
            );
        }
    }

    #[test]
    fn the_tolerance_links_go_to_what_ankama_wrote() {
        assert!(
            AboutLink::Forum
                .url()
                .starts_with("https://www.dofus-retro.com/fr/forum/")
        );
        assert!(
            AboutLink::Post
                .url()
                .starts_with("https://x.com/DOFUSRetro_FR/status/")
        );
    }

    #[test]
    fn every_about_link_goes_to_its_own_page() {
        let urls = [
            AboutLink::Source.url(),
            AboutLink::Issues.url(),
            AboutLink::Forum.url(),
            AboutLink::Post.url(),
        ];

        for (rank, url) in urls.iter().enumerate() {
            assert!(!urls[rank + 1..].contains(url), "{url} is given twice");
        }
    }

    #[test]
    fn every_system_page_opens_a_page_of_the_system() {
        let scheme = if cfg!(target_os = "macos") {
            "x-apple.systempreferences:"
        } else {
            "ms-settings:"
        };

        for page in [
            SystemPage::Authorization,
            SystemPage::Notifications,
            SystemPage::Focus,
        ] {
            let url = page.url();

            assert!(url.starts_with(scheme), "{url} is not a page of the system");
        }
    }

    #[test]
    fn the_authorization_page_is_never_one_of_the_other_two() {
        let authorization = SystemPage::Authorization.url();

        assert_ne!(authorization, SystemPage::Notifications.url());
        assert_ne!(authorization, SystemPage::Focus.url());
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn the_mac_holds_concentration_on_a_page_of_its_own() {
        assert_ne!(
            SystemPage::Notifications.url(),
            SystemPage::Focus.url(),
            "Réglages Système lists Concentration next to Notifications"
        );
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn focus_assist_had_a_page_of_its_own_before_windows_eleven_folded_it_in() {
        assert_ne!(FOCUS_ASSIST_PAGE_URL, NOTIFICATIONS_PAGE_URL);
    }
}
