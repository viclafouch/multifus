//! A character known to Multifus, and the gender used by the swap.

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

/// What `relayed` reads as in a file written before the field existed. A bare
/// `#[serde(default)]` would hand back `false` and silence everybody, ADR 0011.
fn relayed_by_default() -> bool {
    true
}

/// A Dofus character, identified by its nickname.
///
/// It enters the roster as soon as a window bears its nickname and only leaves
/// it on manual removal.
///
/// Two fields never reach the configuration file. `online` describes the world
/// as it is right now, and `asleep` is reset on every launch, see ADR 0004. No
/// `#[serde(default)]` on the struct: a field without a default fails the load.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Character {
    /// The name read in the window title. Identity of the character, no two
    /// characters share one.
    pub nickname: String,
    /// Assigned by hand, so unknown until the user says otherwise.
    pub gender: Option<Gender>,
    /// Whether the relay carries this character's private messages. Kept
    /// indefinitely like the gender, ticked on entering the roster, ADR 0011.
    #[serde(default = "relayed_by_default")]
    pub relayed: bool,
    /// Removed from the cycle. AutoFocus still applies to an asleep character,
    /// and so does the relay: the two are unrelated.
    #[serde(skip)]
    pub asleep: bool,
    /// A window currently bears this nickname.
    #[serde(skip)]
    pub online: bool,
}

impl Character {
    /// A character discovered from a window title: online, awake, relayed, no
    /// gender yet.
    #[must_use]
    pub fn new(nickname: impl Into<String>) -> Self {
        Self {
            nickname: nickname.into(),
            gender: None,
            relayed: true,
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

    /// Same character taken out of the relay, the mule whose private messages
    /// call for no answer.
    #[must_use]
    pub fn not_relayed(mut self) -> Self {
        self.relayed = false;
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

    /// Whether the relay still has something to hear from this character. What
    /// the display awake follows, so a disconnected one lets the machine sleep.
    #[must_use]
    pub fn is_relayed_online(&self) -> bool {
        self.relayed && self.online
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_character_enters_the_roster_relayed() {
        assert!(Character::new("Alpha").relayed);
        assert!(!Character::new("Alpha").not_relayed().relayed);
    }

    #[test]
    fn a_character_written_before_the_relay_existed_is_relayed() {
        // Written as bytes on purpose: built from `Character` it would carry
        // today's fields and prove nothing about yesterday's file.
        let stored = r#"{"nickname":"Alpha","gender":"male"}"#;

        let character = serde_json::from_str::<Character>(stored)
            .expect("a character from an earlier version still loads");

        assert!(character.relayed);
        assert_eq!(character.gender, Some(Gender::Male));
    }

    #[test]
    fn the_relay_ignores_whether_a_character_is_asleep() {
        let asleep = Character::new("Alpha").asleep();

        assert!(asleep.is_relayed_online());
        assert!(!asleep.is_in_cycle());
    }

    #[test]
    fn a_disconnected_character_leaves_the_relay_nothing_to_hear() {
        assert!(!Character::new("Alpha").offline().is_relayed_online());
        assert!(!Character::new("Alpha").not_relayed().is_relayed_online());
    }
}
