//! The macOS side of the boundary.
//!
//! Empty at this step. Every method returns
//! [`PlatformError::NotImplemented`], the bodies land at step 4 of the plan and
//! no `objc2` crate is pulled in before then. What matters here is that the
//! signatures already fit what the two systems will have to do.
//!
//! The route is settled. Windows and their titles come from the Accessibility
//! API, `AXTitle` on the main window of the processes whose bundle is
//! `com.dofus.d1elauncher`, and focus activates a process by its pid, one client
//! being one process. Notifications come from an `AXObserver` posted on
//! `com.apple.notificationcenterui`, whose banner text carries the title and the
//! body, see ADR 0002. Both need the same and only authorization, Accessibility.

use crate::platform::error::PlatformError;
use crate::platform::error::Result;
use crate::platform::notification::NotificationSink;
use crate::platform::notification::NotificationWatcher;
use crate::platform::window::GameWindow;
use crate::platform::window::WindowId;
use crate::platform::window::WindowManager;
use crate::platform::Authorization;

/// Reads windows and changes focus through the macOS Accessibility API.
///
/// A [`WindowId`] here carries the pid of the client process.
#[derive(Debug, Default)]
pub struct AccessibilityWindowManager;

impl AccessibilityWindowManager {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl WindowManager for AccessibilityWindowManager {
    fn authorization(&self) -> Result<Authorization> {
        // `AXIsProcessTrustedWithOptions` with the prompt option turned off.
        Err(PlatformError::not_implemented(
            "AccessibilityWindowManager::authorization",
        ))
    }

    fn request_authorization(&self) -> Result<Authorization> {
        // Same call with the prompt option turned on. macOS then opens its
        // settings pane, and grants nothing before the user acts, so the answer
        // is very often `Denied` right after asking.
        Err(PlatformError::not_implemented(
            "AccessibilityWindowManager::request_authorization",
        ))
    }

    fn game_windows(&self) -> Result<Vec<GameWindow>> {
        Err(PlatformError::not_implemented(
            "AccessibilityWindowManager::game_windows",
        ))
    }

    fn foreground_game_window(&self) -> Result<Option<GameWindow>> {
        Err(PlatformError::not_implemented(
            "AccessibilityWindowManager::foreground_game_window",
        ))
    }

    fn focus(&self, _window: WindowId) -> Result<()> {
        Err(PlatformError::not_implemented(
            "AccessibilityWindowManager::focus",
        ))
    }
}

/// Hears game notifications by reading the banner the system draws, the only
/// route fast enough on macOS, see ADR 0002.
#[derive(Debug, Default)]
pub struct BannerNotificationWatcher;

impl BannerNotificationWatcher {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl NotificationWatcher for BannerNotificationWatcher {
    fn authorization(&self) -> Result<Authorization> {
        // The same Accessibility trust as the window manager: one authorization
        // for the whole application on this system.
        Err(PlatformError::not_implemented(
            "BannerNotificationWatcher::authorization",
        ))
    }

    fn request_authorization(&self) -> Result<Authorization> {
        Err(PlatformError::not_implemented(
            "BannerNotificationWatcher::request_authorization",
        ))
    }

    fn start(&mut self, _sink: NotificationSink) -> Result<()> {
        Err(PlatformError::not_implemented(
            "BannerNotificationWatcher::start",
        ))
    }

    fn stop(&mut self) -> Result<()> {
        Err(PlatformError::not_implemented(
            "BannerNotificationWatcher::stop",
        ))
    }

    fn dismiss(&self, _nickname: &str) -> Result<()> {
        // Becomes `Ok(())`, doing nothing, at step 4. macOS has no public API to
        // take a banner off the screen, and the caller must not have to know it.
        Err(PlatformError::not_implemented(
            "BannerNotificationWatcher::dismiss",
        ))
    }
}
