//! The boundary between the business core and the operating system.
//!
//! Four interfaces, [`WindowManager`], [`NotificationWatcher`],
//! [`DisplayKeeper`] and [`PasteSender`], one implementation of each per system,
//! selected by `cfg`.
//!
//! The dependency runs one way only. This module uses the types of
//! [`crate::domain`], `domain` knows nothing of this module and calls nothing of
//! the system. The core stays pure and testable without a window.
//!
//! Two decisions were taken here with both systems in view, since designing this
//! boundary against a single one guarantees rewriting it at porting time. The
//! identity of a window is discussed on [`WindowId`], the shape of the listening
//! on [`NotificationSink`].

pub mod display;
pub mod error;
pub mod notification;
pub mod paste;
pub mod window;

#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(target_os = "windows")]
pub mod windows;

pub use display::DisplayKeeper;
pub use display::ScreenSaverDelay;
pub use error::PlatformError;
pub use error::Result;
pub use notification::NotificationReport;
pub use notification::NotificationSink;
pub use notification::NotificationWatcher;
pub use paste::PasteSender;
pub use window::GameWindow;
pub use window::WindowId;
pub use window::WindowManager;

/// Whether the system lets Multifus do its job.
///
/// Both systems gate the boundary behind a user authorization, Accessibility on
/// macOS and notification access on Windows, and both let it be revoked at any
/// time from the system settings. A refusal is an ordinary state to display, not
/// a failure to crash on.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Authorization {
    Granted,
    Denied,
}

impl Authorization {
    #[must_use]
    pub fn is_granted(self) -> bool {
        matches!(self, Self::Granted)
    }
}

/// The window manager of the system Multifus is running on.
#[cfg(target_os = "macos")]
pub type PlatformWindowManager = macos::AccessibilityWindowManager;
/// The window manager of the system Multifus is running on.
#[cfg(target_os = "windows")]
pub type PlatformWindowManager = windows::Win32WindowManager;

/// The notification watcher of the system Multifus is running on.
#[cfg(target_os = "macos")]
pub type PlatformNotificationWatcher = macos::BannerNotificationWatcher;
/// The notification watcher of the system Multifus is running on.
#[cfg(target_os = "windows")]
pub type PlatformNotificationWatcher = windows::UserNotificationWatcher;

/// The display keeper of the system Multifus is running on.
#[cfg(target_os = "macos")]
pub type PlatformDisplayKeeper = macos::PowerAssertionDisplayKeeper;
/// The display keeper of the system Multifus is running on.
#[cfg(target_os = "windows")]
pub type PlatformDisplayKeeper = windows::PowerRequestDisplayKeeper;

/// The paste sender of the system Multifus is running on.
#[cfg(target_os = "macos")]
pub type PlatformPasteSender = macos::CoreGraphicsPasteSender;
/// The paste sender of the system Multifus is running on.
#[cfg(target_os = "windows")]
pub type PlatformPasteSender = windows::SendInputPasteSender;
