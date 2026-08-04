//! Listening to the game notifications of the system.

use crate::domain::GameNotification;
use crate::platform::error::Result;
use crate::platform::Authorization;

/// Where a watcher hands the game notifications it hears.
///
/// Design decision, the shape of the listening. The two sources push, and they
/// push in the same way: macOS fires an `AXObserver` callback when the banner
/// appears, Windows raises a WinRT event on its listener. A callback therefore
/// fits both without an adapter, and it lets each implementation keep its own
/// thread and its own run loop to itself.
///
/// A channel was the alternative. It was dropped because it moves the burden to
/// the wrong side: the core would have to own a thread parked on `recv`, or
/// would drift into `try_recv` on a timer, which is the polling this boundary
/// exists to avoid. The reverse adaptation costs nothing, a caller who wants a
/// channel passes a closure that sends into it. Windows may well have to poll
/// its listener internally, since the WinRT event needs a packaged identity;
/// that stays its business and never reaches the core.
///
/// The sink runs on the watcher's thread, whichever that is, so it must not
/// block. `focus` is a short call, and anything longer belongs on another thread.
pub type NotificationSink = Box<dyn Fn(GameNotification) + Send + 'static>;

/// Starts listening to the system notifications and reports the game ones.
///
/// `Send + Sync` for the same reason as [`WindowManager`]: the watcher lives in
/// the Tauri state, shared with the shortcut handlers and the interface.
///
/// [`WindowManager`]: crate::platform::WindowManager
pub trait NotificationWatcher: Send + Sync {
    /// Whether the system already lets multifus read notifications, without
    /// prompting for anything.
    fn authorization(&self) -> Result<Authorization>;

    /// Asks the system for that authorization, which may show a system dialog.
    fn request_authorization(&self) -> Result<Authorization>;

    /// Starts the listening. Every notification whose title carries a nickname
    /// goes to `sink` as a [`GameNotification`]; everything else is dropped by
    /// the implementation and never reaches the core.
    ///
    /// The body is passed through untouched. Reading a kind out of it is the
    /// core's job, [`classify`] does it.
    ///
    /// [`classify`]: crate::domain::classify
    fn start(&mut self, sink: NotificationSink) -> Result<()>;

    /// Stops the listening. Calling it on a watcher that is not listening is not
    /// an error. An implementation drops its listener here and in `Drop`, so no
    /// observer survives the application.
    fn stop(&mut self) -> Result<()>;

    /// Dismisses the notifications already on screen for a character, once its
    /// window has been focused and they have served their purpose.
    ///
    /// Only Windows can do this, see ADR 0002 and step 9. macOS has no public
    /// API for it, and its implementation will do nothing and return `Ok`
    /// rather than an error, so that the caller stays free of any `cfg`.
    fn dismiss(&self, nickname: &str) -> Result<()>;
}
