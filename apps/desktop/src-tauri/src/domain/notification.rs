use std::sync::LazyLock;

use regex::Regex;
use regex::RegexSet;
use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationKind {
    Combat,
    Trade,
    Group,
    PrivateMessage,
    Challenge,
    Craft,
    Perceptor,
}

impl NotificationKind {
    pub const ALL: [Self; 7] = [
        Self::Combat,
        Self::Trade,
        Self::Group,
        Self::PrivateMessage,
        Self::Challenge,
        Self::Craft,
        Self::Perceptor,
    ];
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GameNotification {
    pub title: String,
    pub body: String,
}

impl GameNotification {
    #[must_use]
    pub fn new(title: impl Into<String>, body: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            body: body.into(),
        }
    }

    #[must_use]
    pub fn nickname(&self) -> Option<&str> {
        extract_nickname(&self.title)
    }

    #[must_use]
    pub fn kind(&self) -> Option<NotificationKind> {
        classify(&self.body)
    }

    #[must_use]
    pub fn matches_blank_body(&self) -> bool {
        self.body.trim().is_empty()
    }
}

static TITLE_PATTERN: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^(.+?)\s*-\s*Dofus").expect("the title pattern is valid"));

#[must_use]
pub fn extract_nickname(title: &str) -> Option<&str> {
    let nickname = TITLE_PATTERN.captures(title)?.get(1)?.as_str().trim();

    if nickname.is_empty() {
        None
    } else {
        Some(nickname)
    }
}

#[rustfmt::skip]
const NOTIF_TYPES: [(NotificationKind, &[&str]); 7] = [
    (NotificationKind::Combat, &[
        r"de jouer",
        r"turn to play",
        r"Le toca jugar a",
    ]),
    (NotificationKind::Trade, &[
        r"te propose de faire un échange",
        r"offers a trade",
        r"te propone realizar un intercambio",
    ]),
    (NotificationKind::Group, &[
        r"t['']invite .+rejoindre son groupe",
        r"t['']invite .+rejoindre sa guilde",
        r"You are invited to join .+'s group",
        r"invites you to join the .+guild",
        r"te invita a unirte a su grupo",
        r"te invita a unirte a su gremio",
    ]),
    (NotificationKind::PrivateMessage, &[
        r"^de ",
        r"^from ",
        r"^desde ",
    ]),
    (NotificationKind::Challenge, &[
        r"te défie",
        r"challenges you",
        r"te desafía",
    ]),
    (NotificationKind::Craft, &[
        r"fait appel à tes talents d.artisan",
        r"rejoindre son atelier",
        r"tous les objets ont été fabriqués",
        r"is crying out for your skills",
        r"You are invited to join .+'s workshop",
        r"All items have been created!",
        r"solicita tus talentos de artesano",
        r"te invita a pasarte por su taller",
        r"¡Todos los objetos han sido fabricados!",
    ]),
    (NotificationKind::Perceptor, &[
        r"percepteur.+est attaqué en",
        r"The perceptor .+is attacked in",
        r"El recaudador .+está siendo atacado en",
    ]),
];

static MATCHERS: LazyLock<Vec<(NotificationKind, RegexSet)>> = LazyLock::new(|| {
    NOTIF_TYPES
        .iter()
        .map(|(kind, patterns)| {
            let insensitive = patterns.iter().map(|pattern| format!("(?i){pattern}"));
            let set = RegexSet::new(insensitive).expect("the notification patterns are valid");

            (*kind, set)
        })
        .collect()
});

