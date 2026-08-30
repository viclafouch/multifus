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
}
