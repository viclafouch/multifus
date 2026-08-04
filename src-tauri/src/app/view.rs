//! What React is given, and what it is allowed to ask for.
//!
//! One shape crosses to the interface, [`Snapshot`], and every command returns
//! it. There is no query for one character, no query for the shortcuts alone:
//! the whole dashboard is a handful of characters and eleven settings, so
//! sending all of it costs nothing and removes an entire class of bug where two
//! parts of the screen disagree about what is on disk.
//!
//! The types here are views and not the stored ones. [`crate::config::AutoFocus`]
//! is seven named booleans, which is right for a file and wrong for a screen that
//! draws the same row seven times; here it becomes a list keyed by
//! [`NotificationKind`], and the interface iterates. The same goes for the four
//! shortcuts.
//!
//! No text for the user crosses here. A path does, and a system error detail
//! does, because those are not sentences multifus writes but facts it passes on.

use serde::Deserialize;
use serde::Serialize;

use crate::app::journal::JournalEntry;
use crate::domain::Gender;
use crate::domain::NotificationKind;

/// Everything the four screens draw, in one piece.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    /// The version of the bundle, the one the changelog talks about.
    pub version: String,
    /// The roster, in cycle order.
    pub characters: Vec<CharacterView>,
    /// The four combinations, in the order of the table of perimetre.md.
    pub shortcuts: Vec<ShortcutView>,
    /// The seven switches, in the order of the notification table.
    pub auto_focus: Vec<AutoFocusView>,
    pub authorization: AuthorizationView,
    pub config: ConfigView,
    pub journal: Vec<JournalEntry>,
}

/// One line of the roster.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterView {
    pub nickname: String,
    /// `null` until the user assigns one, which is what the two grouped actions
    /// need before they can do anything.
    pub gender: Option<Gender>,
    pub asleep: bool,
    /// A window bears this nickname right now.
    pub online: bool,
}

/// One of the four actions a combination can be bound to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ShortcutAction {
    Next,
    Previous,
    ToggleAsleep,
    Swap,
}

impl ShortcutAction {
    /// The four of them, in the order of the table of perimetre.md.
    pub const ALL: [Self; 4] = [Self::Next, Self::Previous, Self::ToggleAsleep, Self::Swap];
}

/// One row of the shortcuts screen.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutView {
    pub action: ShortcutAction,
    /// The combination as the plugin of step 7 reads it, `null` for an action
    /// the user has cleared. Nothing here interprets it.
    pub accelerator: Option<String>,
}

/// One row of the AutoFocus screen.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoFocusView {
    pub kind: NotificationKind,
    pub enabled: bool,
}

/// Whether the system lets multifus work, and whether it is working.
///
/// Two booleans and not one. On macOS both hang on Accessibility, but being
/// allowed to listen and actually listening are different states, and the day
/// AutoFocus does not fire the difference is the first thing to look at.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorizationView {
    /// The system authorization is granted: Accessibility on macOS.
    pub granted: bool,
    /// The notification listening is running right now.
    pub listening: bool,
}

/// Where the configuration lives and what reading or writing it cost.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigView {
    /// The file `app_config_dir` named, shown so that the user can go and look.
    pub path: String,
    /// `null` when the configuration on screen is the one on disk.
    pub problem: Option<ConfigProblem>,
}

/// Why the configuration on screen is not the one on disk.
///
/// This exists so that the interface can say it. A roster that comes back empty
/// with no explanation is the failure mode this whole type is here to prevent.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ConfigProblem {
    /// The file is there and could not be read at all, a refused permission for
    /// instance. Nothing was moved: the bytes may well be perfectly good.
    Unreadable { detail: String },

    /// The bytes were read and are not a configuration. The file was set aside
    /// rather than overwritten, and `quarantined` says where it went.
    Malformed {
        detail: String,
        quarantined: Option<String>,
    },

    /// The last save did not go through. What is on screen is right, what is on
    /// disk is behind.
    NotSaved { detail: String },
}
