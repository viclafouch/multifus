use serde::Deserialize;
use serde::Serialize;

use crate::app::journal::JournalEntry;
use crate::app::journal::RelayFailure;
use crate::config::BannerCorner;
use crate::config::QuickReplyId;
use crate::domain::Class;
use crate::domain::Gender;
use crate::domain::NotificationKind;
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

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub version: String,
    pub system: String,
    pub characters: Vec<CharacterView>,
    pub shortcuts: Vec<ShortcutView>,
    pub quick_replies: Vec<QuickReplyView>,
    pub auto_focus: Vec<AutoFocusView>,
    pub auto_focus_enabled: bool,
    pub wakes_minimized: bool,
    pub start_at_login: bool,
    pub maximize_on_launch: bool,
    pub short_titles: bool,
    pub ungroup_taskbar: bool,
    pub taskbar_combines: bool,
    pub authorization: AuthorizationView,
    pub config: ConfigView,
    pub update: UpdateView,
    pub relay: RelayView,
    pub walk: WalkView,
    pub journal: Vec<JournalEntry>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WalkView {
    pub enabled: bool,
    pub supported: bool,
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
pub struct BannerScreenView {
    pub name: Option<String>,
    pub width: u32,
    pub height: u32,
    pub primary: bool,
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
    AutoFocus,
    Walk,
    Relay,
    Settings,
    About,
}

impl Screen {
    pub const ALL: [Self; 7] = [
        Self::Characters,
        Self::Shortcuts,
        Self::AutoFocus,
        Self::Walk,
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
    pub asleep: bool,
    pub online: bool,
    pub relayed: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ShortcutAction {
    Next,
    Previous,
    ToggleAsleep,
    Swap,
    Walk,
}

impl ShortcutAction {
    pub const ALL: [Self; 5] = [
        Self::Next,
        Self::Previous,
        Self::ToggleAsleep,
        Self::Swap,
        Self::Walk,
    ];
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum Binding {
    Action { action: ShortcutAction },
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
    Pending,

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
