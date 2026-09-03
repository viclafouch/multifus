use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    #[default]
    En,
    Fr,
}

impl Language {
    pub const ALL: [Self; 2] = [Self::Fr, Self::En];

    #[must_use]
    pub fn of_locale(locale: &str) -> Self {
        let tag = locale.split(['-', '_']).next().unwrap_or(locale);

        if tag.eq_ignore_ascii_case("fr") {
            Self::Fr
        } else {
            Self::En
        }
    }

    #[must_use]
    pub fn of_system() -> Self {
        tauri_plugin_os::locale().map_or(Self::En, |locale| Self::of_locale(&locale))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_french_system_gets_french_whatever_country_it_names() {
        assert_eq!(Language::of_locale("fr"), Language::Fr);
        assert_eq!(Language::of_locale("fr-FR"), Language::Fr);
        assert_eq!(Language::of_locale("fr_CA"), Language::Fr);
        assert_eq!(Language::of_locale("FR-be"), Language::Fr);
    }

    #[test]
    fn every_other_system_gets_english_rather_than_a_language_multifus_does_not_speak() {
        assert_eq!(Language::of_locale("en-US"), Language::En);
        assert_eq!(Language::of_locale("pl-PL"), Language::En);
        assert_eq!(Language::of_locale("es"), Language::En);
        assert_eq!(Language::of_locale(""), Language::En);
    }

    #[test]
    fn a_language_crosses_the_file_as_the_tag_the_catalogues_are_named_after() {
        assert_eq!(
            serde_json::to_string(&Language::Fr).expect("a language serialises"),
            r#""fr""#
        );
        assert_eq!(
            serde_json::from_str::<Language>(r#""en""#).expect("a language reads back"),
            Language::En
        );
    }
}
