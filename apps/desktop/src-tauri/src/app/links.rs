use std::path::Path;

use serde::Deserialize;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::app::journal::JournalEvent;
use crate::app::runtime;
use crate::app::state::lock;

const SOURCE_URL: &str = "https://github.com/viclafouch/multifus";

const ISSUES_URL: &str = "https://github.com/viclafouch/multifus/issues";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AboutLink {
    Source,
    Issues,
}

impl AboutLink {
    #[must_use]
    fn url(self) -> &'static str {
        match self {
            Self::Source => SOURCE_URL,
            Self::Issues => ISSUES_URL,
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
const FOCUS_PAGE_URL: &str = "x-apple.systempreferences:com.apple.Focus-Settings.extension";

#[cfg(target_os = "windows")]
const AUTHORIZATION_PAGE_URL: &str = "ms-settings:privacy-notifications";

#[cfg(target_os = "windows")]
const NOTIFICATIONS_PAGE_URL: &str = "ms-settings:notifications";

#[cfg(target_os = "windows")]
const FOCUS_PAGE_URL: &str = "ms-settings:quiethours";

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
            Self::Focus => FOCUS_PAGE_URL,
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
    fn every_about_link_goes_to_the_repository() {
        for link in [AboutLink::Source, AboutLink::Issues] {
            let url = link.url();

            assert!(
                url.starts_with("https://github.com/viclafouch/multifus"),
                "{url} is not the repository"
            );
        }
    }

    #[test]
    fn the_source_and_the_issues_are_two_different_pages() {
        assert_ne!(AboutLink::Source.url(), AboutLink::Issues.url());
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
    fn the_three_system_pages_are_three_different_pages() {
        let authorization = SystemPage::Authorization.url();
        let notifications = SystemPage::Notifications.url();
        let focus = SystemPage::Focus.url();

        assert_ne!(authorization, notifications);
        assert_ne!(notifications, focus);
        assert_ne!(focus, authorization);
    }
}
