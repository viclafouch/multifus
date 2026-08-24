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
pub type NotificationSink = Box<dyn Fn(NotificationReport) + Send + 'static>;

/// What a watcher has to say when something was notified.
///
/// Two variants and not one, and the second is the whole reason this type exists
/// rather than a bare [`GameNotification`]. macOS reads its notifications by
/// walking the element the system drew, see ADR 0002, and that walk can be
/// refused halfway: an authorization taken away in the second the banner
/// appeared, an element that goes before it is read. A refusal used to produce
/// nothing at all, so the journal stayed empty, and an empty journal already
/// meant something else entirely, that no banner had been drawn. Those are
/// opposite diagnoses and they looked identical.
///
/// Windows never sends the second: `UserNotificationListener` hands over a
/// structured toast, which is either there or not.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NotificationReport {
    /// A game notification, for the core to decide about.
    Heard(GameNotification),

    /// Something was notified and the system would not let Multifus read it.
    ///
    /// Only ever sent when a read was actually refused. The ordinary case, an
    /// element that is simply not a game notification, is dropped by the
    /// implementation and never reaches here: on macOS the observer fires for
    /// everything the notification centre builds, and reporting all of it would
    /// bury the journal it is meant to fill.
    Unreadable { detail: String },
}

/// Starts listening to the system notifications and reports the game ones.
///
/// `Send + Sync` for the same reason as [`WindowManager`]: the watcher lives in
/// the Tauri state, shared with the shortcut handlers and the interface.
///
/// [`WindowManager`]: crate::platform::WindowManager
pub trait NotificationWatcher: Send + Sync {
    /// Whether the system already lets Multifus read notifications, without
    /// prompting for anything.
    fn authorization(&self) -> Result<Authorization>;

    /// Asks the system for that authorization, which may show a system dialog.
    fn request_authorization(&self) -> Result<Authorization>;

    /// Starts the listening. Every notification whose title carries a nickname
    /// goes to `sink` as a [`NotificationReport::Heard`]; everything else is
    /// dropped by the implementation and never reaches the core, except a read
    /// the system refused, which goes as [`NotificationReport::Unreadable`].
    ///
    /// The body is passed through untouched. Reading a kind out of it is the
    /// core's job, [`classify`] does it, and nothing keeps it afterwards: see the
    /// note on privacy at the top of [`crate::app::journal`].
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
    /// Only Windows can do this, see ADR 0002. macOS has no public
    /// API for it, and its implementation will do nothing and return `Ok`
    /// rather than an error, so that the caller stays free of any `cfg`.
    fn dismiss(&self, nickname: &str) -> Result<()>;
}
