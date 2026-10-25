use std::time::Duration;

use reqwest::Client;
use semver::Version;
use serde::Deserialize;
use tauri::AppHandle;

use crate::app::journal::JournalEvent;
use crate::app::runtime;
use crate::app::state::lock;
use crate::app::view::UpdateView;

const LATEST_RELEASE_URL: &str = "https://api.github.com/repos/viclafouch/multifus/releases/latest";

const TIMEOUT: Duration = Duration::from_secs(15);

#[derive(Debug, Deserialize)]
struct LatestRelease {
    tag_name: String,
}

pub fn setup(app: &AppHandle) {
    check(app);
}

pub fn check(app: &AppHandle) {
    lock(app).set_update(UpdateView::Checking);

    runtime::emit_snapshot(app);

    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        let running = &app.package_info().version;

        match latest_tag(running).await {
            Ok(tag) => match newer_version(&tag, running) {
                Some(version) => {
                    let mut state = lock(&app);

                    state.offer_update(version.clone());
                    state.log_unless_repeated(JournalEvent::UpdateAvailable { version });
                }
                None => up_to_date(&app),
            },
            Err(error) => fail(&app, &error.without_url().to_string()),
        }

        runtime::emit_snapshot(&app);
    });
}

async fn latest_tag(running: &Version) -> reqwest::Result<String> {
    let release = Client::builder()
        .timeout(TIMEOUT)
        .user_agent(format!("Multifus/{running}"))
        .build()?
        .get(LATEST_RELEASE_URL)
        .send()
        .await?
        .error_for_status()?
        .json::<LatestRelease>()
        .await?;

    Ok(release.tag_name)
}

fn newer_version(tag: &str, running: &Version) -> Option<String> {
    let published = Version::parse(tag.trim_start_matches('v')).ok()?;

    (published > *running).then(|| published.to_string())
}

fn up_to_date(app: &AppHandle) {
    let mut state = lock(app);

    state.set_update(UpdateView::UpToDate);
    state.log_unless_repeated(JournalEvent::UpdateUpToDate);
}

fn fail(app: &AppHandle, detail: &str) {
    let mut state = lock(app);

    state.set_update(UpdateView::Failed {
        detail: detail.to_owned(),
    });
    state.log_unless_repeated(JournalEvent::UpdateFailed {
        detail: detail.to_owned(),
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    fn running() -> Version {
        Version::new(0, 4, 0)
    }

    #[test]
    fn a_later_release_is_offered_under_its_bare_version() {
        assert_eq!(
            newer_version("v0.5.0", &running()),
            Some("0.5.0".to_owned())
        );
        assert_eq!(
            newer_version("v0.10.0", &running()),
            Some("0.10.0".to_owned())
        );
    }

    #[test]
    fn the_running_version_or_an_older_one_offers_nothing() {
        assert_eq!(newer_version("v0.4.0", &running()), None);
        assert_eq!(newer_version("v0.3.0", &running()), None);
    }

    #[test]
    fn a_tag_that_is_not_a_version_offers_nothing() {
        assert_eq!(newer_version("nightly", &running()), None);
    }
}
