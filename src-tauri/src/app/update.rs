use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;

use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_updater::Update;
use tauri_plugin_updater::UpdaterExt;

use crate::app::journal::JournalEvent;
use crate::app::runtime;
use crate::app::state::lock;
use crate::app::view::UpdateView;

type PendingUpdate = Mutex<Option<Update>>;

pub fn setup(app: &AppHandle) {
    app.manage::<PendingUpdate>(Mutex::new(None));

    check(app);
}

pub fn check(app: &AppHandle) {
    lock(app).set_update(UpdateView::Checking);

    runtime::emit_snapshot(app);

    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        let found = look(&app).await;

        match found {
            Ok(Some(update)) => {
                let version = update.version.clone();

                *pending(&app) = Some(update);

                let mut state = lock(&app);

                state.set_update(UpdateView::Available {
                    version: version.clone(),
                });
                state.log_unless_repeated(JournalEvent::UpdateAvailable { version });
            }
            Ok(None) => up_to_date(&app),
            Err(tauri_plugin_updater::Error::ReleaseNotFound) => up_to_date(&app),
            Err(error) => fail(&app, &error.to_string()),
        }

        runtime::emit_snapshot(&app);
    });
}

async fn look(app: &AppHandle) -> tauri_plugin_updater::Result<Option<Update>> {
    app.updater()?.check().await
}

pub fn install(app: &AppHandle) {
    let Some(update) = pending(app).take() else {
        return;
    };

    lock(app).set_update(UpdateView::Installing);

    runtime::emit_snapshot(app);

    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        let installed = update.download_and_install(|_, _| {}, || {}).await;

        if let Err(error) = installed {
            fail(&app, &error.to_string());

            runtime::emit_snapshot(&app);

            return;
        }

        app.restart();
    });
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

fn pending(app: &AppHandle) -> MutexGuard<'_, Option<Update>> {
    app.state::<PendingUpdate>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}
