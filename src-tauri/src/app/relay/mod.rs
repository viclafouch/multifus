//! The relay, step 11 of the plan: the private messages that reach a telephone
//! while nobody is at the machine.
//!
//! [`secret`] is the keychain the token lives in, ADR 0009. [`telegram`] is the
//! two calls, ADR 0007. [`pairing`] is the one moment a token enters multifus.
//! [`run`] is the relay itself: the switch, the sending, the avis of ADR 0010
//! and the display held awake.

pub mod links;
pub mod pairing;
pub mod run;
pub mod secret;
pub mod telegram;

pub use links::RelayLink;
pub use secret::BotToken;
pub use secret::SecretError;
