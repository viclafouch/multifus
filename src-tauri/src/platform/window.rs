//! Game windows as the core sees them, and the interface that produces them.

use crate::domain::extract_nickname;
use crate::platform::error::Result;
use crate::platform::Authorization;

/// The system's handle on a game window, opaque on purpose.
///
/// Design decision, window identity. The two systems do not name a window the
/// same way: macOS activates a *process* by its pid, one client being one
/// process, while Windows manipulates an *hwnd*. Exposing either one would leak
/// a system detail into the core and force the other platform to fake it. So the
/// boundary hands out a token instead. The core carries it from
/// [`WindowManager::game_windows`] back to [`WindowManager::focus`] without ever
/// reading it; only the implementation that minted it knows what the bits mean.
///
/// A `u64` holds both a macOS `pid_t`, which is an `i32`, and a 64-bit `HWND`,
/// which is a pointer-sized `isize`.
///
/// A value is only meaningful for the implementation that produced it, and only
/// as long as that window lives. It is never written to the configuration file,
/// which is why this type is deliberately not `Serialize`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct WindowId(u64);

impl WindowId {
    /// Wraps whatever the system uses to designate a window. Called by the
    /// platform implementations, by nobody else.
    #[must_use]
    pub fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    /// Unwraps the token, for the implementation that created it.
    #[must_use]
    pub fn raw(self) -> u64 {
        self.0
    }
}

/// A Dofus window currently on screen, and the character it belongs to.
///
/// The fields are private and [`GameWindow::from_title`] is the only way in, so
/// that a window can exist here only if its title yielded a nickname. That rule
/// is the type-level form of a known trap: a client sitting on the login screen
/// already is a process with windows, but with no usable title. Filtering
/// happens on the title, never on the size.
///
/// There is no z-order here, and no `AppUserModelID`. ADR 0003 removed every
/// reordering of the taskbar, so the boundary has nothing to say about how the
/// system displays these windows.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GameWindow {
    id: WindowId,
    nickname: String,
}

impl GameWindow {
    /// Reads a window title and keeps the window only when a Dofus client is
    /// behind it. `None` covers the login screen, the launcher, and anything
    /// else that is not a game window.
    #[must_use]
    pub fn from_title(id: WindowId, title: &str) -> Option<Self> {
        let nickname = extract_nickname(title)?;

        Some(Self {
            id,
            nickname: nickname.to_owned(),
        })
    }

    /// The token to hand back to [`WindowManager::focus`].
    #[must_use]
    pub fn id(&self) -> WindowId {
        self.id
    }

    /// The nickname of the character this window belongs to.
    #[must_use]
    pub fn nickname(&self) -> &str {
        &self.nickname
    }
}

/// Enumerates the game windows, focuses one, and tells whether the foreground
/// window is a Dofus one.
///
/// `Send + Sync` is required rather than incidental: the implementation lives in
/// the Tauri state and gets called from the global shortcut callbacks, which run
/// on threads Multifus does not choose. An implementation that needs the main
/// thread, as the macOS one will, hops there on its own.
pub trait WindowManager: Send + Sync {
    /// Whether the system already lets Multifus read window titles and change
    /// the focus, without prompting for anything.
    fn authorization(&self) -> Result<Authorization>;

    /// Asks the system for that authorization, which may show a system dialog.
    fn request_authorization(&self) -> Result<Authorization>;

    /// Every game window open right now, one per character connected.
    ///
    /// Clients on the login screen are left out, see [`GameWindow::from_title`].
    /// Returns [`PlatformError::AuthorizationDenied`] rather than an empty list
    /// when the authorization is missing, so that the caller can tell "nobody is
    /// connected" from "Multifus is not allowed to look".
    ///
    /// [`PlatformError::AuthorizationDenied`]: crate::platform::PlatformError::AuthorizationDenied
    fn game_windows(&self) -> Result<Vec<GameWindow>>;

    /// The game window in the foreground, or `None` when the frontmost window
    /// belongs to anything else.
    ///
    /// This is what keeps the four shortcuts inert outside the game, the guard
    /// perimetre.md asks for. It returns the window rather than a bare boolean
    /// because the veille shortcut acts on the character in the foreground, and
    /// two calls would leave room for the foreground to change in between.
    fn foreground_game_window(&self) -> Result<Option<GameWindow>>;

    /// Whether the user has put this window away in the Dock or the taskbar.
    ///
    /// Asked by the one caller that may decide not to act, the AutoFocus with
    /// its réveil des réduites switched off. The other two ways to a window, a
    /// shortcut and a click in the system tray, never ask: the user requested
    /// those, so they go through whatever the window's state.
    ///
    /// A window that has just been closed answers
    /// [`PlatformError::WindowGone`], exactly as [`WindowManager::focus`] does,
    /// so a caller that asks both handles one failure and not two.
    ///
    /// [`PlatformError::WindowGone`]: crate::platform::PlatformError::WindowGone
    fn is_minimized(&self, window: WindowId) -> Result<bool>;

    /// Brings a window to the front, out of the Dock or the taskbar if that is
    /// where it was.
    ///
    /// Restoring is part of focusing and not an option of it: a window left in
    /// the Dock has not been brought to the front, whatever the system reports.
    /// What is optional is *asking for* the focus at all, and that is
    /// [`WindowManager::is_minimized`]'s question.
    ///
    /// Returns [`PlatformError::WindowGone`] when the client has been closed
    /// since the window was enumerated.
    ///
    /// [`PlatformError::WindowGone`]: crate::platform::PlatformError::WindowGone
    fn focus(&self, window: WindowId) -> Result<()>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_window_exists_only_when_its_title_carries_a_nickname() {
        let window = GameWindow::from_title(WindowId::from_raw(42), "Alpha - Dofus Retro v1.48.21");

        let window = window.expect("a Dofus title makes a game window");
        assert_eq!(window.nickname(), "Alpha");
        assert_eq!(window.id(), WindowId::from_raw(42));
    }

    #[test]
    fn a_client_on_the_login_screen_is_not_a_game_window() {
        // It is a real process with real windows, but nothing in the title to
        // filter on. Size is never a criterion, the title is.
        assert_eq!(GameWindow::from_title(WindowId::from_raw(1), ""), None);
        assert_eq!(
            GameWindow::from_title(WindowId::from_raw(1), "Dofus Retro"),
            None
        );
        assert_eq!(
            GameWindow::from_title(WindowId::from_raw(1), "Ankama Launcher"),
            None
        );
    }
}
