//! Keeping the display awake, third interface of the boundary: a locked session
//! draws no banner and silences the relay, see ADR 0002 and CONTEXT.md.

use std::time::Duration;

use crate::platform::error::Result;

/// How long this machine waits before it starts its screen saver. Read because
/// the hold does not cover it, and a screen saver locks the session.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScreenSaverDelay {
    /// The screen saver never starts on its own. Nothing to warn about.
    Never,
    /// It starts after this long, and the session locks with it.
    After(Duration),
    /// The system said nothing, which is what an untouched setting looks like.
    /// Not a failure, and not a promise either.
    Unknown,
}

/// Holds the display awake as long as the relay has something to hear, which is
/// the connected relayed characters and not the switch.
pub trait DisplayKeeper: Send + Sync {
    /// Asks the system to keep the display on and the session unlocked. Raising
    /// a hold that is already up is a success that does nothing.
    fn keep_awake(&mut self) -> Result<()>;

    /// Lets the machine go to sleep again, which is what the last relayed
    /// character disconnecting means. Idempotent, like [`DisplayKeeper::keep_awake`].
    fn release(&mut self) -> Result<()>;

    /// Whether the hold is up right now. What the journal writes down.
    fn is_awake(&self) -> bool;

    /// What the screen saver of this machine is set to. Asked when the relay is
    /// switched on, and shown when the answer is not [`ScreenSaverDelay::Never`].
    fn screen_saver_delay(&self) -> Result<ScreenSaverDelay>;
}
