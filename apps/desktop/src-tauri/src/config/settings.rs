use std::collections::HashSet;

use serde::Deserialize;
use serde::Serialize;

use crate::domain::NotificationKind;
use crate::domain::Roster;
use crate::domain::Shortcut;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    pub roster: Roster,
    pub shortcuts: Shortcuts,
    pub quick_replies: Vec<QuickReply>,
    pub auto_focus: AutoFocus,
    pub relay: Relay,
    pub banner: Banner,
    pub wheel: Wheel,
    pub rune_table: RuneTable,
    pub maximize_on_launch: bool,
    pub short_titles: bool,
    pub paint_portraits: bool,
    pub ungroup_taskbar: bool,
    pub client_title_suffix: Option<String>,
    pub start_at_login: bool,
    pub traces: Traces,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Traces {
    pub portraits: HashSet<String>,
    pub ungrouped: HashSet<String>,
    pub short_titles: bool,
}

const FIRST_QUICK_REPLY: &str = "Bon jeu à toi !";

impl Default for Settings {
    fn default() -> Self {
        let mut quick_reply = QuickReply::new(QuickReplyId::default());

        quick_reply.set_text(FIRST_QUICK_REPLY);

        Self {
            roster: Roster::default(),
            shortcuts: Shortcuts::default(),
            quick_replies: vec![quick_reply],
            auto_focus: AutoFocus::default(),
            relay: Relay::default(),
            banner: Banner::default(),
            wheel: Wheel::default(),
            rune_table: RuneTable::default(),
            maximize_on_launch: false,
            short_titles: false,
            paint_portraits: true,
            ungroup_taskbar: false,
            client_title_suffix: None,
            start_at_login: false,
            traces: Traces::default(),
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Banner {
    pub corner: BannerCorner,
    pub screen: Option<String>,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum BannerCorner {
    TopLeft,
    TopRight,
    BottomLeft,
    #[default]
    BottomRight,
}

impl BannerCorner {
    #[must_use]
    pub fn matches_left(self) -> bool {
        matches!(self, Self::TopLeft | Self::BottomLeft)
    }

    #[must_use]
    pub fn matches_top(self) -> bool {
        matches!(self, Self::TopLeft | Self::TopRight)
    }
}

pub const WHEEL_SMALLEST: u32 = 280;
pub const WHEEL_WIDEST: u32 = 360;
pub const WHEEL_STEP: u32 = 20;

const DEFAULT_DIAMETER: u32 = 320;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Wheel {
    pub diameter: u32,
}

impl Default for Wheel {
    fn default() -> Self {
        Self {
            diameter: DEFAULT_DIAMETER,
        }
    }
}

impl Wheel {
    pub fn set_diameter(&mut self, diameter: u32) {
        let steps = diameter.saturating_add(WHEEL_STEP / 2) / WHEEL_STEP;

        self.diameter = (steps * WHEEL_STEP).clamp(WHEEL_SMALLEST, WHEEL_WIDEST);
    }
}

pub const RUNE_TABLE_NARROWEST: u32 = 320;
pub const RUNE_TABLE_WIDEST: u32 = 560;
pub const RUNE_TABLE_STEP: u32 = 20;

pub const RUNE_TABLE_CLEAREST: u32 = 100;
pub const RUNE_TABLE_VEIL_STEP: u32 = 5;

const DEFAULT_RUNE_TABLE_WIDTH: u32 = 420;

const DEFAULT_RUNE_TABLE_TRANSPARENCY: u32 = 0;

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct RuneTable {
    pub width: u32,
    pub transparency: u32,
    pub offset: Option<RuneOffset>,
    pub everywhere: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct RuneOffset {
    pub x: f64,
    pub y: f64,
}

impl Default for RuneTable {
    fn default() -> Self {
        Self {
            width: DEFAULT_RUNE_TABLE_WIDTH,
            transparency: DEFAULT_RUNE_TABLE_TRANSPARENCY,
            offset: None,
            everywhere: false,
        }
    }
}

impl RuneTable {
    pub fn set_width(&mut self, width: u32) {
        let steps = width.saturating_add(RUNE_TABLE_STEP / 2) / RUNE_TABLE_STEP;

        self.width = (steps * RUNE_TABLE_STEP).clamp(RUNE_TABLE_NARROWEST, RUNE_TABLE_WIDEST);
    }

    pub fn set_transparency(&mut self, transparency: u32) {
        let steps = transparency.saturating_add(RUNE_TABLE_VEIL_STEP / 2) / RUNE_TABLE_VEIL_STEP;

        self.transparency = (steps * RUNE_TABLE_VEIL_STEP).min(RUNE_TABLE_CLEAREST);
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Shortcuts {
    pub next: Option<Shortcut>,
    pub previous: Option<Shortcut>,
    pub main: Option<Shortcut>,
    pub toggle_excluded: Option<Shortcut>,
    pub walk: Option<Shortcut>,
    pub maximize_all: Option<Shortcut>,
    pub wheel: Option<Shortcut>,
    pub rune_table: Option<Shortcut>,
}

const DEFAULT_NEXT: &str = "Control+Shift+Right";
const DEFAULT_PREVIOUS: &str = "Control+Shift+Left";
const DEFAULT_MAIN: &str = "Control+Shift+Space";
const DEFAULT_TOGGLE_EXCLUDED: &str = "Control+Shift+Down";
const DEFAULT_WALK: &str = "Control+Shift+KeyD";
const DEFAULT_MAXIMIZE_ALL: &str = "Control+Shift+KeyA";
const DEFAULT_WHEEL: &str = "Control+Shift+KeyW";
const DEFAULT_RUNE_TABLE: &str = "Control+Shift+KeyR";

impl Default for Shortcuts {
    fn default() -> Self {
        Self {
            next: Shortcut::new(DEFAULT_NEXT),
            previous: Shortcut::new(DEFAULT_PREVIOUS),
            main: Shortcut::new(DEFAULT_MAIN),
            toggle_excluded: Shortcut::new(DEFAULT_TOGGLE_EXCLUDED),
            walk: Shortcut::new(DEFAULT_WALK),
            maximize_all: Shortcut::new(DEFAULT_MAXIMIZE_ALL),
            wheel: Shortcut::new(DEFAULT_WHEEL),
            rune_table: Shortcut::new(DEFAULT_RUNE_TABLE),
        }
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
        assert!(!settings.ungroup_taskbar);
        assert_eq!(settings.client_title_suffix, None);
    }

    #[test]
    fn a_file_written_before_the_maximizing_existed_leaves_the_windows_alone() {
        let settings = serde_json::from_str::<Settings>("{}").expect("an empty configuration");

        assert!(!settings.maximize_on_launch);
        assert!(!settings.short_titles);
        assert!(!settings.ungroup_taskbar);
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
    fn the_eight_shortcuts_are_bound_by_default_and_all_differ() {
        let shortcuts = Shortcuts::default();
        let bound = [
            shortcuts.next.as_ref(),
            shortcuts.previous.as_ref(),
            shortcuts.main.as_ref(),
            shortcuts.toggle_excluded.as_ref(),
            shortcuts.walk.as_ref(),
            shortcuts.maximize_all.as_ref(),
            shortcuts.wheel.as_ref(),
            shortcuts.rune_table.as_ref(),
        ]
        .into_iter()
        .flatten()
        .map(Shortcut::as_str)
        .collect::<Vec<_>>();

        assert_eq!(bound.len(), 8);

        let mut unique = bound.clone();
        unique.sort_unstable();
        unique.dedup();
        assert_eq!(
            unique.len(),
            8,
            "two actions share a combination: {bound:?}"
        );
    }

    #[test]
    fn the_wheel_opens_on_the_same_combination_on_both_machines() {
        assert_eq!(
            Shortcuts::default().wheel.as_ref().map(Shortcut::as_str),
            Some("Control+Shift+KeyW")
        );
        assert_eq!(
            Shortcuts::default()
                .rune_table
                .as_ref()
                .map(Shortcut::as_str),
            Some("Control+Shift+KeyR")
        );
    }

    #[test]
    fn the_wheel_has_a_width_of_its_own_until_the_gauge_is_moved() {
        assert_eq!(Wheel::default().diameter, DEFAULT_DIAMETER);
        assert!((WHEEL_SMALLEST..=WHEEL_WIDEST).contains(&DEFAULT_DIAMETER));
        assert_eq!(
            serde_json::from_str::<Wheel>("{}").expect("a wheel with nothing in it"),
            Wheel::default()
        );
    }

    #[test]
    fn a_diameter_lands_on_a_step_of_the_gauge_and_never_leaves_its_ends() {
        let mut wheel = Wheel::default();

        wheel.set_diameter(0);
        assert_eq!(wheel.diameter, WHEEL_SMALLEST);

        wheel.set_diameter(u32::MAX);
        assert_eq!(wheel.diameter, WHEEL_WIDEST);

        wheel.set_diameter(333);
        assert_eq!(wheel.diameter, 340);

        wheel.set_diameter(300);
        assert_eq!(wheel.diameter, 300);
    }

    #[test]
    fn the_rune_table_starts_on_one_window_at_a_width_of_its_own() {
        let rune_table = RuneTable::default();

        assert_eq!(rune_table.width, DEFAULT_RUNE_TABLE_WIDTH);
        assert!((RUNE_TABLE_NARROWEST..=RUNE_TABLE_WIDEST).contains(&DEFAULT_RUNE_TABLE_WIDTH));
        assert_eq!(rune_table.offset, None);
        assert!(!rune_table.everywhere);
        assert_eq!(
            serde_json::from_str::<RuneTable>("{}").expect("a rune table with nothing in it"),
            rune_table
        );
    }

    #[test]
    fn a_width_lands_on_a_step_of_the_gauge_and_never_leaves_its_ends() {
        let mut rune_table = RuneTable::default();

        rune_table.set_width(0);
        assert_eq!(rune_table.width, RUNE_TABLE_NARROWEST);

        rune_table.set_width(u32::MAX);
        assert_eq!(rune_table.width, RUNE_TABLE_WIDEST);

        rune_table.set_width(433);
        assert_eq!(rune_table.width, 440);

        rune_table.set_width(400);
        assert_eq!(rune_table.width, 400);
    }

    #[test]
    fn the_place_of_the_rune_table_crosses_the_file_as_two_numbers() {
        let rune_table = RuneTable {
            width: 480,
            transparency: 25,
            offset: Some(RuneOffset { x: 24.5, y: -12.0 }),
            everywhere: true,
        };

        let json = serde_json::to_string(&rune_table).expect("a rune table serialises");

        assert_eq!(
            json,
            r#"{"width":480,"transparency":25,"offset":{"x":24.5,"y":-12.0},"everywhere":true}"#
        );
        assert_eq!(
            serde_json::from_str::<RuneTable>(&json).expect("a rune table reads back"),
            rune_table
        );
    }

    #[test]
    fn a_shortcut_is_stored_as_the_plain_text_the_plugin_reads() {
        let shortcuts = Shortcuts {
            next: Shortcut::new("Alt+Tab"),
            previous: None,
            main: None,
            toggle_excluded: None,
            walk: None,
            maximize_all: None,
            wheel: None,
            rune_table: None,
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
    fn a_first_launch_offers_one_quick_reply_to_start_from() {
        let quick_replies = Settings::default().quick_replies;

        assert_eq!(quick_replies.len(), 1);
        assert_eq!(quick_replies[0].text, FIRST_QUICK_REPLY);
        assert!(quick_replies[0].shortcut.is_none());
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
        assert_eq!(settings.quick_replies, Settings::default().quick_replies);
    }
}
