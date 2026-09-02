use serde::Deserialize;
use serde::Serialize;

use super::shortcut::Shortcut;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Gender {
    Male,
    Female,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Class {
    Feca,
    Osamodas,
    Enutrof,
    Sram,
    Xelor,
    Ecaflip,
    Eniripsa,
    Iop,
    Cra,
    Sadida,
    Sacrieur,
    Pandawa,
}

impl Class {
    pub const ALL: [Self; 12] = [
        Self::Feca,
        Self::Osamodas,
        Self::Enutrof,
        Self::Sram,
        Self::Xelor,
        Self::Ecaflip,
        Self::Eniripsa,
        Self::Iop,
        Self::Cra,
        Self::Sadida,
        Self::Sacrieur,
        Self::Pandawa,
    ];
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Color {
    Red,
    Orange,
    Earth,
    Yellow,
    Green,
    Pine,
    Turquoise,
    Sky,
    Blue,
    Lavender,
    Violet,
    Pink,
}

impl Color {
    pub const ALL: [Self; 12] = [
        Self::Red,
        Self::Orange,
        Self::Earth,
        Self::Yellow,
        Self::Green,
        Self::Pine,
        Self::Turquoise,
        Self::Sky,
        Self::Blue,
        Self::Lavender,
        Self::Violet,
        Self::Pink,
    ];

    #[must_use]
    pub fn rgb(self) -> [u8; 3] {
        match self {
            Self::Red => [228, 35, 102],
            Self::Orange => [251, 94, 0],
            Self::Earth => [170, 82, 34],
            Self::Yellow => [231, 232, 0],
            Self::Green => [12, 163, 0],
            Self::Pine => [0, 124, 90],
            Self::Turquoise => [0, 166, 176],
            Self::Sky => [33, 209, 255],
            Self::Blue => [17, 99, 255],
            Self::Lavender => [177, 126, 255],
            Self::Violet => [193, 0, 226],
            Self::Pink => [255, 108, 202],
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Portrait {
    pub class: Class,
    pub gender: Gender,
}

fn relayed_by_default() -> bool {
    true
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Character {
    pub nickname: String,
    pub gender: Option<Gender>,
    #[serde(default)]
    pub class: Option<Class>,
    #[serde(default)]
    pub color: Option<Color>,
    #[serde(default)]
    pub main: bool,
    #[serde(default)]
    pub shortcut: Option<Shortcut>,
    #[serde(default = "relayed_by_default")]
    pub relayed: bool,
    #[serde(skip)]
    pub excluded: bool,
    #[serde(skip)]
    pub online: bool,
}

impl Character {
    #[must_use]
    pub fn new(nickname: impl Into<String>) -> Self {
        Self {
            nickname: nickname.into(),
            gender: None,
            class: None,
            color: None,
            main: false,
            shortcut: None,
            relayed: true,
            excluded: false,
            online: true,
        }
    }

    #[must_use]
    pub fn with_gender(mut self, gender: Gender) -> Self {
        self.gender = Some(gender);
        self
    }

    #[must_use]
    pub fn with_class(mut self, class: Class) -> Self {
        self.class = Some(class);
        self
    }

    #[must_use]
    pub fn with_color(mut self, color: Color) -> Self {
        self.color = Some(color);
        self
    }

    #[must_use]
    pub fn not_relayed(mut self) -> Self {
        self.relayed = false;
        self
    }

    #[must_use]
    pub fn excluded(mut self) -> Self {
        self.excluded = true;
        self
    }

    #[must_use]
    pub fn main(mut self) -> Self {
        self.main = true;
        self
    }

    #[must_use]
    pub fn offline(mut self) -> Self {
        self.online = false;
        self
    }

    #[must_use]
    pub fn portrait(&self) -> Option<Portrait> {
        Some(Portrait {
            class: self.class?,
            gender: self.gender?,
        })
    }

    #[must_use]
    pub fn is_in_cycle(&self) -> bool {
        self.online && !self.excluded
    }

    #[must_use]
    pub fn is_excludable(&self) -> bool {
        self.online
    }

    #[must_use]
    pub fn is_excluded(&self) -> bool {
        self.excluded
    }

    #[must_use]
    pub fn is_main(&self) -> bool {
        self.main
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
    fn a_character_written_before_the_classes_existed_has_none() {
        let stored = r#"{"nickname":"Alpha","gender":"female","relayed":true}"#;

        let character = serde_json::from_str::<Character>(stored)
            .expect("a character from an earlier version still loads");

        assert_eq!(character.class, None);
        assert_eq!(character.gender, Some(Gender::Female));
    }

    #[test]
    fn a_class_travels_to_the_file_in_lowercase() {
        let character = Character::new("Alpha")
            .with_gender(Gender::Male)
            .with_class(Class::Cra);

        let json = serde_json::to_string(&character).expect("a character serialises");

        assert!(json.contains(r#""class":"cra""#), "{json}");
        assert_eq!(
            serde_json::from_str::<Character>(&json)
                .expect("a character reads back")
                .class,
            Some(Class::Cra)
        );
    }

    #[test]
    fn a_portrait_takes_a_class_and_a_sex_or_it_does_not_exist() {
        let both = Character::new("Alpha")
            .with_gender(Gender::Male)
            .with_class(Class::Iop);

        assert_eq!(
            both.portrait(),
            Some(Portrait {
                class: Class::Iop,
                gender: Gender::Male
            })
        );
        assert_eq!(
            Character::new("Alpha").with_class(Class::Iop).portrait(),
            None
        );
        assert_eq!(
            Character::new("Alpha").with_gender(Gender::Male).portrait(),
            None
        );
        assert_eq!(Character::new("Alpha").portrait(), None);
    }

    #[test]
    fn the_twelve_classes_are_listed_in_the_order_of_the_creation_screen() {
        assert_eq!(Class::ALL.len(), 12);
        assert_eq!(Class::ALL.first(), Some(&Class::Feca));
        assert_eq!(Class::ALL.last(), Some(&Class::Pandawa));
    }

    #[test]
    fn nobody_carries_a_colour_until_one_is_given_to_him() {
        assert_eq!(Character::new("Alpha").color, None);
        assert_eq!(
            Character::new("Alpha").with_color(Color::Sky).color,
            Some(Color::Sky)
        );
    }

    #[test]
    fn a_colour_travels_to_the_file_in_lowercase_and_comes_back() {
        let character = Character::new("Alpha").with_color(Color::Turquoise);

        let json = serde_json::to_string(&character).expect("a character serialises");

        assert!(json.contains(r#""color":"turquoise""#), "{json}");
        assert_eq!(
            serde_json::from_str::<Character>(&json)
                .expect("a character reads back")
                .color,
            Some(Color::Turquoise)
        );
    }

    #[test]
    fn a_character_written_before_the_colours_existed_has_none() {
        let stored = r#"{"nickname":"Alpha","gender":"male","class":"iop","relayed":true}"#;

        let character = serde_json::from_str::<Character>(stored)
            .expect("a character from an earlier version still loads");

        assert_eq!(character.color, None);
        assert_eq!(character.class, Some(Class::Iop));
    }

    #[test]
    fn the_twelve_colours_go_round_the_circle_and_none_repeats() {
        let mut seen = Vec::new();

        for color in Color::ALL {
            assert!(!seen.contains(&color.rgb()), "{color:?} repeats a colour");
            seen.push(color.rgb());
        }

        assert_eq!(Color::ALL.len(), 12);
        assert_eq!(Color::ALL.first(), Some(&Color::Red));
        assert_eq!(Color::ALL.last(), Some(&Color::Pink));
    }

    #[test]
    fn the_colours_the_icon_paints_are_the_ones_the_theme_declares() {
        assert_eq!(Color::Red.rgb(), [228, 35, 102]);
        assert_eq!(Color::Yellow.rgb(), [231, 232, 0]);
        assert_eq!(Color::Pink.rgb(), [255, 108, 202]);
    }

    #[test]
    fn the_relay_ignores_whether_a_character_is_excluded() {
        let excluded = Character::new("Alpha").excluded();

        assert!(excluded.is_relayed_online());
        assert!(!excluded.is_in_cycle());
    }

    #[test]
    fn nobody_wears_the_star_until_somebody_is_given_it() {
        assert!(!Character::new("Alpha").is_main());
        assert!(Character::new("Alpha").main().is_main());
    }

    #[test]
    fn a_character_written_before_the_star_existed_does_not_wear_it() {
        let stored = r#"{"nickname":"Alpha","gender":"male","class":"iop","relayed":true}"#;

        let character = serde_json::from_str::<Character>(stored)
            .expect("a character from an earlier version still loads");

        assert!(!character.is_main());
    }

    #[test]
    fn the_star_travels_to_the_file_and_comes_back() {
        let character = Character::new("Alpha").main();

        let json = serde_json::to_string(&character).expect("a character serialises");

        assert!(json.contains(r#""main":true"#), "{json}");
        assert!(
            serde_json::from_str::<Character>(&json)
                .expect("a character reads back")
                .is_main()
        );
    }

    #[test]
    fn nobody_has_keys_of_his_own_until_they_are_given_to_him() {
        assert_eq!(Character::new("Alpha").shortcut, None);
    }

    #[test]
    fn the_keys_of_a_character_travel_to_the_file_and_come_back() {
        let character = Character {
            shortcut: Shortcut::new("F1"),
            ..Character::new("Alpha")
        };

        let json = serde_json::to_string(&character).expect("a character serialises");

        assert!(json.contains(r#""shortcut":"F1""#), "{json}");
        assert_eq!(
            serde_json::from_str::<Character>(&json)
                .expect("a character reads back")
                .shortcut,
            Shortcut::new("F1")
        );
    }

    #[test]
    fn a_character_written_before_the_keys_existed_has_none() {
        let stored = r#"{"nickname":"Alpha","gender":"male","class":"iop","relayed":true}"#;

        let character = serde_json::from_str::<Character>(stored)
            .expect("a character from an earlier version still loads");

        assert_eq!(character.shortcut, None);
    }

    #[test]
    fn the_star_says_nothing_about_the_cycle_or_the_relay() {
        let excluded = Character::new("Alpha").main().excluded();

        assert!(excluded.is_main());
        assert!(!excluded.is_in_cycle());
        assert!(excluded.is_relayed_online());
        assert!(Character::new("Alpha").main().offline().is_main());
    }

    #[test]
    fn a_disconnected_character_leaves_the_relay_nothing_to_hear() {
        assert!(!Character::new("Alpha").offline().is_relayed_online());
        assert!(!Character::new("Alpha").not_relayed().is_relayed_online());
    }
}
