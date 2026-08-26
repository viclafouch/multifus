pub mod click;
pub mod display;
pub mod error;
pub mod notification;
pub mod paste;
pub mod window;

#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(target_os = "windows")]
pub mod windows;

pub use click::ClickGate;
pub use click::ClickReport;
pub use click::ClickSink;
pub use click::ClickWatcher;
pub use click::SWITCH_BUDGET_MS;
pub use click::SWITCH_CEILING;
pub use click::SWITCH_CEILING_MS;
pub use click::WATCHES_CLICKS;
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

#[cfg(target_os = "macos")]
pub type PlatformWindowManager = macos::AccessibilityWindowManager;
#[cfg(target_os = "windows")]
pub type PlatformWindowManager = windows::Win32WindowManager;

#[cfg(target_os = "macos")]
pub type PlatformNotificationWatcher = macos::BannerNotificationWatcher;
#[cfg(target_os = "windows")]
pub type PlatformNotificationWatcher = windows::UserNotificationWatcher;

#[cfg(target_os = "macos")]
pub type PlatformDisplayKeeper = macos::PowerAssertionDisplayKeeper;
#[cfg(target_os = "windows")]
pub type PlatformDisplayKeeper = windows::PowerRequestDisplayKeeper;

#[cfg(target_os = "macos")]
pub type PlatformPasteSender = macos::CoreGraphicsPasteSender;
#[cfg(target_os = "windows")]
pub type PlatformPasteSender = windows::SendInputPasteSender;

#[cfg(target_os = "macos")]
pub type PlatformClickWatcher = macos::UnwatchedClicks;
#[cfg(target_os = "windows")]
pub type PlatformClickWatcher = windows::MouseHookClickWatcher;
