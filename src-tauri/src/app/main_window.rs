//! The window Multifus draws its screens in: when it opens, and when it comes
//! back.
//!
//! Named `main_window` and not `window` because in this project a « fenêtre » is
//! a game one, see CONTEXT.md. There is exactly one of these, it is never
//! destroyed, and closing it only puts it away.
//!
//! **It does not open when the session starts Multifus.** An application one
//! launches and forgets has no business putting a board in front of someone who
//! just logged in and is opening their clients. So the registration written by
//! [`crate::app::autostart`] carries [`FROM_SESSION_ARG`], Multifus reads its own
//! arguments, and the icon in the system tray is the whole of what a session
//! start shows. A launch by hand is the opposite: double-clicking an application
//! is asking to see it, and staying silent there would read as a failed launch.
//!
//! The window is declared `"visible": false` in `tauri.conf.json` and shown from
//! here rather than declared visible and hidden from here. Hiding it after the
//! fact would flash it on screen at every session start, which is the one thing
//! this is for.
//!
//! **Which makes the Dock icon the only way back on macOS**, and nothing
//! answered it before: a window that is merely hidden leaves an icon that a
//! click does nothing with. [`show_on_dock_click`] is what closes that hole, and
//! it matters more now that a hidden window is the ordinary state after a
//! session start rather than something the user did on purpose.
//!
//! **An update installed from a session start comes back silent too.**
//! `AppHandle::restart` hands the arguments of the dying process to the new one,
//! [`FROM_SESSION_ARG`] included, so Multifus restarts without its window on the
//! one click that most looks like it should end with one. It is left as is: the
//! system tray icon is up, so the window is one click away, and the alternative
//! is reimplementing Tauri's restart to take an argument away from it.

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

/// The label the window is declared under, and the one it is asked for by.
pub const LABEL: &str = "main";

/// What the session launcher adds after the path of the binary.
///
/// On macOS it lands in the `ProgramArguments` array of
/// `~/Library/LaunchAgents/Multifus.plist`, right after the executable, so it
/// reaches [`std::env::args`] like any other argument. The registration is
/// rewritten at every launch, so an agent written before this argument existed
/// gains it on its own the first time Multifus is opened by hand.
pub const FROM_SESSION_ARG: &str = "--from-session";

/// Opens the window, unless the session started Multifus and has somewhere to
/// put it away to.
///
/// **The system tray icon is a condition and not a detail.** If putting it up
/// failed, staying silent here would leave a running process with no window, no
/// menu and no way back, which is the very state
/// [`hide_rather_than_quit`] refuses to create. So a session start with no icon
/// opens the window like a launch by hand: being in the way is the worse of two
/// behaviours and by far the better of two failures.
pub fn show_on_launch(app: &AppHandle) {
    if launch() == Launch::Session && tray::is_present(app) {
        return;
    }

    show(app);
}

/// How Multifus was started, for the head of the journal.
///
/// Read from the arguments and not from whether the window is up, because the two
/// come apart: a session start with no system tray icon opens the window anyway,
/// and it is still a session start. `docs/macos.md` records that macOS reopens
/// applications by itself at login, without the argument and with the window,
/// which fakes the whole test; this is what makes the difference readable in the
/// journal instead of in `ps`.
#[must_use]
pub fn launch() -> Launch {
    if matches_session_launch(std::env::args()) {
        Launch::Session
    } else {
        Launch::ByHand
    }
}

/// Brings the window back when the Dock icon is clicked.
///
/// macOS only: `applicationShouldHandleReopen` has no equivalent on Windows,
/// where a window that has been put away is found again through the system tray,
/// which is where it was put away to.
#[cfg(target_os = "macos")]
pub fn show_on_dock_click(app: &AppHandle, event: RunEvent) {
    if matches!(event, RunEvent::Reopen { .. }) {
        show(app);
    }
}

#[cfg(not(target_os = "macos"))]
pub fn show_on_dock_click(_app: &AppHandle, _event: RunEvent) {}

/// Brings the window back, whether it was hidden or merely behind something.
pub fn show(app: &AppHandle) {
    // Nothing is written when there is no window under this label, and that is
    // not a swallowed failure: the window is declared in `tauri.conf.json` and
    // never destroyed, only hidden, so this branch is unreachable rather than
    // unlikely. A journal line here would describe a state that cannot exist.
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

/// Closing the window puts it away instead of ending Multifus.
///
/// The whole point of step 8: the window is a board one consults, and the
/// application goes on watching the roster and answering the shortcuts without
/// it. Quitting is the system tray's job.
///
/// **Unless there is no system tray icon.** If putting it up failed, hiding the
/// window here would leave a running process with no window, no menu and no way
/// back. In that case the close is let through and Multifus ends, which is the
/// worse of two behaviours and by far the better of two failures.
pub fn hide_rather_than_quit(window: &Window<Wry>, event: &WindowEvent) {
    let WindowEvent::CloseRequested { api, .. } = event else {
        return;
    };

    let app = window.app_handle();

    if !tray::is_present(app) {
        return;
    }

    api.prevent_close();

    // The close was refused and the hiding did not happen, so the window stays on
    // screen and will not go away however many times it is asked: the shape of a
    // frozen application. [`show`] has always written its own failure down and
    // this one was silent, which was an asymmetry and nothing more.
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
}
