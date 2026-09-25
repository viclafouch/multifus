use std::path::Path;

use serde::Deserialize;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::app::journal::JournalEvent;
use crate::app::runtime;
use crate::app::state::lock;
use crate::config::Language;
#[cfg(target_os = "windows")]
use crate::platform::matches_windows_eleven;

const SOURCE_URL: &str = "https://github.com/viclafouch/multifus";

const ISSUES_URL: &str = "https://github.com/viclafouch/multifus/issues";

const SITE_URL: &str = "https://www.multifus.app";

fn site_page(slug: &str) -> String {
    format!("{SITE_URL}/{slug}")
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AboutLink {
    Source,
    Issues,
    Journal,
    Ankama,
    Legal,
}

impl AboutLink {
    #[must_use]
    fn url(self, language: Language) -> String {
        match self {
            Self::Source => SOURCE_URL.to_owned(),
            Self::Issues => ISSUES_URL.to_owned(),
            Self::Journal => site_page(match language {
                Language::Fr => "journal",
                Language::En => "en/changelog",
                Language::Es => "es/novedades",
            }),
            Self::Ankama => site_page(match language {
                Language::Fr => "ankama",
                Language::En => "en/ankama",
                Language::Es => "es/ankama",
            }),
            Self::Legal => site_page(match language {
                Language::Fr => "mentions-legales",
                Language::En => "en/legal-notice",
                Language::Es => "es/aviso-legal",
            }),
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
    let language = lock(app).language();

    open_url(app, &link.url(language));
}

#[must_use]
fn release_notes_url(version: &str, language: Language) -> String {
    format!("{}#v{version}", AboutLink::Journal.url(language))
}

pub fn open_release_notes(app: &AppHandle) {
    let (version, language) = {
        let mut state = lock(app);

        (state.mark_release_notes_opened(), state.language())
    };

    if let Some(version) = version {
        open_url(app, &release_notes_url(&version, language));
    }
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
    use std::collections::HashSet;

    use super::*;

    #[test]
    fn the_project_links_go_to_the_repository() {
        for link in [AboutLink::Source, AboutLink::Issues] {
            let url = link.url(Language::Fr);

            assert!(
                url.starts_with("https://github.com/viclafouch/multifus"),
                "{url} is not the repository"
            );
        }
    }

    const SITE_PAGES: [AboutLink; 3] = [AboutLink::Journal, AboutLink::Ankama, AboutLink::Legal];

    fn repeated(urls: &[String]) -> Option<&str> {
        let mut seen = HashSet::new();

        urls.iter()
            .find(|url| !seen.insert(url.as_str()))
            .map(String::as_str)
    }

    #[test]
    fn every_about_link_goes_to_its_own_page() {
        let urls = [
            AboutLink::Source.url(Language::Fr),
            AboutLink::Issues.url(Language::Fr),
            AboutLink::Journal.url(Language::Fr),
            AboutLink::Ankama.url(Language::Fr),
            AboutLink::Legal.url(Language::Fr),
        ];

        assert_eq!(repeated(&urls), None, "a link is given twice");
    }

    #[test]
    fn what_the_site_explains_opens_in_the_language_that_is_read() {
        for link in SITE_PAGES {
            let urls = Language::ALL.map(|language| link.url(language));

            for url in &urls {
                assert!(
                    url.starts_with("https://www.multifus.app/"),
                    "{url} is not a page of the site"
                );
            }

            assert_eq!(
                repeated(&urls),
                None,
                "{link:?} is read in two languages at the same address"
            );
        }
    }

    #[test]
    fn the_release_notes_land_on_the_version_in_the_patch_notes_of_the_site() {
        assert_eq!(
            release_notes_url("0.3.0", Language::Fr),
            "https://www.multifus.app/journal#v0.3.0"
        );
        assert_eq!(
            release_notes_url("0.3.0", Language::En),
            "https://www.multifus.app/en/changelog#v0.3.0"
        );
        assert_eq!(
            release_notes_url("0.3.0", Language::Es),
            "https://www.multifus.app/es/novedades#v0.3.0"
        );
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
