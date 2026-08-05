//! The relay, step 11 of the plan. Only [`secret`] so far, the keychain
//! everything else waits on; the screen, the pairing and the sending come next.

pub mod secret;

pub use secret::BotToken;
pub use secret::SecretError;
