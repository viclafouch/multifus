use std::fmt;

use serde::Deserialize;
use serde::Serialize;

use crate::domain::NotificationKind;
use crate::domain::Roster;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    pub roster: Roster,
    pub shortcuts: Shortcuts,
    pub quick_replies: Vec<QuickReply>,
    pub auto_focus: AutoFocus,
    pub relay: Relay,
    pub maximize_on_launch: bool,
    pub short_titles: bool,
    pub client_title_suffix: Option<String>,
    pub start_at_login: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Shortcuts {
    pub next: Option<Shortcut>,
    pub previous: Option<Shortcut>,
    pub toggle_asleep: Option<Shortcut>,
    pub swap: Option<Shortcut>,
}

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

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Shortcut(String);

impl Shortcut {
    #[must_use]
    pub fn new(accelerator: impl Into<String>) -> Option<Self> {
        let accelerator = accelerator.into().trim().to_owned();

        if accelerator.is_empty() {
            None
        } else {
            Some(Self(accelerator))
        }
    }

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

#[derive(
    Debug, Clone, Copy, Default, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize,
)]
#[serde(transparent)]
pub struct QuickReplyId(u32);

impl QuickReplyId {
    #[must_use]
    pub const fn next(self) -> Self {
        Self(self.0.saturating_add(1))
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct QuickReply {
    #[serde(default)]
    pub id: QuickReplyId,
    #[serde(default)]
    pub text: String,
    #[serde(default)]
    pub shortcut: Option<Shortcut>,
}

impl QuickReply {
    #[must_use]
    pub fn new(id: QuickReplyId) -> Self {
        Self {
            id,
            text: String::new(),
            shortcut: None,
        }
    }

    pub fn set_text(&mut self, text: &str) {
        self.text = text
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join(" ");
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct AutoFocus {
    pub enabled: bool,
    pub wakes_minimized: bool,
    pub combat: bool,
    pub trade: bool,
    pub group: bool,
    pub private_message: bool,
    pub challenge: bool,
    pub craft: bool,
    pub perceptor: bool,
}

impl Default for AutoFocus {
    fn default() -> Self {
        Self::all(true)
    }
}

impl AutoFocus {
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

    #[must_use]
    pub fn is_enabled(&self, kind: NotificationKind) -> bool {
        self.enabled && self.is_kind_enabled(kind)
    }

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

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Relay {
    pub chat_id: Option<i64>,
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
        assert!(!settings.maximize_on_launch);
        assert!(!settings.short_titles);
        assert_eq!(settings.client_title_suffix, None);
    }

    #[test]
    fn a_file_written_before_the_maximizing_existed_leaves_the_windows_alone() {
        let settings = serde_json::from_str::<Settings>("{}").expect("an empty configuration");

        assert!(!settings.maximize_on_launch);
        assert!(!settings.short_titles);
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
        let mut auto_focus = AutoFocus::default();
        auto_focus.set(NotificationKind::Craft, false);

        auto_focus.enabled = false;

        for kind in NotificationKind::ALL {
            assert!(!auto_focus.is_enabled(kind), "{kind:?} should be suspended");
        }

        assert!(!auto_focus.is_kind_enabled(NotificationKind::Craft));
        assert!(auto_focus.is_kind_enabled(NotificationKind::Combat));

        auto_focus.enabled = true;

        assert!(auto_focus.is_enabled(NotificationKind::Combat));
        assert!(!auto_focus.is_enabled(NotificationKind::Craft));
    }

    #[test]
    fn the_minimized_are_woken_by_default() {
        assert!(AutoFocus::default().wakes_minimized);
    }

    #[test]
    fn a_file_written_before_this_setting_existed_wakes_the_minimized() {
        let auto_focus =
            serde_json::from_str::<AutoFocus>("{}").expect("an AutoFocus with nothing in it");

        assert!(auto_focus.wakes_minimized);
    }

    #[test]
    fn leaving_the_minimized_alone_changes_nothing_for_a_window_on_screen() {
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
        let mut quick_reply = QuickReply::new(QuickReplyId::default());

        quick_reply.set_text("  prix libre\nde rien  ");

        assert_eq!(quick_reply.text, "prix libre de rien");

        quick_reply.set_text("prix libre\r\n\r\nde rien");

        assert_eq!(quick_reply.text, "prix libre de rien");
    }

    #[test]
    fn a_quick_reply_written_before_a_field_existed_still_loads() {
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
