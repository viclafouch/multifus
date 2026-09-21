mod aptabase;
mod props;
mod tally;

use std::panic::Location;
use std::sync::Arc;

use serde_json::json;
use tauri::AppHandle;
use tauri::Manager;

use crate::app::main_window;
use crate::app::state::lock;
use crate::platform::matches_windows_eleven;

pub use props::Measured;
pub use props::stopped_props;
pub use tally::Tally;

use aptabase::Aptabase;
use aptabase::SystemParams;
use aptabase::shortened;
use props::StartedParams;
use props::started_props;

const KEY: &str = match option_env!("APTABASE_KEY") {
    Some(key) => key,
    None => "",
};

const STARTED: &str = "app_started";

const STOPPED: &str = "app_stopped";

const ONBOARDING_FINISHED: &str = "onboarding_finished";

const UPDATED: &str = "app_updated";

const CRASHED: &str = "app_crashed";

const ELSEWHERE: &str = "elsewhere";

const SOURCE_ROOT: &str = "src/";

pub fn setup(app: &AppHandle) {
    let stats = Aptabase::new(
        KEY,
        SystemParams {
            app_version: app.package_info().version.to_string(),
            os_version: tauri_plugin_os::version().to_string(),
            locale: tauri_plugin_os::locale().unwrap_or_default(),
            engine_version: tauri::webview_version().unwrap_or_default(),
        },
    );

    stats.share(lock(app).shares_stats());

    app.manage(Arc::new(stats));
}

pub fn share(app: &AppHandle, sharing: bool) {
    let Some(stats) = app.try_state::<Arc<Aptabase>>() else {
        return;
    };

    stats.share(sharing);
}

pub fn app_started(app: &AppHandle) {
    let Some(stats) = stats_if_measuring(app) else {
        return;
    };

    let props = {
        let state = lock(app);

        started_props(StartedParams {
            measured: &state.measured(),
            launch: main_window::launch(),
            is_windows_eleven: matches_windows_eleven(),
        })
    };

    stats.track(STARTED, props);
    stats.send_apart();
}

pub fn app_stopped(app: &AppHandle) {
    let Some(stats) = stats_if_measuring(app) else {
        return;
    };

    let props = {
        let state = lock(app);

        stopped_props(&state.measured())
    };

    stats.track(STOPPED, props);
    stats.send_and_wait();
}

pub fn onboarding_finished(app: &AppHandle) {
    let Some(stats) = stats_if_measuring(app) else {
        return;
    };

    stats.track(ONBOARDING_FINISHED, json!({}));
    stats.send_apart();
}

pub fn app_updated(app: &AppHandle, version: &str) {
    let Some(stats) = stats_if_measuring(app) else {
        return;
    };

    stats.track(UPDATED, json!({ "to": shortened(version) }));
    stats.send_and_wait();
}

pub fn app_crashed(app: &AppHandle, location: Option<&Location<'_>>) {
    let Some(stats) = stats_if_measuring(app) else {
        return;
    };

    stats.track(CRASHED, json!({ "at": shortened(&named_place(location)) }));
    stats.send_and_wait();
}

fn stats_if_measuring(app: &AppHandle) -> Option<Arc<Aptabase>> {
    let stats = Arc::clone(app.try_state::<Arc<Aptabase>>()?.inner());

    stats.is_measuring().then_some(stats)
}

fn named_place(location: Option<&Location<'_>>) -> String {
    location.map_or_else(
        || ELSEWHERE.to_owned(),
        |location| named_file(location.file(), location.line()),
    )
}

fn named_file(file: &str, line: u32) -> String {
    let file = file.replace('\\', "/");

    match file.strip_prefix(SOURCE_ROOT) {
        Some(ours) => format!("{ours}:{line}"),
        None => ELSEWHERE.to_owned(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_panic_in_our_own_files_says_the_file_and_the_line() {
        assert_eq!(named_file("src/app/walk.rs", 214), "app/walk.rs:214");
    }

    #[test]
    fn a_windows_build_names_the_same_file_the_same_way() {
        assert_eq!(named_file("src\\app\\walk.rs", 214), "app/walk.rs:214");
    }

    #[test]
    fn a_panic_inside_a_dependency_never_carries_the_path_of_the_machine() {
        let borrowed =
            "/Users/someone/.cargo/registry/src/index.crates.io-1234/tokio-1.0/src/lib.rs";

        assert_eq!(named_file(borrowed, 42), ELSEWHERE);
        assert_eq!(named_place(None), ELSEWHERE);
    }

    #[test]
    fn a_real_panic_location_of_ours_is_read_the_same_way() {
        let here = Location::caller();

        assert_eq!(
            named_place(Some(here)),
            format!("app/stats/mod.rs:{}", here.line())
        );
    }
}
