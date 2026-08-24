//! The update Multifus offers, and never applies behind the user's back.
//!
//! One check when the process starts, and one more whenever the about screen
//! asks. Nothing periodic: a release is a rare event, and a timer polling GitHub
//! for a window nobody has open would cost more than it ever saves.
//!
//! **Found is not installed.** The check writes a state into the snapshot and
//! stops there. Replacing the bundle restarts Multifus, which on a playing
//! evening means every client losing its window manager mid-combat, so it takes
//! a click. The system tray carries that click too, since an update the user
//! only learns about by opening the window is an update they never see.
//!
//! The whole exchange lives on this side rather than in React. What the
//! interface gets is [`crate::app::view::UpdateView`], one more field of the
//! snapshot, which is what lets the menu of the system tray say the same thing
//! as the window without either of them asking twice.

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

/// The update a check found, held until the user asks for it.
///
/// Kept out of [`crate::app::state::Multifus`] on purpose: it is a handle of the
/// plugin and not something the roster knows about, exactly like the watcher.
/// What the screens read is the state that travels in the snapshot.
type PendingUpdate = Mutex<Option<Update>>;

/// Puts the slot up and asks once, at startup.
pub fn setup(app: &AppHandle) {
    app.manage::<PendingUpdate>(Mutex::new(None));

    check(app);
}

/// Asks the endpoint whether a newer version is out.
///
/// Returns as soon as the request is posted. The answer comes back through the
/// snapshot, so the button that started it does not have to wait for a network
/// round trip to hand the interface something to draw.
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
                // Once per version and not once per question. The about screen
                // asks again by hand, and three presses used to write three
                // identical lines, which the documentation of this event said it
                // did not do.
                state.log_unless_repeated(JournalEvent::UpdateAvailable { version });
            }
            Ok(None) => up_to_date(&app),
            // An endpoint that answers without naming a release is the ordinary
            // state of a repository whose only release is still a draft, and of
            // one that has never published at all. There is nothing newer, which
            // is what being up to date means. A network that fails does not land
            // here: it comes back as another variant, and that one is a failure.
            Err(tauri_plugin_updater::Error::ReleaseNotFound) => up_to_date(&app),
            Err(error) => fail(&app, &error.to_string()),
        }

        runtime::emit_snapshot(&app);
    });
}

/// The question itself, both failures of which are the same to the caller: the
/// updater could not be built, or the endpoint could not be read.
async fn look(app: &AppHandle) -> tauri_plugin_updater::Result<Option<Update>> {
    app.updater()?.check().await
}

/// Downloads the update that was found and puts it in place.
///
/// Multifus restarts itself on success and never comes back from that call, so
/// nothing is journalled on the way out: what proves it worked is the version
/// the about screen shows on the next launch.
///
/// Does nothing when no check has found anything, which is what a click on a
/// menu built a moment before an « up to date » answer looks like.
///
/// Nothing is written in that case. It takes a click inside the fraction of a
/// second between a menu being drawn with the line and the check answering that
/// there is nothing to install, and the menu loses the line on the spot through
/// the snapshot. A journal line for it would describe the timing of a redraw
/// rather than anything about Multifus.
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

/// This version is the published one.
///
/// Written down as well as shown, which it was not: a check that has never once
/// reached the endpoint looked exactly like a Multifus that is up to date, and
/// over weeks that is the difference between « no release yet » and « this
/// machine has not been able to ask since March ». Collapsed into one line per
/// run by `log_unless_repeated`, since the answer does not change between two
/// presses of the same button.
fn up_to_date(app: &AppHandle) {
    let mut state = lock(app);

    state.set_update(UpdateView::UpToDate);
    state.log_unless_repeated(JournalEvent::UpdateUpToDate);
}

/// Says what went wrong, on screen and in the journal.
///
/// An update is the one thing here that talks to the network, so its failures
/// are the ordinary kind: an aeroplane, a company proxy, GitHub having a bad
/// morning. Written down rather than swallowed, and never in the way.
fn fail(app: &AppHandle, detail: &str) {
    let mut state = lock(app);

    state.set_update(UpdateView::Failed {
        detail: detail.to_owned(),
    });
    state.log_unless_repeated(JournalEvent::UpdateFailed {
        detail: detail.to_owned(),
    });
}

/// The update waiting to be installed, taken even if a previous holder panicked.
/// See the note on [`crate::app::state::lock`].
fn pending(app: &AppHandle) -> MutexGuard<'_, Option<Update>> {
    app.state::<PendingUpdate>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}
