//! The Windows side of the boundary.
//!
//! Empty at this step, exactly like the `macos` module. Every method returns
//! [`PlatformError::NotImplemented`], the bodies land at step 9 and no `windows`
//! crate is pulled in before then. This module exists now so that the signatures
//! are proven to fit Windows before macOS is written against them, and it is
//! kept compiling by `cargo check --target x86_64-pc-windows-msvc`.
//!
//! The route is known from Dracoon. Windows and their titles come from
//! `EnumWindows` and `GetWindowText`, focus goes through `SetForegroundWindow`
//! preceded by `AttachThreadInput`, never by injecting an Alt keystroke into the
//! active application. Notifications come from the WinRT
//! `UserNotificationListener`, which also lets a toast be removed once its window
//! has been focused.

use crate::platform::display::DisplayKeeper;
use crate::platform::display::ScreenSaverDelay;
use crate::platform::error::PlatformError;
use crate::platform::error::Result;
use crate::platform::notification::NotificationSink;
use crate::platform::notification::NotificationWatcher;
use crate::platform::window::GameWindow;
use crate::platform::window::WindowId;
use crate::platform::window::WindowManager;
use crate::platform::Authorization;

/// Reads windows and changes focus through the Win32 window API.
///
/// A [`WindowId`] here carries an `HWND`, and a client can own several windows,
/// unlike macOS where one process is one client. Only the ones whose title
/// yields a nickname become a [`GameWindow`], which settles the difference.
#[derive(Debug, Default)]
pub struct Win32WindowManager;

impl Win32WindowManager {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl WindowManager for Win32WindowManager {
    fn authorization(&self) -> Result<Authorization> {
        // Enumerating windows and focusing them needs no authorization on
        // Windows, so this becomes a plain `Granted` at step 9. The method stays
        // on the interface because macOS does need one.
        Err(PlatformError::not_implemented(
            "Win32WindowManager::authorization",
        ))
    }

    fn request_authorization(&self) -> Result<Authorization> {
        Err(PlatformError::not_implemented(
            "Win32WindowManager::request_authorization",
        ))
    }

    fn game_windows(&self) -> Result<Vec<GameWindow>> {
        Err(PlatformError::not_implemented(
            "Win32WindowManager::game_windows",
        ))
    }

    fn foreground_game_window(&self) -> Result<Option<GameWindow>> {
        Err(PlatformError::not_implemented(
            "Win32WindowManager::foreground_game_window",
        ))
    }

    fn is_minimized(&self, _window: WindowId) -> Result<bool> {
        // `IsIconic`, one call and no authorization.
        Err(PlatformError::not_implemented(
            "Win32WindowManager::is_minimized",
        ))
    }

    fn focus(&self, _window: WindowId) -> Result<()> {
        // `ShowWindow` with `SW_RESTORE` before the `AttachThreadInput` dance,
        // since a window left iconic is a window nobody sees.
        Err(PlatformError::not_implemented("Win32WindowManager::focus"))
    }
}

/// Hears game notifications through the WinRT `UserNotificationListener`, the
/// official route, independent of whether banners are displayed.
#[derive(Debug, Default)]
pub struct UserNotificationWatcher;

impl UserNotificationWatcher {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl NotificationWatcher for UserNotificationWatcher {
    fn authorization(&self) -> Result<Authorization> {
        // `UserNotificationListener::GetAccessStatus`, the notification access
        // the user grants in the system settings.
        Err(PlatformError::not_implemented(
            "UserNotificationWatcher::authorization",
        ))
    }

    fn request_authorization(&self) -> Result<Authorization> {
        // `RequestAccessAsync`, awaited on the spot.
        Err(PlatformError::not_implemented(
            "UserNotificationWatcher::request_authorization",
        ))
    }

    fn start(&mut self, _sink: NotificationSink) -> Result<()> {
        Err(PlatformError::not_implemented(
            "UserNotificationWatcher::start",
        ))
    }

    fn stop(&mut self) -> Result<()> {
        Err(PlatformError::not_implemented(
            "UserNotificationWatcher::stop",
        ))
    }

    fn dismiss(&self, _nickname: &str) -> Result<()> {
        // The one thing Windows can do and macOS cannot: clearing the toasts of
        // a character once its window is in front.
        Err(PlatformError::not_implemented(
            "UserNotificationWatcher::dismiss",
        ))
    }
}

/// Keeps the display awake through `SetThreadExecutionState`. Empty until step 9,
/// and what a sleeping machine costs here is the clients, not the banners.
#[derive(Debug, Default)]
pub struct ExecutionStateDisplayKeeper;

impl ExecutionStateDisplayKeeper {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl DisplayKeeper for ExecutionStateDisplayKeeper {
    fn keep_awake(&mut self) -> Result<()> {
        // `ES_CONTINUOUS | ES_DISPLAY_REQUIRED | ES_SYSTEM_REQUIRED`, on the
        // calling thread, so the hold and its release share one.
        Err(PlatformError::not_implemented(
            "ExecutionStateDisplayKeeper::keep_awake",
        ))
    }

    fn release(&mut self) -> Result<()> {
        // `ES_CONTINUOUS` on its own, which is how the flags above are dropped.
        Err(PlatformError::not_implemented(
            "ExecutionStateDisplayKeeper::release",
        ))
    }

    fn is_awake(&self) -> bool {
        // No token to keep, unlike the macOS assertion: the state belongs to the
        // thread, so step 9 stores a plain boolean.
        false
    }

    fn screen_saver_delay(&self) -> Result<ScreenSaverDelay> {
        // `SystemParametersInfo`, `SPI_GETSCREENSAVEACTIVE` then
        // `SPI_GETSCREENSAVETIMEOUT`, the first telling `Never` from a delay.
        Err(PlatformError::not_implemented(
            "ExecutionStateDisplayKeeper::screen_saver_delay",
        ))
    }
}
