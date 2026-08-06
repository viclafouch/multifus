//! The relay, step 11 of the plan: the private messages that reach a telephone
//! while nobody is at the machine.
//!
//! [`secret`] is the keychain the token lives in, ADR 0009. [`telegram`] is the
//! two calls, ADR 0007. [`pairing`] is the one moment a token enters multifus.
//!
//! What is not here yet is step 11b-2: the switch in the system tray, the
//! sending of a private message, the notices of ADR 0010 and the display held
//! awake. This module knows how to be set up, not yet how to run.

pub mod links;
pub mod pairing;
pub mod secret;
pub mod telegram;

pub use links::RelayLink;
pub use secret::BotToken;
pub use secret::SecretError;
