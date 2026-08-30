use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;

use tauri::AppHandle;
use tauri::Manager;
use tauri::RunEvent;
use tauri::Window;
use tauri::WindowEvent;
use tauri::Wry;

use crate::app::journal::JournalEvent;
use crate::app::journal::Launch;
use crate::app::state::lock;
use crate::app::tray;

pub const LABEL: &str = "main";

pub const FROM_SESSION_ARG: &str = "--from-session";

struct Awaited(AtomicBool);

pub fn hold_until_ready(app: &AppHandle) {
    let awaited = matches_awaited(launch(), tray::is_present(app));

    app.manage(Awaited(AtomicBool::new(awaited)));
}

pub fn show_when_ready(app: &AppHandle, label: &str) {
    if label != LABEL {
        return;
    }

    if app.state::<Awaited>().0.swap(false, Ordering::AcqRel) {
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
}