#[must_use]
pub fn classify(body: &str) -> Option<NotificationKind> {
    MATCHERS
        .iter()
        .find(|(_, set)| set.is_match(body))
        .map(|(kind, _)| *kind)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_nickname_is_read_at_the_head_of_a_window_title() {
        assert_eq!(
            extract_nickname("Alpha - Dofus Retro v1.48.21"),
            Some("Alpha")
        );
        assert_eq!(extract_nickname("Alpha-Dofus Retro"), Some("Alpha"));
        assert_eq!(extract_nickname("Alpha   -   Dofus Retro"), Some("Alpha"));
        assert_eq!(extract_nickname("Alpha - dofus retro"), Some("Alpha"));
    }

    #[test]
    fn a_nickname_keeps_the_characters_dofus_allows() {
        assert_eq!(
            extract_nickname("Alpha-Bravo - Dofus Retro"),
            Some("Alpha-Bravo")
        );
        assert_eq!(extract_nickname("Élodie - Dofus Retro"), Some("Élodie"));
    }

    #[test]
    fn a_title_that_is_not_a_dofus_one_carries_no_nickname() {
        assert_eq!(extract_nickname(""), None);
        assert_eq!(extract_nickname("Dofus Retro"), None);
        assert_eq!(extract_nickname("Alpha - Ankama Launcher"), None);
        assert_eq!(extract_nickname(" - Dofus Retro"), None);
    }

    #[test]
    fn a_client_disconnected_for_inactivity_invents_nobody() {
        assert_eq!(extract_nickname("Dofus Retro v1.48.21"), None);
        assert_eq!(extract_nickname("Dofus Retro v9.99.99"), None);
    }

    #[test]
    fn combat_is_recognised_in_the_three_languages() {
        assert_eq!(
            classify("de Untel : c'est à ton tour de jouer"),
            Some(NotificationKind::Combat)
        );
        assert_eq!(
            classify("from Someone: it's your turn to play"),
            Some(NotificationKind::Combat)
        );
        assert_eq!(
            classify("Le toca jugar a Alguien"),
            Some(NotificationKind::Combat)
        );
    }

    #[test]
    fn a_trade_is_recognised_in_the_three_languages() {
        assert_eq!(
            classify("Untel te propose de faire un échange"),
            Some(NotificationKind::Trade)
        );
        assert_eq!(
            classify("Someone offers a trade"),
            Some(NotificationKind::Trade)
        );
        assert_eq!(
            classify("Alguien te propone realizar un intercambio"),
            Some(NotificationKind::Trade)
        );
    }

    #[test]
    fn a_group_invitation_is_recognised_in_the_three_languages() {
        assert_eq!(
            classify("Untel t'invite à rejoindre son groupe"),
            Some(NotificationKind::Group)
        );
        assert_eq!(
            classify("Untel t'invite à rejoindre sa guilde"),
            Some(NotificationKind::Group)
        );
        assert_eq!(
            classify("You are invited to join Someone's group"),
            Some(NotificationKind::Group)
        );
        assert_eq!(
            classify("Someone invites you to join the Alguien guild"),
            Some(NotificationKind::Group)
        );
        assert_eq!(
            classify("Alguien te invita a unirte a su grupo"),
            Some(NotificationKind::Group)
        );
        assert_eq!(
            classify("Alguien te invita a unirte a su gremio"),
            Some(NotificationKind::Group)
        );
    }

    #[test]
    fn a_private_message_is_recognised_in_the_three_languages() {
        assert_eq!(
            classify("de Untel : salut"),
            Some(NotificationKind::PrivateMessage)
        );
        assert_eq!(
            classify("from Someone: hello"),
            Some(NotificationKind::PrivateMessage)
        );
        assert_eq!(
            classify("desde Alguien: hola"),
            Some(NotificationKind::PrivateMessage)
        );
    }

    #[test]
    fn a_challenge_is_recognised_in_the_three_languages() {
        assert_eq!(
            classify("Untel te défie en duel"),
            Some(NotificationKind::Challenge)
        );
        assert_eq!(
            classify("Someone challenges you"),
            Some(NotificationKind::Challenge)
        );
        assert_eq!(
            classify("Alguien te desafía"),
            Some(NotificationKind::Challenge)
        );
    }

    #[test]
    fn a_craft_is_recognised_in_the_three_languages() {
        assert_eq!(
            classify("Untel fait appel à tes talents d'artisan"),
            Some(NotificationKind::Craft)
        );
        assert_eq!(
            classify("Untel t'invite à rejoindre son atelier"),
            Some(NotificationKind::Craft)
        );
        assert_eq!(
            classify("Tous les objets ont été fabriqués !"),
            Some(NotificationKind::Craft)
        );
        assert_eq!(
            classify("Someone is crying out for your skills"),
            Some(NotificationKind::Craft)
        );
        assert_eq!(
            classify("You are invited to join Someone's workshop"),
            Some(NotificationKind::Craft)
        );
        assert_eq!(
            classify("All items have been created!"),
            Some(NotificationKind::Craft)
        );
        assert_eq!(
            classify("Alguien solicita tus talentos de artesano"),
            Some(NotificationKind::Craft)
        );
        assert_eq!(
            classify("Alguien te invita a pasarte por su taller"),
            Some(NotificationKind::Craft)
        );
        assert_eq!(
            classify("¡Todos los objetos han sido fabricados!"),
            Some(NotificationKind::Craft)
        );
    }

    #[test]
    fn a_perceptor_under_attack_is_recognised_in_the_three_languages() {
        assert_eq!(
            classify("Votre percepteur Machin est attaqué en Bonta"),
            Some(NotificationKind::Perceptor)
        );
        assert_eq!(
            classify("The perceptor Machin is attacked in Bonta"),
            Some(NotificationKind::Perceptor)
        );
        assert_eq!(
            classify("El recaudador Machin está siendo atacado en Bonta"),
            Some(NotificationKind::Perceptor)
        );
    }

    #[test]
    fn every_kind_is_reachable() {
        let mut reached: Vec<NotificationKind> = Vec::new();

        for (kind, patterns) in NOTIF_TYPES {
            assert!(!patterns.is_empty(), "{kind:?} has no pattern");
            reached.push(kind);
        }

        assert_eq!(reached, NotificationKind::ALL);
    }

    #[test]
    fn combat_wins_over_the_private_message_it_also_looks_like() {
        assert_eq!(
            classify("de Untel : a ton tour de jouer"),
            Some(NotificationKind::Combat)
        );
    }

    #[test]
    fn an_unknown_body_has_no_kind() {
        assert_eq!(classify(""), None);
        assert_eq!(classify("Vous avez gagné 3 kamas"), None);
    }

    #[test]
    fn a_notification_carries_a_nickname_and_a_kind() {
        let notification =
            GameNotification::new("Alpha - Dofus Retro v1.48.21", "de Untel : à toi de jouer");

        assert_eq!(notification.nickname(), Some("Alpha"));
        assert_eq!(notification.kind(), Some(NotificationKind::Combat));
    }
}
