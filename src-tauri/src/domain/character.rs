//! A character known to multifus, and the gender used by the swap.

use serde::Deserialize;
use serde::Serialize;

/// Gender of a character, male or female.
///
/// Assigned by hand and kept indefinitely. It exists so that a whole gender can
/// be put asleep while the other one is woken up, see [`Roster::swap`].
///
/// [`Roster::swap`]: crate::domain::Roster::swap
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Gender {
    Male,
    Female,
}

impl Gender {
    /// The other gender, the one a swap wakes up when this one goes to sleep.
    #[must_use]
    pub fn other(self) -> Self {
        match self {
            Self::Male => Self::Female,
            Self::Female => Self::Male,
        }
    }
}

/// A Dofus character, identified by its nickname.
///
/// It enters the roster as soon as a window bears its nickname and only leaves
/// it on manual removal.
///
/// Two fields never reach the configuration file. `online` describes the world
/// as it is right now, and `asleep` is reset on every launch, see ADR 0004.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Character {
    /// The name read in the window title. Identity of the character, no two
    /// characters share one.
    pub nickname: String,
    /// Assigned by hand, so unknown until the user says otherwise.
    pub gender: Option<Gender>,
    /// Removed from the cycle. AutoFocus still applies to an asleep character.
    #[serde(skip)]
    pub asleep: bool,
    /// A window currently bears this nickname.
    #[serde(skip)]
    pub online: bool,
}

impl Character {
    /// A character discovered from a window title: online, awake, no gender yet.
    #[must_use]
    pub fn new(nickname: impl Into<String>) -> Self {
        Self {
            nickname: nickname.into(),
            gender: None,
            asleep: false,
            online: true,
        }
    }

    /// Same character with its gender assigned.
    #[must_use]
    pub fn with_gender(mut self, gender: Gender) -> Self {
        self.gender = Some(gender);
        self
    }

    /// Same character marked asleep.
    #[must_use]
    pub fn asleep(mut self) -> Self {
        self.asleep = true;
        self
    }

    /// Same character marked offline, its window does not exist any more.
    #[must_use]
    pub fn offline(mut self) -> Self {
        self.online = false;
        self
    }

    /// Whether the cycle stops on this character.
    ///
    /// An offline character has no window to focus, an asleep one has been
    /// taken out of the cycle on purpose.
    #[must_use]
    pub fn is_in_cycle(&self) -> bool {
        self.online && !self.asleep
    }

    /// Whether the veille can be toggled on this character. An offline
    /// character is neither focusable nor sleepable.
    #[must_use]
    pub fn is_sleepable(&self) -> bool {
        self.online
    }
}
