//! Laying the paste combination on the system, fourth interface of the boundary.
//!
//! The one thing multifus writes towards the system instead of reading from it,
//! and the exception ADR 0012 opens in perimetre.md.

use crate::platform::error::Result;

/// Lays the paste combination of this system on the keyboard.
///
/// `Send + Sync` for the same reason as [`crate::platform::WindowManager`]: it
/// is called from the thread that answers the shortcuts.
pub trait PasteSender: Send + Sync {
    /// Presses and releases the paste combination towards the foreground window.
    ///
    /// The guard of perimetre.md belongs to the caller, which has already asked
    /// for the foreground game window.
    fn send_paste_combination(&self) -> Result<()>;
}
