//! What the configuration file holds, and what it holds for someone who has
//! never opened multifus.
//!
//! Every type here is plain data with a `Default`. Nothing reads a file, nothing
//! registers a shortcut, nothing starts at login: this module describes the
//! shape, [`crate::app::shortcuts`] and [`crate::app::autostart`] give it an
//! effect.

use std::fmt;

use serde::Deserialize;
use serde::Serialize;

use crate::domain::NotificationKind;
use crate::domain::Roster;

/// Everything that survives a restart.
///
/// The veille is not in here, and cannot be: ADR 0004 keeps it for the session
/// only, and [`crate::domain::Character`] marks it `#[serde(skip)]` so the roster
/// below reaches the file without it. What comes back from a file is therefore a
/// roster where everyone is awake and, until the first window scan, offline.
///
/// A field missing from the file takes its default rather than failing the whole
/// load, and a field the file has and this version does not is ignored. So a
/// configuration written by a later multifus still opens in an earlier one, and
/// a new setting can be added here without invalidating everyone's file.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    /// The characters, in cycle order. Their position in the cycle is their
    /// position in this list, which is what the drag and drop of step 6
    /// rearranges.
    pub roster: Roster,
    /// The four key combinations of perimetre.md.
    pub shortcuts: Shortcuts,
    /// The ready-made lines, in the order the screen shows them. Empty on a
    /// first launch, and with no maximum, see ADR 0012.
    pub quick_replies: Vec<QuickReply>,
    /// The seven AutoFocus switches.
    pub auto_focus: AutoFocus,
    /// Where the relay writes, and how much of a private message it carries.
    /// Never the bot token, see ADR 0009.
    pub relay: Relay,
    /// Whether multifus starts with the session. Unchecked by default,
    /// perimetre.md is explicit about it.
    ///
    /// This is the intent and the system is only ever its consequence: the
    /// registration on disk records a path and can be taken away from under
    /// multifus, so [`crate::app::autostart`] makes the system match this at
    /// every launch rather than the other way round.
    pub start_at_login: bool,
}

/// The four shortcuts of perimetre.md.
///
/// `None` is a shortcut the user has cleared, and it means the action has no key
/// combination at all. It is a normal state, not a missing value:
/// [`crate::app::shortcuts`] registers what is here and leaves the rest alone.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Shortcuts {
    /// Next character in the cycle, asleep ones skipped.
    pub next: Option<Shortcut>,
    /// Previous character in the cycle.
    pub previous: Option<Shortcut>,
    /// Puts the character in the foreground to sleep, or wakes it up.
    pub toggle_asleep: Option<Shortcut>,
    /// Sleeps one gender and wakes the other.
    pub swap: Option<Shortcut>,
}

/// The combinations multifus proposes on a first launch.
///
/// `Control+Shift+arrow` rather than `Control+arrow`: macOS binds the latter to
/// Mission Control and to moving between Spaces, so the four would be taken
/// before multifus ever saw them. They stay a proposal, the user changes them at
/// step 6, and the registration is what finds out whether the system takes them.
const DEFAULT_NEXT: &str = "Control+Shift+Right";
const DEFAULT_PREVIOUS: &str = "Control+Shift+Left";
const DEFAULT_TOGGLE_ASLEEP: &str = "Control+Shift+Down";
const DEFAULT_SWAP: &str = "Control+Shift+Up";

impl Default for Shortcuts {
    fn default() -> Self {
        Self {
            next: Shortcut::new(DEFAULT_NEXT),
            previous: Shortcut::new(DEFAULT_PREVIOUS),
            toggle_asleep: Shortcut::new(DEFAULT_TOGGLE_ASLEEP),
            swap: Shortcut::new(DEFAULT_SWAP),
        }
    }
}

