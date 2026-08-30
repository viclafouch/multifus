use serde::Deserialize;
use serde::Serialize;

use crate::app::journal::JournalEntry;
use crate::app::journal::RelayFailure;
use crate::config::BannerCorner;
use crate::config::QuickReplyId;
use crate::domain::Class;
use crate::domain::Gender;
use crate::domain::NotificationKind;
use crate::platform::KeyLabels;
use crate::platform::ScreenSaverDelay;

impl From<ScreenSaverDelay> for ScreenSaverView {
    fn from(delay: ScreenSaverDelay) -> Self {
        match delay {
            ScreenSaverDelay::Never => Self::Never,
            ScreenSaverDelay::After(after) => Self::After {
                seconds: after.as_secs(),
            },
            ScreenSaverDelay::Unknown => Self::Unknown,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub version: String,
    pub system: String,
    pub keyboard: KeyLabels,
    pub characters: Vec<CharacterView>,
    pub shortcuts: Vec<ShortcutView>,
    pub quick_replies: Vec<QuickReplyView>,
    pub auto_focus: Vec<AutoFocusView>,
    pub auto_focus_enabled: bool,
    pub wakes_minimized: bool,
    pub start_at_login: bool,
    pub maximize_on_launch: bool,
    pub short_titles: bool,
    pub paint_portraits: bool,
    pub ungroup_taskbar: bool,
    pub taskbar_combines: bool,
    pub authorization: AuthorizationView,
    pub config: ConfigView,
    pub update: UpdateView,
    pub relay: RelayView,
    pub walk: WalkView,
    pub wheel: WheelView,
    pub rune_table: RuneTableView,
    pub journal: Vec<JournalEntry>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientsView {
    pub open: usize,
    pub small: usize,
    pub readable: bool,
}

impl ClientsView {
    pub const UNREADABLE: Self = Self {
        open: 0,
        small: 0,
        readable: false,
    };
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WalkView {
    pub enabled: bool,
    pub banner: BannerView,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BannerView {
    pub corner: BannerCorner,
    pub screen: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DisplayView {
    pub name: Option<String>,
    pub width: u32,
    pub height: u32,
    pub primary: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WheelView {
    pub diameter: u32,
    pub smallest: u32,
    pub widest: u32,
    pub step: u32,
    pub dead_zone: f64,
    pub demo: Vec<WheelSlice>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuneTableView {
    pub width: u32,
    pub narrowest: u32,
    pub widest: u32,
    pub step: u32,
    pub transparency: u32,
    pub clearest: u32,
    pub veil_step: u32,
    pub everywhere: bool,
    pub previewing: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WheelStep {
    pub diameter: u32,
    pub dead_zone: f64,
    pub slices: Vec<WheelSlice>,
    pub hovered: Option<usize>,
    pub previewing: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WheelSlice {
    pub nickname: String,
    pub class: Option<Class>,
    pub gender: Option<Gender>,
    pub main: bool,
    pub here: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BannerStep {
    pub corner: BannerCorner,
    pub character: Option<BannerCharacter>,
    pub previewing: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BannerCharacter {
    pub nickname: String,
    pub class: Option<Class>,
    pub gender: Option<Gender>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RelayView {
    pub paired: bool,
    pub send_body: bool,
    pub active: bool,
    pub ready: bool,
    pub screen_saver: ScreenSaverView,
    pub pairing: PairingView,
    pub switch: SwitchView,
    pub test: TestView,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum SwitchView {
    Idle,

    Starting,

    Failed { reason: RelayFailure },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum TestView {
    Idle,

    Working,

    Sent,

    Failed { reason: RelayFailure },

    TooSoon,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ScreenSaverView {
    Never,

    After { seconds: u64 },

    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum PairingView {
    Idle,

    Working,

    Failed { problem: PairingProblem },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum PairingProblem {
    TokenBlank,

    TokenRefused { detail: String },

    NoChat,

    Keychain { detail: String },

    Network { detail: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum UpdateView {
    Checking,

    UpToDate,

    Available { version: String },

    Installing,

    Failed { detail: String },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Screen {
    Characters,
    Shortcuts,
    QuickReplies,
    AutoFocus,
    Walk,
    Wheel,
    RuneTable,
    Relay,
    Settings,
    About,
}

impl Screen {
    pub const ALL: [Self; 10] = [
        Self::Characters,
        Self::Shortcuts,
        Self::QuickReplies,
        Self::AutoFocus,
        Self::Walk,
        Self::Wheel,
        Self::RuneTable,
        Self::Relay,
        Self::Settings,
        Self::About,
    ];
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterView {
    pub nickname: String,
    pub gender: Option<Gender>,
    pub class: Option<Class>,
    pub main: bool,
    pub excluded: bool,
    pub online: bool,
    pub relayed: bool,
    pub shortcut: Option<String>,
    pub shortcut_status: ShortcutStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ShortcutAction {
    Next,
    Previous,
    Main,
    ToggleExcluded,
    Walk,
    MaximizeAll,
    Wheel,
    RuneTable,
}

impl ShortcutAction {
    pub const ALL: [Self; 8] = [
        Self::Next,
        Self::Previous,
        Self::Main,
        Self::ToggleExcluded,
        Self::Walk,
        Self::MaximizeAll,
        Self::Wheel,
        Self::RuneTable,
    ];

    #[must_use]
    pub fn matches_held(self) -> bool {
        matches!(self, Self::Wheel)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum Binding {
    Action { action: ShortcutAction },
    Character { nickname: String },
    QuickReply { id: QuickReplyId },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutView {
    pub action: ShortcutAction,
    pub accelerator: Option<String>,
    pub status: ShortcutStatus,
    pub is_default: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuickReplyView {
    pub id: QuickReplyId,
    pub text: String,
    pub accelerator: Option<String>,
    pub status: ShortcutStatus,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BindingView {
    pub binding: Binding,
    pub accelerator: Option<String>,
    pub status: ShortcutStatus,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ShortcutStatus {
    Unbound,

    Registered,

    Invalid { detail: String },

    Duplicate { binding: Binding },

    Refused { detail: String },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoFocusView {
    pub kind: NotificationKind,
    pub enabled: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorizationView {
    pub granted: bool,
    pub listening: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigView {
    pub path: String,
    pub problem: Option<ConfigProblem>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ConfigProblem {
    Unreadable {
        detail: String,
    },

    Malformed {
        detail: String,
        quarantined: Option<String>,
    },

    NotSetAside {
        detail: String,
    },

    NotSaved {
        detail: String,
    },
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use serde_json::json;
    use serde_json::Value;

    use super::*;
    use crate::app::journal::JournalEntry;
    use crate::app::journal::JournalEvent;
    use crate::app::journal::Launch;
    use crate::app::journal::RelayFailure;

    fn json_of<T: Serialize>(value: &T) -> Value {
        serde_json::to_value(value).expect("what crosses the bridge is JSON")
    }

    fn keys_of<T: Serialize>(value: &T) -> Vec<String> {
        let mut keys = json_of(value)
            .as_object()
            .expect("an object crosses the bridge")
            .keys()
            .cloned()
            .collect::<Vec<_>>();

        keys.sort();

        keys
    }

    fn kinds_of<T: Serialize>(values: &[T]) -> Vec<String> {
        values
            .iter()
            .map(|value| {
                json_of(value)["kind"]
                    .as_str()
                    .expect("a tagged value says its kind")
                    .to_owned()
            })
            .collect()
    }

    fn detail() -> String {
        "détail".to_owned()
    }

    fn slice() -> WheelSlice {
        WheelSlice {
            nickname: "Bravo".to_owned(),
            class: Some(Class::Cra),
            gender: Some(Gender::Female),
            main: false,
            here: true,
        }
    }

    fn snapshot() -> Snapshot {
        Snapshot {
            version: "0.1.0".to_owned(),
            system: "macos 15.0 aarch64".to_owned(),
            keyboard: KeyLabels::new(),
            characters: vec![character()],
            shortcuts: vec![ShortcutView {
                action: ShortcutAction::Next,
                accelerator: Some("Control+Shift+Right".to_owned()),
                status: ShortcutStatus::Registered,
                is_default: true,
            }],
            quick_replies: vec![QuickReplyView {
                id: QuickReplyId::default(),
                text: "Bon jeu à toi !".to_owned(),
                accelerator: None,
                status: ShortcutStatus::Unbound,
            }],
            auto_focus: vec![AutoFocusView {
                kind: NotificationKind::Combat,
                enabled: true,
            }],
            auto_focus_enabled: true,
            wakes_minimized: true,
            start_at_login: false,
            maximize_on_launch: false,
            short_titles: false,
            paint_portraits: true,
            ungroup_taskbar: false,
            taskbar_combines: true,
            authorization: AuthorizationView {
                granted: true,
                listening: true,
            },
            config: ConfigView {
                path: "/tmp/multifus.json".to_owned(),
                problem: None,
            },
            update: UpdateView::UpToDate,
            relay: relay(),
            walk: WalkView {
                enabled: false,
                banner: BannerView {
                    corner: BannerCorner::BottomRight,
                    screen: None,
                },
            },
            wheel: WheelView {
                diameter: 400,
                smallest: 280,
                widest: 720,
                step: 20,
                dead_zone: 0.32,
                demo: vec![slice()],
            },
            rune_table: rune_table(),
            journal: vec![JournalEntry {
                id: 1,
                at: 0,
                event: JournalEvent::Started {
                    version: "0.1.0".to_owned(),
                    system: "macos 15.0 aarch64".to_owned(),
                    launch: Launch::ByHand,
                },
            }],
        }
    }

    fn character() -> CharacterView {
        CharacterView {
            nickname: "Alpha".to_owned(),
            gender: Some(Gender::Male),
            class: Some(Class::Iop),
            main: false,
            excluded: false,
            online: true,
            relayed: true,
            shortcut: Some("F1".to_owned()),
            shortcut_status: ShortcutStatus::Registered,
        }
    }

    fn rune_table() -> RuneTableView {
        RuneTableView {
            width: 420,
            narrowest: 320,
            widest: 560,
            step: 20,
            transparency: 0,
            clearest: 100,
            veil_step: 5,
            everywhere: false,
            previewing: false,
        }
    }

    fn relay() -> RelayView {
        RelayView {
            paired: true,
            send_body: false,
            active: false,
            ready: true,
            screen_saver: ScreenSaverView::Never,
            pairing: PairingView::Idle,
            switch: SwitchView::Idle,
            test: TestView::Idle,
        }
    }

    #[test]
    fn the_window_is_handed_every_field_it_reads_and_no_other() {
        assert_eq!(
            keys_of(&snapshot()),
            [
                "authorization",
                "autoFocus",
                "autoFocusEnabled",
                "characters",
                "config",
                "journal",
                "keyboard",
                "maximizeOnLaunch",
                "paintPortraits",
                "quickReplies",
                "relay",
                "runeTable",
                "shortTitles",
                "shortcuts",
                "startAtLogin",
                "system",
                "taskbarCombines",
                "ungroupTaskbar",
                "update",
                "version",
                "wakesMinimized",
                "walk",
                "wheel",
            ]
        );
    }

    #[test]
    fn a_character_crosses_with_everything_a_row_shows_of_it() {
        assert_eq!(
            json_of(&character()),
            json!({
                "nickname": "Alpha",
                "gender": "male",
                "class": "iop",
                "main": false,
                "excluded": false,
                "online": true,
                "relayed": true,
                "shortcut": "F1",
                "shortcutStatus": { "kind": "registered" },
            })
        );
    }

    #[test]
    fn a_character_nobody_has_given_keys_to_crosses_with_nothing_rather_than_a_gap() {
        let bare = CharacterView {
            shortcut: None,
            shortcut_status: ShortcutStatus::Unbound,
            ..character()
        };

        assert_eq!(json_of(&bare)["shortcut"], Value::Null);
        assert_eq!(json_of(&bare)["shortcutStatus"]["kind"], json!("unbound"));
    }

    #[test]
    fn a_character_without_a_class_or_a_sex_crosses_as_nothing_rather_than_as_a_gap() {
        let bare = CharacterView {
            gender: None,
            class: None,
            ..character()
        };

        assert_eq!(json_of(&bare)["gender"], Value::Null);
        assert_eq!(json_of(&bare)["class"], Value::Null);
    }

    #[test]
    fn the_twelve_classes_and_the_two_sexes_travel_in_the_case_of_the_file() {
        let classes = Class::ALL
            .into_iter()
            .map(|class| {
                json_of(&class)
                    .as_str()
                    .expect("a class is a word")
                    .to_owned()
            })
            .collect::<Vec<_>>();

        assert_eq!(
            classes,
            [
                "feca", "osamodas", "enutrof", "sram", "xelor", "ecaflip", "eniripsa", "iop",
                "cra", "sadida", "sacrieur", "pandawa",
            ]
        );
        assert_eq!(json_of(&Gender::Male), json!("male"));
        assert_eq!(json_of(&Gender::Female), json!("female"));
    }

    #[test]
    fn the_seven_kinds_of_notification_travel_under_the_names_the_screen_uses() {
        let kinds = NotificationKind::ALL
            .into_iter()
            .map(|kind| {
                json_of(&kind)
                    .as_str()
                    .expect("a kind is a word")
                    .to_owned()
            })
            .collect::<Vec<_>>();

        assert_eq!(
            kinds,
            [
                "combat",
                "trade",
                "group",
                "private_message",
                "challenge",
                "craft",
                "perceptor",
            ]
        );
    }

    #[test]
    fn a_switch_of_the_autofocus_carries_its_kind_and_its_state() {
        assert_eq!(
            json_of(&AutoFocusView {
                kind: NotificationKind::PrivateMessage,
                enabled: false,
            }),
            json!({ "kind": "private_message", "enabled": false })
        );
    }

    #[test]
    fn the_rune_table_hands_the_screen_its_gauge_its_switch_and_whether_it_is_previewing() {
        assert_eq!(
            json_of(&rune_table()),
            json!({
                "width": 420,
                "narrowest": 320,
                "widest": 560,
                "step": 20,
                "transparency": 0,
                "clearest": 100,
                "veilStep": 5,
                "everywhere": false,
                "previewing": false,
            })
        );
    }

    #[test]
    fn the_eight_actions_travel_under_the_names_the_shortcuts_screen_uses() {
        let actions = ShortcutAction::ALL
            .into_iter()
            .map(|action| {
                json_of(&action)
                    .as_str()
                    .expect("an action is a word")
                    .to_owned()
            })
            .collect::<Vec<_>>();

        assert_eq!(
            actions,
            [
                "next",
                "previous",
                "main",
                "toggleExcluded",
                "walk",
                "maximizeAll",
                "wheel",
                "runeTable",
            ]
        );
    }

    #[test]
    fn the_wheel_is_the_only_action_that_answers_to_a_key_held_down() {
        let held = ShortcutAction::ALL
            .into_iter()
            .filter(|action| action.matches_held())
            .collect::<Vec<_>>();

        assert_eq!(held, vec![ShortcutAction::Wheel]);
        assert!(
            !ShortcutAction::RuneTable.matches_held(),
            "the rune table answers to a key struck, and stays once it is let go"
        );
    }

    #[test]
    fn a_binding_is_an_action_a_character_or_a_quick_reply_and_says_which() {
        assert_eq!(
            json_of(&Binding::Action {
                action: ShortcutAction::ToggleExcluded
            }),
            json!({ "kind": "action", "action": "toggleExcluded" })
        );
        assert_eq!(
            json_of(&Binding::Character {
                nickname: "Alpha".to_owned()
            }),
            json!({ "kind": "character", "nickname": "Alpha" })
        );
        assert_eq!(
            json_of(&Binding::QuickReply {
                id: QuickReplyId::default()
            }),
            json!({ "kind": "quickReply", "id": 0 })
        );
    }

    #[test]
    fn every_state_a_combination_can_be_in_says_its_kind() {
        let statuses = [
            ShortcutStatus::Unbound,
            ShortcutStatus::Registered,
            ShortcutStatus::Invalid { detail: detail() },
            ShortcutStatus::Duplicate {
                binding: Binding::Action {
                    action: ShortcutAction::Next,
                },
            },
            ShortcutStatus::Refused { detail: detail() },
        ];

        assert_eq!(
            kinds_of(&statuses),
            ["unbound", "registered", "invalid", "duplicate", "refused",]
        );
        assert_eq!(
            json_of(&statuses[3])["binding"],
            json!({ "kind": "action", "action": "next" })
        );
    }

    #[test]
    fn a_shortcut_row_carries_the_combination_and_whether_it_is_the_first_day_one() {
        let view = ShortcutView {
            action: ShortcutAction::Walk,
            accelerator: None,
            status: ShortcutStatus::Unbound,
            is_default: false,
        };

        assert_eq!(
            keys_of(&view),
            ["accelerator", "action", "isDefault", "status"]
        );
        assert_eq!(json_of(&view)["accelerator"], Value::Null);
    }

    #[test]
    fn a_quick_reply_carries_its_identifier_its_line_and_its_combination() {
        let view = QuickReplyView {
            id: QuickReplyId::default().next(),
            text: "Bon jeu à toi !".to_owned(),
            accelerator: Some("Alt+KeyP".to_owned()),
            status: ShortcutStatus::Registered,
        };

        assert_eq!(
            json_of(&view),
            json!({
                "id": 1,
                "text": "Bon jeu à toi !",
                "accelerator": "Alt+KeyP",
                "status": { "kind": "registered" },
            })
        );
    }

    #[test]
    fn a_bound_combination_carries_what_the_journal_line_shows() {
        let view = BindingView {
            binding: Binding::QuickReply {
                id: QuickReplyId::default(),
            },
            accelerator: Some("Alt+KeyP".to_owned()),
            status: ShortcutStatus::Registered,
        };

        assert_eq!(keys_of(&view), ["accelerator", "binding", "status"]);
    }

    #[test]
    fn every_state_of_an_update_says_its_kind() {
        let updates = [
            UpdateView::Checking,
            UpdateView::UpToDate,
            UpdateView::Available {
                version: "0.2.0".to_owned(),
            },
            UpdateView::Installing,
            UpdateView::Failed { detail: detail() },
        ];

        assert_eq!(
            kinds_of(&updates),
            ["checking", "upToDate", "available", "installing", "failed"]
        );
        assert_eq!(json_of(&updates[2])["version"], json!("0.2.0"));
    }

    #[test]
    fn every_problem_the_configuration_can_have_says_its_kind() {
        let problems = [
            ConfigProblem::Unreadable { detail: detail() },
            ConfigProblem::Malformed {
                detail: detail(),
                quarantined: Some("/tmp/multifus.json.bad".to_owned()),
            },
            ConfigProblem::NotSetAside { detail: detail() },
            ConfigProblem::NotSaved { detail: detail() },
        ];

        assert_eq!(
            kinds_of(&problems),
            ["unreadable", "malformed", "notSetAside", "notSaved"]
        );
        assert_eq!(
            json_of(&problems[1])["quarantined"],
            json!("/tmp/multifus.json.bad")
        );
    }

    #[test]
    fn the_configuration_carries_its_path_and_nothing_wrong_when_nothing_is_wrong() {
        let view = ConfigView {
            path: "/tmp/multifus.json".to_owned(),
            problem: None,
        };

        assert_eq!(
            json_of(&view),
            json!({ "path": "/tmp/multifus.json", "problem": null })
        );
    }

    #[test]
    fn the_relay_hands_the_screen_each_of_its_switches() {
        assert_eq!(
            keys_of(&relay()),
            [
                "active",
                "paired",
                "pairing",
                "ready",
                "screenSaver",
                "sendBody",
                "switch",
                "test",
            ]
        );
    }

    #[test]
    fn every_problem_a_pairing_can_have_says_its_kind() {
        let problems = [
            PairingProblem::TokenBlank,
            PairingProblem::TokenRefused { detail: detail() },
            PairingProblem::NoChat,
            PairingProblem::Keychain { detail: detail() },
            PairingProblem::Network { detail: detail() },
        ];

        assert_eq!(
            kinds_of(&problems),
            [
                "tokenBlank",
                "tokenRefused",
                "noChat",
                "keychain",
                "network"
            ]
        );
    }

    #[test]
    fn every_state_of_a_pairing_says_its_kind() {
        let pairings = [
            PairingView::Idle,
            PairingView::Working,
            PairingView::Failed {
                problem: PairingProblem::NoChat,
            },
        ];

        assert_eq!(kinds_of(&pairings), ["idle", "working", "failed"]);
        assert_eq!(json_of(&pairings[2])["problem"]["kind"], json!("noChat"));
    }

    #[test]
    fn every_state_of_the_switch_and_of_the_test_says_its_kind() {
        let switches = [
            SwitchView::Idle,
            SwitchView::Starting,
            SwitchView::Failed {
                reason: RelayFailure::Network { detail: detail() },
            },
        ];
        let tests = [
            TestView::Idle,
            TestView::Working,
            TestView::Sent,
            TestView::Failed {
                reason: RelayFailure::Telegram { detail: detail() },
            },
            TestView::TooSoon,
        ];

        assert_eq!(kinds_of(&switches), ["idle", "starting", "failed"]);
        assert_eq!(
            kinds_of(&tests),
            ["idle", "working", "sent", "failed", "tooSoon"]
        );
        assert_eq!(json_of(&switches[2])["reason"]["reason"], json!("network"));
    }

    #[test]
    fn the_delay_of_the_screen_saver_crosses_as_the_seconds_the_warning_shows() {
        assert_eq!(
            json_of(&ScreenSaverView::from(ScreenSaverDelay::After(
                Duration::from_secs(600)
            ))),
            json!({ "kind": "after", "seconds": 600 })
        );
        assert_eq!(
            json_of(&ScreenSaverView::from(ScreenSaverDelay::Never)),
            json!({ "kind": "never" })
        );
        assert_eq!(
            json_of(&ScreenSaverView::from(ScreenSaverDelay::Unknown)),
            json!({ "kind": "unknown" })
        );
    }

    #[test]
    fn the_authorization_says_whether_it_was_granted_and_whether_multifus_listens() {
        assert_eq!(
            json_of(&AuthorizationView {
                granted: false,
                listening: false,
            }),
            json!({ "granted": false, "listening": false })
        );
    }

    #[test]
    fn the_walk_carries_its_switch_and_the_place_of_its_banner() {
        let view = WalkView {
            enabled: true,
            banner: BannerView {
                corner: BannerCorner::TopLeft,
                screen: Some("Écran interne".to_owned()),
            },
        };

        assert_eq!(
            json_of(&view),
            json!({
                "enabled": true,
                "banner": { "corner": "topLeft", "screen": "Écran interne" },
            })
        );
    }

    #[test]
    fn the_four_corners_travel_under_the_names_the_walk_screen_uses() {
        let corners = [
            BannerCorner::TopLeft,
            BannerCorner::TopRight,
            BannerCorner::BottomLeft,
            BannerCorner::BottomRight,
        ]
        .map(|corner| json_of(&corner));

        assert_eq!(
            corners,
            [
                json!("topLeft"),
                json!("topRight"),
                json!("bottomLeft"),
                json!("bottomRight"),
            ]
        );
    }

    #[test]
    fn a_screen_carries_its_name_its_size_and_whether_it_is_the_main_one() {
        assert_eq!(
            json_of(&DisplayView {
                name: None,
                width: 1920,
                height: 1080,
                primary: true,
            }),
            json!({ "name": null, "width": 1920, "height": 1080, "primary": true })
        );
    }

    #[test]
    fn the_wheel_hands_the_screen_its_gauge_and_the_two_ends_of_it() {
        assert_eq!(
            json_of(&WheelView {
                diameter: 400,
                smallest: 280,
                widest: 720,
                step: 20,
                dead_zone: 0.32,
                demo: vec![slice()],
            }),
            json!({
                "diameter": 400,
                "smallest": 280,
                "widest": 720,
                "step": 20,
                "deadZone": 0.32,
                "demo": [{
                    "nickname": "Bravo",
                    "class": "cra",
                    "gender": "female",
                    "main": false,
                    "here": true,
                }],
            })
        );
    }

    #[test]
    fn a_step_of_the_wheel_carries_every_slice_and_the_one_under_the_cursor() {
        let step = WheelStep {
            diameter: 400,
            dead_zone: 0.32,
            slices: vec![WheelSlice {
                nickname: "Bravo".to_owned(),
                class: Some(Class::Cra),
                gender: Some(Gender::Female),
                main: true,
                here: false,
            }],
            hovered: Some(0),
            previewing: false,
        };

        assert_eq!(
            json_of(&step),
            json!({
                "diameter": 400,
                "deadZone": 0.32,
                "slices": [{
                    "nickname": "Bravo",
                    "class": "cra",
                    "gender": "female",
                    "main": true,
                    "here": false,
                }],
                "hovered": 0,
                "previewing": false,
            })
        );
    }

    #[test]
    fn a_wheel_nobody_is_pointing_at_carries_no_slice_at_all() {
        let step = WheelStep {
            diameter: 400,
            dead_zone: 0.32,
            slices: Vec::new(),
            hovered: None,
            previewing: true,
        };

        assert_eq!(json_of(&step)["hovered"], Value::Null);
        assert_eq!(json_of(&step)["slices"], json!([]));
    }

    #[test]
    fn a_step_of_the_banner_names_the_character_it_landed_on() {
        let step = BannerStep {
            corner: BannerCorner::BottomRight,
            character: Some(BannerCharacter {
                nickname: "Alpha".to_owned(),
                class: Some(Class::Cra),
                gender: Some(Gender::Female),
            }),
            previewing: false,
        };

        assert_eq!(
            json_of(&step),
            json!({
                "corner": "bottomRight",
                "character": {
                    "nickname": "Alpha",
                    "class": "cra",
                    "gender": "female",
                },
                "previewing": false,
            })
        );
    }

    #[test]
    fn a_step_that_landed_on_nobody_carries_no_character_at_all() {
        let step = BannerStep {
            corner: BannerCorner::BottomRight,
            character: None,
            previewing: true,
        };

        assert_eq!(json_of(&step)["character"], Value::Null);
        assert_eq!(json_of(&step)["previewing"], json!(true));
    }

    #[test]
    fn the_ten_screens_travel_under_the_names_the_rail_answers_to() {
        let screens = Screen::ALL.map(|screen| json_of(&screen));

        assert_eq!(
            screens,
            [
                json!("characters"),
                json!("shortcuts"),
                json!("quickReplies"),
                json!("autoFocus"),
                json!("walk"),
                json!("wheel"),
                json!("runeTable"),
                json!("relay"),
                json!("settings"),
                json!("about"),
            ]
        );
    }
}
