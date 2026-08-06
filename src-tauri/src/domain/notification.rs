//! Game notifications: who they are for, and what kind of event they carry.
//!
//! The title pattern and the whole `NOTIF_TYPES` table are ported as is from
//! Dracoon, where they have been verified on macOS and on Windows. They are not
//! to be reinvented nor improved here.

use std::sync::LazyLock;

use regex::Regex;
use regex::RegexSet;
use serde::Deserialize;
use serde::Serialize;

/// The category of a game event multifus recognises.
///
/// The order of the variants is the order of the table below, which is the
/// order the patterns are tried in. It matters, see [`classify`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationKind {
    /// It is this character's turn to play.
    Combat,
    /// Somebody offers a trade.
    Trade,
    /// Invitation to a group or to a guild.
    Group,
    /// A private message.
    PrivateMessage,
    /// Somebody challenges this character to a duel.
    Challenge,
    /// Craft: workshop invitation, call for a craftsman, items ready.
    Craft,
    /// The perceptor is under attack.
    Perceptor,
}

impl NotificationKind {
    /// Every kind, in the order the patterns are tried.
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

/// A system notification emitted by a Dofus client. Its title carries the
/// nickname of the character it is meant for, its body describes the event.
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

    /// The nickname of the character this notification is for, read in the
    /// title. `None` when the title is not a Dofus one.
    #[must_use]
    pub fn nickname(&self) -> Option<&str> {
        extract_nickname(&self.title)
    }

    /// The kind of event, read in the body. `None` when no pattern matches.
    #[must_use]
    pub fn kind(&self) -> Option<NotificationKind> {
        classify(&self.body)
    }

    /// There is nothing in the body to classify.
    ///
    /// A wording no pattern covers and a body that was never read both leave
    /// [`GameNotification::kind`] at `None`, and they are repaired in two
    /// different files: the first by adding a pattern to the table below, the
    /// second in the walk of `platform::macos`. This is what tells them apart,
    /// and the journal says which one it was.
    #[must_use]
    pub fn matches_blank_body(&self) -> bool {
        self.body.trim().is_empty()
    }
}

/// Ported from Dracoon, valid on both systems. A window title looks like
/// `Nickname - Dofus Retro v1.48.21`, and a notification title uses the same
/// shape.
static TITLE_PATTERN: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^(.+?)\s*-\s*Dofus").expect("the title pattern is valid"));

/// Reads the nickname at the head of a window or notification title.
///
/// Returns `None` when the title does not come from a Dofus client, and also
/// when the captured nickname is blank, which Dracoon treats as no nickname at
/// all since its callers test the result for truthiness.
#[must_use]
pub fn extract_nickname(title: &str) -> Option<&str> {
    let nickname = TITLE_PATTERN.captures(title)?.get(1)?.as_str().trim();

    if nickname.is_empty() {
        None
    } else {
        Some(nickname)
    }
}

/// The `NOTIF_TYPES` table of Dracoon, ported pattern for pattern.
///
/// One entry per kind, holding every pattern of that kind in French, English
/// and Spanish. A body belongs to a kind as soon as one of its patterns matches.
/// Every pattern is case insensitive, as `re.IGNORECASE` was on the Python side.
///
/// The order of the entries is part of the data. The private message patterns
/// only test the head of the body, so a combat body such as
/// `de Untel : c'est à ton tour de jouer` matches both combat and private
/// message, and combat wins by coming first.
// Formatting is left alone so the table stays readable next to the Python one.
#[rustfmt::skip]
const NOTIF_TYPES: [(NotificationKind, &[&str]); 7] = [
    (NotificationKind::Combat, &[
        r"de jouer",         // FR
        r"turn to play",     // EN
        r"Le toca jugar a",  // ES
    ]),
    (NotificationKind::Trade, &[
        r"te propose de faire un échange",      // FR
        r"offers a trade",                      // EN
        r"te propone realizar un intercambio",  // ES
    ]),
    (NotificationKind::Group, &[
        r"t['']invite .+rejoindre son groupe",  // FR group
        r"t['']invite .+rejoindre sa guilde",   // FR guild
        r"You are invited to join .+'s group",  // EN group
        r"invites you to join the .+guild",     // EN guild
        r"te invita a unirte a su grupo",       // ES group
        r"te invita a unirte a su gremio",      // ES guild
    ]),
    (NotificationKind::PrivateMessage, &[
        r"^de ",     // FR
        r"^from ",   // EN
        r"^desde ",  // ES
    ]),
    (NotificationKind::Challenge, &[
        r"te défie",       // FR
        r"challenges you", // EN
        r"te desafía",     // ES
    ]),
    (NotificationKind::Craft, &[
        r"fait appel à tes talents d.artisan",  // FR craftsman
        r"rejoindre son atelier",               // FR workshop
        r"tous les objets ont été fabriqués",   // FR items ready
        r"is crying out for your skills",           // EN craftsman
        r"You are invited to join .+'s workshop",   // EN workshop
        r"All items have been created!",            // EN items ready
        r"solicita tus talentos de artesano",       // ES craftsman
        r"te invita a pasarte por su taller",       // ES workshop
        r"¡Todos los objetos han sido fabricados!", // ES items ready
    ]),
    (NotificationKind::Perceptor, &[
        r"percepteur.+est attaqué en",              // FR
        r"The perceptor .+is attacked in",          // EN
        r"El recaudador .+está siendo atacado en",  // ES
    ]),
];

/// The table above compiled once, one set of patterns per kind.
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

/// Reads the kind of event out of a notification body.
///
/// The kinds are tried in table order and the first one whose patterns match
/// wins, as in Dracoon. `None` means no pattern matched, and multifus focuses
/// nothing.
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
        // The dash inside a nickname is kept, only the one before `Dofus` splits.
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
        // Measured on a real client left idle: the window stays, the dialog says
        // « Tu es resté trop longtemps inactif », and the title loses the
        // nickname without gaining one of its own. A title such as
        // `Connexion - Dofus Retro` would have put a character named
        // « Connexion » in the roster, and it is not what happens.
        //
        // The version moves on its own, so the shape is what is asserted: no
        // dash before `Dofus`, therefore no nickname.
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
        // Both `de jouer` and `^de ` match this body. The table order decides.
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