/// A key combination, written the way the global shortcut plugin reads it,
/// `Control+Shift+Right` and the like.
///
/// It is stored as text and never interpreted here. Deciding whether a
/// combination exists on this system is the plugin's job, at the moment it is
/// registered, and the failure has to reach the screen then, which is what
/// [`crate::app::view::ShortcutStatus`] carries. The only thing this type refuses
/// is a blank string, which is not a shortcut but an absence, and an absence is
/// spelled `None`.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Shortcut(String);

impl Shortcut {
    /// Reads a combination. Trims it, and returns `None` when nothing is left.
    #[must_use]
    pub fn new(accelerator: impl Into<String>) -> Option<Self> {
        let accelerator = accelerator.into().trim().to_owned();

        if accelerator.is_empty() {
            None
        } else {
            Some(Self(accelerator))
        }
    }

    /// The combination as the plugin expects to read it.
    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for Shortcut {
    type Error = &'static str;

    fn try_from(accelerator: String) -> core::result::Result<Self, Self::Error> {
        Self::new(accelerator).ok_or("a shortcut cannot be blank, use null instead")
    }
}

impl From<Shortcut> for String {
    fn from(shortcut: Shortcut) -> Self {
        shortcut.0
    }
}

impl fmt::Display for Shortcut {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.0)
    }
}

/// The identity of a quick reply, allocated as the largest existing one plus one.
///
/// A number and not the text, so that rewriting a quick reply or dragging it
/// elsewhere in the list leaves its key combination where it was.
#[derive(
    Debug, Clone, Copy, Default, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize,
)]
#[serde(transparent)]
pub struct QuickReplyId(u32);

impl QuickReplyId {
    /// The identifier that comes after this one.
    #[must_use]
    pub const fn next(self) -> Self {
        Self(self.0.saturating_add(1))
    }
}

/// A ready-made line of text, filed under a key combination. Global, and with no
/// name of its own: the text is what identifies it, see CONTEXT.md.
///
/// **No `#[serde(default)]` on the structure, one per field.** The trap is
/// written down in `docs/pieges.md`.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct QuickReply {
    #[serde(default)]
    pub id: QuickReplyId,
    /// One line, always. See [`QuickReply::set_text`].
    #[serde(default)]
    pub text: String,
    /// `None` for a quick reply nothing fires yet, exactly as for the four actions.
    #[serde(default)]
    pub shortcut: Option<Shortcut>,
}

impl QuickReply {
    /// An empty quick reply under this identifier, which is what « Ajouter » makes.
    #[must_use]
    pub fn new(id: QuickReplyId) -> Self {
        Self {
            id,
            text: String::new(),
            shortcut: None,
        }
    }

    /// Rewrites the text, folded onto one line and trimmed.
    ///
    /// A line break pasted into the chat sends the message, which ADR 0012
    /// refuses. Folded rather than cut, so nothing the user pasted is lost.
    pub fn set_text(&mut self, text: &str) {
        self.text = text
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join(" ");
    }
}

/// The seven AutoFocus switches, one per [`NotificationKind`], and the one that
/// suspends them all.
///
/// Global and never per character. Dracoon offers the grid of seven icons on
/// every line, which is forty-two buttons for six characters and the global to
/// local synchronisation that comes with it; perimetre.md drops it. There is
/// therefore no room here for a per-character override, and that is the point.
///
/// All eight are on by default: AutoFocus is what multifus is for, and it has to
/// work on a first launch without a visit to the settings.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct AutoFocus {
    /// The master switch, the one the system tray offers.
    ///
    /// A field of its own rather than the seven turned off together, because
    /// turning them off would forget which ones the user had chosen and turning
    /// them back on would hand back all seven. Suspending is not the same as
    /// clearing, and the file has to remember the difference.
    pub enabled: bool,
    /// Whether a notification takes a window out of the Dock.
    ///
    /// Not a kind, and that is why it is not one of the seven: it says what to
    /// do with a window the user has put away, whatever brought it up. Switched
    /// off, minimizing a client puts it out of AutoFocus's reach, which is how
    /// one works elsewhere without being dragged back into the game.
    ///
    /// Only the AutoFocus reads it. A shortcut and a click in the system tray
    /// were asked for, so they always bring the window back.
    pub wakes_minimized: bool,
    /// It is this character's turn to play.
    pub combat: bool,
    /// Somebody offers a trade.
    pub trade: bool,
    /// Invitation to a group or to a guild.
    pub group: bool,
    /// A private message.
    pub private_message: bool,
    /// Somebody challenges this character to a duel.
    pub challenge: bool,
    /// Workshop invitation, call for a craftsman, items ready.
    pub craft: bool,
    /// The perceptor is under attack.
    pub perceptor: bool,
}

