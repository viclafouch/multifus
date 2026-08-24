//! The business core of Multifus: roster, cycle, veille, swap, notifications.
//!
//! Everything here is pure. No system call, no Tauri, no platform crate. The
//! module compiles and is tested on its own.

pub mod character;
pub mod notification;
pub mod roster;

pub use character::Character;
pub use character::Gender;
pub use notification::classify;
pub use notification::extract_nickname;
pub use notification::GameNotification;
pub use notification::NotificationKind;
pub use roster::Roster;
