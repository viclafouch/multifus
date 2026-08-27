use std::collections::VecDeque;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

use serde::Serialize;

use crate::app::journal_file;
use crate::app::view::BindingView;
use crate::app::view::ShortcutAction;
use crate::domain::Class;
use crate::domain::Gender;
use crate::domain::NotificationKind;

const CAPACITY: usize = 200;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Work {
    Scan,
    Shortcuts,
    Tray,
    Walk,
    Banner,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntry {
    pub id: u64,
    pub at: u64,
    pub event: JournalEvent,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum JournalEvent {
    Started {
        version: String,
        system: String,
        launch: Launch,
    },

    ConfigLoadFailed {
        detail: String,
        quarantined: Option<String>,
    },

    ConfigNotSetAside {
        detail: String,
    },

    Authorization {
        granted: bool,
    },

    AuthorizationRequested {
        granted: bool,
        failure: Option<String>,
    },

    Listening,

    ListeningFailed {
        detail: String,
    },

    NotificationUnreadable {
        detail: String,
    },

    CharacterOnline {
        nickname: String,
    },

    CharacterOffline {
        nickname: String,
    },

    Notification {
        nickname: String,
        notification_kind: Option<NotificationKind>,
        outcome: Outcome,
    },

    Roster {
        change: RosterChange,
    },

    Setting {
        change: SettingChange,
    },

    ShortcutsBound {
        bindings: Vec<BindingView>,
    },

    ShortcutsFailed {
        detail: String,
    },

    Shortcut {
        action: ShortcutAction,
        outcome: ShortcutOutcome,
    },

    QuickReplyPasted {
        excerpt: String,
    },

    QuickReplyFailed {
        reason: QuickReplyFailure,
    },

    ClientMaximized,

    ClientMaximizeFailed {
        detail: String,
    },

    ShortTitlesFailed {
        detail: String,
    },

    WindowIconFailed {
        detail: String,
    },

    TrayFocus {
        nickname: String,
        outcome: TrayOutcome,
    },

    TrayFailed {
        detail: String,
    },

    WindowFailed {
        detail: String,
    },

    SnapshotFailed {
        detail: String,
    },

    StartAtLoginReconciled {
        enabled: bool,
    },

    StartAtLoginFailed {
        detail: String,
    },

    Panicked {
        work: Work,
    },

    ScanFailed {
        detail: String,
    },

    SaveFailed {
        detail: String,
    },

    UpdateAvailable {
        version: String,
    },

    UpdateUpToDate,

    UpdateFailed {
        detail: String,
    },

    OpenFailed {
        detail: String,
    },

    RelayPaired,

    RelayUnpaired,

    RelayFailed {
        reason: RelayFailure,
    },

    RelayEnabled {
        surface: Surface,
    },

    RelayDisabled {
        reason: RelayStop,
    },

    RelaySent {
        nickname: String,
    },

    RelayNoticeSent {
        case: NoticeCase,
    },

    RelayTestSent,

    WalkEnabled {
        enabled: bool,
        from: WalkFrom,
    },

    WalkIdle {
        reason: WalkIdle,
    },

    WalkListeningResumed,

    WalkListeningLost,

    WalkListeningRefused {
        detail: String,
    },

    WalkSwitchFailed {
        detail: String,
    },

    BannerFailed {
        detail: String,
    },

    DisplayAwake {
        held: bool,
    },

    DisplayAwakeFailed {
        detail: String,
    },

    Reset,

    Quit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Launch {
    ByHand,
    Session,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum RosterChange {
    Excluded {
        nickname: String,
    },

    Included {
        nickname: String,
    },

    GenderExcluded {
        gender: Gender,
        excluded: bool,
    },

    GenderAssigned {
        nickname: String,
        gender: Option<Gender>,
    },

    ClassAssigned {
        nickname: String,
        class: Option<Class>,
    },

    Reordered {
        order: Vec<String>,
    },

    Removed {
        nickname: String,
    },

    Relayed {
        nickname: String,
        relayed: bool,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum SettingChange {
    AutoFocusEnabled {
        enabled: bool,
        from: Surface,
    },

    AutoFocusKind {
        notification_kind: NotificationKind,
        enabled: bool,
    },

    WakesMinimized {
        wakes: bool,
        from: Surface,
    },

    MaximizeOnLaunch {
        maximize: bool,
    },

    ShortTitles {
        short: bool,
    },

    PaintPortraits {
        paint: bool,
    },

    UngroupTaskbar {
        ungroup: bool,
    },

    RelayBody {
        send_body: bool,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "reason",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum RelayFailure {
    Keychain { detail: String },

    Telegram { detail: String },

    Network { detail: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "reason",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum QuickReplyFailure {
    OutsideGame,

    ForegroundUnknown { detail: String },

    Gone,

    ClipboardRefused { detail: String },

    PasteRefused { detail: String },

    ClipboardNotGivenBack { detail: String },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum RelayStop {
    Shortcut,

    Tray,

    Window,

    NoRelayedCharacter,

    NoLongerPaired,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum NoticeCase {
    Enabled,

    Disabled,

    Disconnected,

    Both,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Surface {
    Window,
    Tray,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum WalkFrom {
    Window,
    Tray,
    Shortcut,
    ListeningLost,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum WalkIdle {
    NobodyInCycle,
    TooSlow,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "outcome", rename_all = "camelCase")]
pub enum Outcome {
    Focused,

    KindDisabled,

    KindUnknown,

    BodyUnread,

    Excluded,

    NoWindow,

    LeftMinimized,

    FocusFailed { detail: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "outcome", rename_all = "camelCase")]
pub enum TrayOutcome {
    Focused,

    NoWindow,

    FocusFailed { detail: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "outcome", rename_all = "camelCase")]
pub enum ShortcutOutcome {
    Focused { nickname: String },

    Excluded { nickname: String },

    Included { nickname: String },

    Swapped { kept: Gender },

    OutsideGame,

    NotInRoster { nickname: String },

    NobodyInCycle,

    Walk { enabled: bool },

    NoGender,

    NoWindow { nickname: String },

    FocusFailed { nickname: String, detail: String },

    ForegroundUnknown { detail: String },
}

#[derive(Debug, Default)]
pub struct Journal {
    entries: VecDeque<JournalEntry>,
    next_id: u64,
}

impl Journal {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn push(&mut self, event: JournalEvent) {
        if self.entries.len() == CAPACITY {
            self.entries.pop_front();
        }

        let entry = JournalEntry {
            id: self.next_id,
            at: now_in_milliseconds(),
            event,
        };

        journal_file::append(&entry);

        self.entries.push_back(entry);
        self.next_id = self.next_id.wrapping_add(1);
    }

    pub fn push_unless_repeated(&mut self, event: JournalEvent) -> bool {
        if self.entries.back().map(|entry| &entry.event) == Some(&event) {
            return false;
        }

        self.push(event);

        true
    }

    #[must_use]
    pub fn entries(&self) -> Vec<JournalEntry> {
        self.entries.iter().cloned().collect()
    }
}

fn now_in_milliseconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|elapsed| u64::try_from(elapsed.as_millis()).unwrap_or(u64::MAX))
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_journal_keeps_the_most_recent_entries_in_memory() {
        let mut journal = Journal::new();

        for index in 0..CAPACITY + 10 {
            journal.push(JournalEvent::CharacterOnline {
                nickname: format!("Character{index}"),
            });
        }

        let entries = journal.entries();

        assert_eq!(entries.len(), CAPACITY);
        assert_eq!(entries.first().unwrap().id, 10);
        assert_eq!(
            entries.last().unwrap().id,
            u64::try_from(CAPACITY).unwrap() + 9
        );
    }

    #[test]
    fn an_identifier_is_never_reused() {
        let mut journal = Journal::new();

        journal.push(JournalEvent::Listening);
        journal.push(JournalEvent::Quit);

        let identifiers = journal
            .entries()
            .iter()
            .map(|entry| entry.id)
            .collect::<Vec<_>>();

        assert_eq!(identifiers, vec![0, 1]);
    }

    #[test]
    fn a_failure_that_holds_is_written_once() {
        let mut journal = Journal::new();
        let failure = || JournalEvent::ScanFailed {
            detail: "the system said no".to_owned(),
        };

        journal.push_unless_repeated(failure());
        journal.push_unless_repeated(failure());
        journal.push_unless_repeated(failure());

        assert_eq!(journal.entries().len(), 1);

        journal.push(JournalEvent::Listening);
        journal.push_unless_repeated(failure());

        assert_eq!(journal.entries().len(), 3);
    }

    #[test]
    fn the_journal_never_carries_the_words_of_a_notification() {
        let event = JournalEvent::Notification {
            nickname: "Alpha".to_owned(),
            notification_kind: Some(NotificationKind::PrivateMessage),
            outcome: Outcome::Focused,
        };

        assert_eq!(
            fields_of(&event),
            ["kind", "nickname", "notificationKind", "outcome"]
        );
    }

    fn fields_of(event: &JournalEvent) -> Vec<String> {
        serde_json::to_value(event)
            .expect("the event serialises")
            .as_object()
            .expect("an event is an object")
            .keys()
            .cloned()
            .collect()
    }

    #[test]
    fn no_relay_event_carries_a_body_or_a_chat() {
        assert_eq!(fields_of(&JournalEvent::RelayPaired), ["kind"]);
        assert_eq!(fields_of(&JournalEvent::RelayUnpaired), ["kind"]);

        let failed = JournalEvent::RelayFailed {
            reason: RelayFailure::Telegram {
                detail: "Unauthorized".to_owned(),
            },
        };

        assert_eq!(fields_of(&failed), ["kind", "reason"]);
        assert_eq!(
            serde_json::to_string(&failed).expect("the event serialises"),
            r#"{"kind":"relayFailed","reason":{"reason":"telegram","detail":"Unauthorized"}}"#
        );
    }

    #[test]
    fn nothing_the_running_relay_writes_carries_a_body_or_a_chat() {
        let enabled = JournalEvent::RelayEnabled {
            surface: Surface::Window,
        };

        assert_eq!(fields_of(&enabled), ["kind", "surface"]);
        assert_eq!(fields_of(&JournalEvent::RelayTestSent), ["kind"]);

        let sent = JournalEvent::RelaySent {
            nickname: "Alpha".to_owned(),
        };

        assert_eq!(fields_of(&sent), ["kind", "nickname"]);
        assert_eq!(
            serde_json::to_string(&sent).expect("the event serialises"),
            r#"{"kind":"relaySent","nickname":"Alpha"}"#
        );

        let notice = JournalEvent::RelayNoticeSent {
            case: NoticeCase::Both,
        };

        assert_eq!(fields_of(&notice), ["case", "kind"]);
        assert_eq!(
            serde_json::to_string(&notice).expect("the event serialises"),
            r#"{"kind":"relayNoticeSent","case":"both"}"#
        );

        let disabled = JournalEvent::RelayDisabled {
            reason: RelayStop::Shortcut,
        };

        assert_eq!(fields_of(&disabled), ["kind", "reason"]);
        assert_eq!(
            fields_of(&JournalEvent::DisplayAwake { held: true }),
            ["held", "kind"]
        );
    }

    #[test]
    fn a_relay_that_stops_says_which_of_the_four_gestures_stopped_it() {
        let stops = [
            RelayStop::Shortcut,
            RelayStop::Tray,
            RelayStop::NoRelayedCharacter,
            RelayStop::NoLongerPaired,
        ];

        let named = stops
            .iter()
            .map(|stop| {
                serde_json::to_value(stop)
                    .expect("a stop serialises")
                    .as_str()
                    .expect("a stop is a name")
                    .to_owned()
            })
            .collect::<Vec<_>>();

        assert_eq!(
            named,
            ["shortcut", "tray", "noRelayedCharacter", "noLongerPaired"]
        );
    }

    #[test]
    fn a_relay_failure_says_which_of_the_three_places_it_is_repaired_in() {
        let reasons = [
            RelayFailure::Keychain {
                detail: "denied".to_owned(),
            },
            RelayFailure::Telegram {
                detail: "Unauthorized".to_owned(),
            },
            RelayFailure::Network {
                detail: "error sending request".to_owned(),
            },
        ];

        let named = reasons
            .iter()
            .map(|reason| {
                serde_json::to_value(reason).expect("a reason serialises")["reason"]
                    .as_str()
                    .expect("a reason is tagged")
                    .to_owned()
            })
            .collect::<Vec<_>>();

        assert_eq!(named, ["keychain", "telegram", "network"]);
    }

    #[test]
    fn a_paste_carries_an_excerpt_of_the_user_s_own_line_and_nothing_more() {
        let pasted = JournalEvent::QuickReplyPasted {
            excerpt: "prix libre".to_owned(),
        };

        assert_eq!(fields_of(&pasted), ["excerpt", "kind"]);

        let failed = JournalEvent::QuickReplyFailed {
            reason: QuickReplyFailure::PasteRefused {
                detail: "refusé".to_owned(),
            },
        };

        assert_eq!(fields_of(&failed), ["kind", "reason"]);
        assert_eq!(
            serde_json::to_string(&failed).expect("the event serialises"),
            r#"{"kind":"quickReplyFailed","reason":{"reason":"pasteRefused","detail":"refusé"}}"#
        );
    }

    #[test]
    fn a_quick_reply_that_failed_says_which_of_the_six_places_it_is_repaired_in() {
        let reasons = [
            QuickReplyFailure::OutsideGame,
            QuickReplyFailure::ForegroundUnknown {
                detail: "denied".to_owned(),
            },
            QuickReplyFailure::Gone,
            QuickReplyFailure::ClipboardRefused {
                detail: "denied".to_owned(),
            },
            QuickReplyFailure::PasteRefused {
                detail: "denied".to_owned(),
            },
            QuickReplyFailure::ClipboardNotGivenBack {
                detail: "denied".to_owned(),
            },
        ];

        let named = reasons
            .iter()
            .map(|reason| {
                serde_json::to_value(reason).expect("a reason serialises")["reason"]
                    .as_str()
                    .expect("a reason is tagged")
                    .to_owned()
            })
            .collect::<Vec<_>>();

        assert_eq!(
            named,
            [
                "outsideGame",
                "foregroundUnknown",
                "gone",
                "clipboardRefused",
                "pasteRefused",
                "clipboardNotGivenBack"
            ]
        );
    }

    #[test]
    fn an_unreadable_body_is_not_an_unknown_kind() {
        assert_ne!(Outcome::BodyUnread, Outcome::KindUnknown);
    }
}
