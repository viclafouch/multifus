use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Gender {
    Male,
    Female,
}

impl Gender {
    #[must_use]
    pub fn other(self) -> Self {
        match self {
            Self::Male => Self::Female,
            Self::Female => Self::Male,
        }
    }
}

fn relayed_by_default() -> bool {
    true
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Character {
    pub nickname: String,
    pub gender: Option<Gender>,
    #[serde(default = "relayed_by_default")]
    pub relayed: bool,
    #[serde(skip)]
    pub asleep: bool,
    #[serde(skip)]
    pub online: bool,
}

impl Character {
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

    #[must_use]
    pub fn with_gender(mut self, gender: Gender) -> Self {
        self.gender = Some(gender);
        self
    }

    #[must_use]
    pub fn not_relayed(mut self) -> Self {
        self.relayed = false;
        self
    }

    #[must_use]
    pub fn asleep(mut self) -> Self {
        self.asleep = true;
        self
    }

    #[must_use]
    pub fn offline(mut self) -> Self {
        self.online = false;
        self
    }

    #[must_use]
    pub fn is_in_cycle(&self) -> bool {
        self.online && !self.asleep
    }

    #[must_use]
    pub fn is_sleepable(&self) -> bool {
        self.online
    }

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