impl Default for AutoFocus {
    fn default() -> Self {
        Self::all(true)
    }
}

impl AutoFocus {
    /// The same state for every switch of this screen.
    #[must_use]
    pub const fn all(enabled: bool) -> Self {
        Self {
            enabled,
            wakes_minimized: enabled,
            combat: enabled,
            trade: enabled,
            group: enabled,
            private_message: enabled,
            challenge: enabled,
            craft: enabled,
            perceptor: enabled,
        }
    }

    /// Whether a notification of this kind brings its character to the front.
    ///
    /// Both switches have to be on. The master is what the system tray offers,
    /// so that a whole evening of AutoFocus can be called off in one click and
    /// turned back on without having to remember which of the seven were which.
    #[must_use]
    pub fn is_enabled(&self, kind: NotificationKind) -> bool {
        self.enabled && self.is_kind_enabled(kind)
    }

    /// Whether this kind is switched on, ignoring the master.
    ///
    /// What the screen draws on its row. It is deliberately not the same
    /// question as [`AutoFocus::is_enabled`]: a suspended AutoFocus still has to
    /// show which kinds it will come back to.
    #[must_use]
    pub fn is_kind_enabled(&self, kind: NotificationKind) -> bool {
        match kind {
            NotificationKind::Combat => self.combat,
            NotificationKind::Trade => self.trade,
            NotificationKind::Group => self.group,
            NotificationKind::PrivateMessage => self.private_message,
            NotificationKind::Challenge => self.challenge,
            NotificationKind::Craft => self.craft,
            NotificationKind::Perceptor => self.perceptor,
        }
    }

    /// Flips one switch, the way the interface of step 6 does.
    pub fn set(&mut self, kind: NotificationKind, enabled: bool) {
        let switch = match kind {
            NotificationKind::Combat => &mut self.combat,
            NotificationKind::Trade => &mut self.trade,
            NotificationKind::Group => &mut self.group,
            NotificationKind::PrivateMessage => &mut self.private_message,
            NotificationKind::Challenge => &mut self.challenge,
            NotificationKind::Craft => &mut self.craft,
            NotificationKind::Perceptor => &mut self.perceptor,
        };

        *switch = enabled;
    }
}

