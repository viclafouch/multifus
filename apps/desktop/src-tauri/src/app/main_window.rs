use std::sync::Mutex;
use std::sync::PoisonError;

use tauri::AppHandle;
use tauri::Manager;
use tauri::RunEvent;
use tauri::Window;
use tauri::WindowEvent;
use tauri::Wry;

use crate::app::journal::JournalEvent;
use crate::app::journal::Launch;
use crate::app::runtime;
use crate::app::state::AppState;
use crate::app::state::hold;
use crate::app::state::lock;
use crate::app::tray;

pub const LABEL: &str = "main";

pub const FROM_SESSION_ARG: &str = "--from-session";

#[derive(Default)]
struct Wait {
    is_painted: bool,
    is_awaited: Option<bool>,
    is_shown: bool,
}

impl Wait {
    fn take_due(&mut self) -> bool {
        let is_due = self.is_painted && self.is_awaited == Some(true) && !self.is_shown;

        self.is_shown |= is_due;

        is_due
    }
}

#[derive(Default)]
pub struct Readiness(Mutex<Wait>);

impl Readiness {
    fn settle(&self, change: impl FnOnce(&mut Wait)) -> bool {
        let mut wait = self.0.lock().unwrap_or_else(PoisonError::into_inner);

        change(&mut wait);

        wait.take_due()
    }
}

pub fn hold_until_ready(app: &AppHandle) {
    let is_awaited = matches_awaited(launch(), tray::is_present(app));
    let is_due = app.state::<Readiness>().settle(|wait| {
        wait.is_awaited = Some(is_awaited);
    });

    if is_due {
        show(app);
    }
}

pub fn show_when_ready(app: &AppHandle, label: &str) {
    if label != LABEL {
        return;
    }

    let is_due = app.state::<Readiness>().settle(|wait| {
        wait.is_painted = true;
    });

    if is_due {
        show(app);
    }
}

#[must_use]
pub fn launch() -> Launch {
    if matches_session_launch(std::env::args()) {
        Launch::Session
    } else {
        Launch::ByHand
    }
}

#[cfg(target_os = "macos")]
pub fn show_on_dock_click(app: &AppHandle, event: RunEvent) {
    if matches!(event, RunEvent::Reopen { .. }) {
        show(app);
    }
}

#[cfg(not(target_os = "macos"))]
pub fn show_on_dock_click(_app: &AppHandle, _event: RunEvent) {}

pub fn show_on_second_launch(app: &AppHandle, arguments: Vec<String>) {
    let Some(state) = app.try_state::<AppState>() else {
        return;
    };

    hold(&state).log(JournalEvent::LaunchedAgain);

    runtime::emit_snapshot(app);

    if matches_session_launch(arguments) {
        return;
    }

    show(app);
}

pub fn show(app: &AppHandle) {
    let Some(window) = app.get_webview_window(LABEL) else {
        return;
    };

    let shown = window.show().and_then(|()| window.set_focus());

    if let Err(error) = shown {
        lock(app).log_unless_repeated(JournalEvent::WindowFailed {
            detail: error.to_string(),
        });
    }
}

#[must_use]
pub fn is_on_screen(app: &AppHandle) -> bool {
    app.get_webview_window(LABEL)
        .is_some_and(|window| window.is_visible().unwrap_or(true))
}

pub fn hide_rather_than_quit(window: &Window<Wry>, event: &WindowEvent) {
    let WindowEvent::CloseRequested { api, .. } = event else {
        return;
    };

    if window.label() != LABEL {
        return;
    }

    let app = window.app_handle();

    if !tray::is_present(app) {
        return;
    }

    api.prevent_close();

    if let Err(error) = window.hide() {
        lock(app).log_unless_repeated(JournalEvent::WindowFailed {
            detail: error.to_string(),
        });
    }
}

fn matches_session_launch(arguments: impl IntoIterator<Item = String>) -> bool {
    arguments
        .into_iter()
        .any(|argument| argument == FROM_SESSION_ARG)
}

fn matches_awaited(launch: Launch, has_tray: bool) -> bool {
    launch != Launch::Session || !has_tray
}

#[cfg(test)]
mod tests {
    use super::*;

    const BINARY: &str = "/Applications/Multifus.app/Contents/MacOS/Multifus";

    #[test]
    fn a_launch_by_hand_carries_the_binary_alone() {
        assert!(!matches_session_launch([BINARY.to_owned()]));
    }

    #[test]
    fn the_session_launcher_carries_the_argument() {
        assert!(matches_session_launch([
            BINARY.to_owned(),
            FROM_SESSION_ARG.to_owned(),
        ]));
    }

    #[test]
    fn a_launch_by_hand_awaits_the_window() {
        assert!(matches_awaited(Launch::ByHand, true));
        assert!(matches_awaited(Launch::ByHand, false));
    }

    #[test]
    fn the_session_awaits_the_window_only_without_a_tray() {
        assert!(!matches_awaited(Launch::Session, true));
        assert!(matches_awaited(Launch::Session, false));
    }

    #[test]
    fn a_window_painted_before_the_setup_ends_shows_once_it_ends() {
        let mut wait = Wait {
            is_painted: true,
            ..Wait::default()
        };

        assert!(!wait.take_due());

        wait.is_awaited = Some(true);
        assert!(wait.take_due());
        assert!(!wait.take_due());
    }

    #[test]
    fn a_window_painted_after_the_setup_ends_shows_at_once() {
        let mut wait = Wait {
            is_awaited: Some(true),
            ..Wait::default()
        };

        assert!(!wait.take_due());

        wait.is_painted = true;
        assert!(wait.take_due());
    }

    #[test]
    fn a_window_nobody_awaits_stays_hidden() {
        let mut wait = Wait {
            is_painted: true,
            is_awaited: Some(false),
            is_shown: false,
        };

        assert!(!wait.take_due());
    }
}
