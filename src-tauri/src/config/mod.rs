//! What Multifus remembers between two launches, and the file it lives in.
//!
//! Third module of the crate, named after the thing it owns: the configuration
//! file of perimetre.md, the only piece of Multifus that is neither pure logic
//! nor a system interface but durable state.
//!
//! It sits outside the other two on purpose. [`crate::domain`] is pure, it does
//! no input, no output and never sees Tauri; [`crate::platform`] is the boundary
//! with the system for windows and notifications, and for nothing else. Reading
//! and writing a JSON file belongs to neither, so it lives here.
//!
//! The dependency runs one way, as it does for `platform`: this module uses the
//! types of `domain`, `domain` knows nothing of it.
//!
//! What the file holds is described on [`Settings`], and what it deliberately
//! does not hold is the veille, see ADR 0004. That exclusion is enforced at the
//! type level, [`crate::domain::Character`] marks `asleep` and `online`
//! `#[serde(skip)]`, so no writer here can leak it by accident.

pub mod error;
pub mod settings;
pub mod store;

pub use error::ConfigError;
pub use error::Result;
pub use settings::AutoFocus;
pub use settings::QuickReply;
pub use settings::QuickReplyId;
pub use settings::Relay;
pub use settings::Settings;
pub use settings::Shortcut;
pub use settings::Shortcuts;
pub use store::ConfigStore;
pub use store::Loaded;