/// What the file holds about the relay, which is everything except the token:
/// that one is in the keychain, see ADR 0009 and [`crate::app::relay::secret`].
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Relay {
    /// The Telegram conversation the relay writes into. `None` until the pairing
    /// has run, and signed because Telegram numbers a group negatively.
    pub chat_id: Option<i64>,
    /// Whether the text of a private message goes out with the nickname and the
    /// kind. Unchecked by default, ADR 0008.
    pub send_body: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_first_launch_starts_on_an_empty_roster_and_nothing_personal() {
        let settings = Settings::default();

        assert!(settings.roster.is_empty());
        assert!(!settings.start_at_login);
    }

    #[test]
    fn the_seven_switches_are_on_by_default() {
        let auto_focus = AutoFocus::default();

        assert!(auto_focus.enabled);

        for kind in NotificationKind::ALL {
            assert!(auto_focus.is_enabled(kind), "{kind:?} should be on");
        }
    }

    #[test]
    fn the_master_suspends_the_seven_without_forgetting_them() {
        // The whole reason it is a field of its own: turning the seven off and
        // back on would hand back all seven, and the user had chosen six.
        let mut auto_focus = AutoFocus::default();
        auto_focus.set(NotificationKind::Craft, false);

        auto_focus.enabled = false;

        for kind in NotificationKind::ALL {
            assert!(!auto_focus.is_enabled(kind), "{kind:?} should be suspended");
        }

        // And the screen still knows which one was off.
        assert!(!auto_focus.is_kind_enabled(NotificationKind::Craft));
        assert!(auto_focus.is_kind_enabled(NotificationKind::Combat));

        auto_focus.enabled = true;

        assert!(auto_focus.is_enabled(NotificationKind::Combat));
        assert!(!auto_focus.is_enabled(NotificationKind::Craft));
    }

    #[test]
    fn the_minimized_are_woken_by_default() {
        // multifus is for bringing the right window forward, and a first launch
        // has to do that whatever the user has put away in the Dock.
        assert!(AutoFocus::default().wakes_minimized);
    }

    #[test]
    fn a_file_written_before_this_setting_existed_wakes_the_minimized() {
        // The switch is new. Every configuration already on disk is missing it,
        // and reading `false` there would silently change what those multifus
        // do on a notification.
        let auto_focus =
            serde_json::from_str::<AutoFocus>("{}").expect("an AutoFocus with nothing in it");

        assert!(auto_focus.wakes_minimized);
    }

    #[test]
    fn leaving_the_minimized_alone_changes_nothing_for_a_window_on_screen() {
        // The switch answers one question and not two: it says what happens to a
        // window in the Dock, never which kinds count.
        let auto_focus = AutoFocus {
            wakes_minimized: false,
            ..AutoFocus::default()
        };

        for kind in NotificationKind::ALL {
            assert!(auto_focus.is_enabled(kind), "{kind:?} should still be on");
        }
    }

    #[test]
    fn every_switch_is_reachable_and_independent() {
        for kind in NotificationKind::ALL {
            let mut auto_focus = AutoFocus::all(true);
            auto_focus.set(kind, false);

            let off = NotificationKind::ALL
                .into_iter()
                .filter(|other| !auto_focus.is_enabled(*other))
                .collect::<Vec<_>>();

            assert_eq!(off, vec![kind]);
        }
    }

    #[test]
    fn the_four_shortcuts_are_bound_by_default_and_all_differ() {
        // Two actions on the same combination is a state the system cannot hold:
        // it keys a shortcut by the keys alone, so the second registration is
        // turned down. A first launch must not walk into that.
        let shortcuts = Shortcuts::default();
        let bound = [
            shortcuts.next.as_ref(),
            shortcuts.previous.as_ref(),
            shortcuts.toggle_asleep.as_ref(),
            shortcuts.swap.as_ref(),
        ]
        .into_iter()
        .flatten()
        .map(Shortcut::as_str)
        .collect::<Vec<_>>();

        assert_eq!(bound.len(), 4);

        let mut unique = bound.clone();
        unique.sort_unstable();
        unique.dedup();
        assert_eq!(
            unique.len(),
            4,
            "two actions share a combination: {bound:?}"
        );
    }

    #[test]
    fn a_blank_combination_is_an_absence_not_a_shortcut() {
        assert_eq!(Shortcut::new(""), None);
        assert_eq!(Shortcut::new("   "), None);
        assert_eq!(
            Shortcut::new("  Control+Shift+Right  ").map(String::from),
            Some("Control+Shift+Right".to_owned())
        );
    }

    #[test]
    fn a_shortcut_is_stored_as_the_plain_text_the_plugin_reads() {
        let shortcuts = Shortcuts {
            next: Shortcut::new("Alt+Tab"),
            previous: None,
            toggle_asleep: None,
            swap: None,
        };

        let json = serde_json::to_string(&shortcuts).expect("shortcuts serialise");
        assert!(json.contains(r#""next":"Alt+Tab""#), "{json}");
        assert!(json.contains(r#""previous":null"#), "{json}");

        let read: Shortcuts = serde_json::from_str(&json).expect("shortcuts read back");
        assert_eq!(read, shortcuts);
    }

    #[test]
    fn a_blank_shortcut_in_the_file_is_rejected_rather_than_kept() {
        // It would otherwise reach the plugin, which has nothing to register
        // and no way to say so.
        let error = serde_json::from_str::<Shortcuts>(r#"{"next":""}"#)
            .expect_err("a blank combination is not a shortcut");

        assert!(error.to_string().contains("blank"), "{error}");
    }

    #[test]
    fn a_first_launch_has_no_quick_reply_at_all() {
        assert!(Settings::default().quick_replies.is_empty());
    }

    #[test]
    fn a_quick_reply_holds_its_text_on_one_line() {
        // A line break pasted into the chat sends the message, ADR 0012.
        let mut quick_reply = QuickReply::new(QuickReplyId::default());

        quick_reply.set_text("  prix libre\nde rien  ");

        assert_eq!(quick_reply.text, "prix libre de rien");

        quick_reply.set_text("prix libre\r\n\r\nde rien");

        assert_eq!(quick_reply.text, "prix libre de rien");
    }

    #[test]
    fn a_quick_reply_written_before_a_field_existed_still_loads() {
        // The trap of `Character`, written down in docs/pieges.md: a field with
        // no default of its own sends the whole configuration to quarantine.
        let quick_reply = serde_json::from_str::<QuickReply>(r#"{"text":"prix libre"}"#)
            .expect("a partial quick_reply");

        assert_eq!(quick_reply.text, "prix libre");
        assert_eq!(quick_reply.id, QuickReplyId::default());
        assert_eq!(quick_reply.shortcut, None);
    }

    #[test]
    fn a_quick_reply_keeps_its_identifier_across_the_file() {
        let quick_reply = QuickReply {
            id: QuickReplyId::default().next().next(),
            text: "de rien".to_owned(),
            shortcut: Shortcut::new("Control+Shift+K"),
        };

        let json = serde_json::to_string(&quick_reply).expect("a quick_reply serialises");

        assert_eq!(
            json,
            r#"{"id":2,"text":"de rien","shortcut":"Control+Shift+K"}"#
        );
        assert_eq!(
            serde_json::from_str::<QuickReply>(&json).expect("a quick_reply reads back"),
            quick_reply
        );
    }

    #[test]
    fn the_body_of_a_private_message_stays_on_the_machine_until_it_is_asked_for() {
        let relay = Relay::default();

        assert!(!relay.send_body);
        assert_eq!(relay.chat_id, None);
    }

    #[test]
    fn a_relay_never_carries_the_token_to_the_file() {
        let relay = Relay {
            chat_id: Some(-1_001_234_567_890),
            send_body: true,
        };

        let json = serde_json::to_string(&relay).expect("a relay serialises");

        assert_eq!(json, r#"{"chat_id":-1001234567890,"send_body":true}"#);
        assert_eq!(
            serde_json::from_str::<Relay>(&json).expect("a relay reads back"),
            relay
        );
    }

    #[test]
    fn a_missing_field_takes_its_default_and_an_unknown_one_is_ignored() {
        let settings: Settings =
            serde_json::from_str(r#"{"start_at_login":true,"from_a_later_version":42}"#)
                .expect("a partial configuration still loads");

        assert!(settings.start_at_login);
        assert_eq!(settings.shortcuts, Shortcuts::default());
        assert_eq!(settings.auto_focus, AutoFocus::default());
        assert_eq!(settings.relay, Relay::default());
        assert!(settings.roster.is_empty());
        assert!(settings.quick_replies.is_empty());
    }
}
