use std::collections::HashMap;
use std::time::Instant;

use serde_json::Value;
use serde_json::json;

use crate::app::journal::CharacterShortcutOutcome;
use crate::app::journal::JournalEvent;
use crate::app::journal::MaximizeAllOutcome;
use crate::app::journal::Outcome;
use crate::app::journal::ShortcutOutcome;
use crate::app::journal::TrayOutcome;
use crate::app::journal::WheelOutcome;
use crate::domain::NotificationKind;

const SECONDS_PER_MINUTE: u64 = 60;

#[derive(Debug)]
pub struct Tally {
    born: Instant,
    online: u32,
    switches: u32,
    character_switches: u32,
    auto_focus_switches: u32,
    auto_focus_kinds: HashMap<NotificationKind, u32>,
    wheel_picks: u32,
    walk_switches: u32,
    walk_turned_on: u32,
    rune_table_opens: u32,
    quick_texts_pasted: u32,
    maximize_all: u32,
    relay_sent: u32,
    relay_turned_on: u32,
    health_checks: u32,
    tray_focus: u32,
    settings_changed: u32,
    clients_peak: u32,
    listening_lost: u32,
    failures: u32,
}

impl Default for Tally {
    fn default() -> Self {
        Self {
            born: Instant::now(),
            online: 0,
            switches: 0,
            character_switches: 0,
            auto_focus_switches: 0,
            auto_focus_kinds: HashMap::new(),
            wheel_picks: 0,
            walk_switches: 0,
            walk_turned_on: 0,
            rune_table_opens: 0,
            quick_texts_pasted: 0,
            maximize_all: 0,
            relay_sent: 0,
            relay_turned_on: 0,
            health_checks: 0,
            tray_focus: 0,
            settings_changed: 0,
            clients_peak: 0,
            listening_lost: 0,
            failures: 0,
        }
    }
}

impl Tally {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub(super) fn counted(&self) -> Value {
        let mut counted = json!({
            "minutes": self.born.elapsed().as_secs() / SECONDS_PER_MINUTE,
            "switches": self.switches,
            "character_switches": self.character_switches,
            "auto_focus_switches": self.auto_focus_switches,
            "wheel_picks": self.wheel_picks,
            "walk_switches": self.walk_switches,
            "walk_turned_on": self.walk_turned_on,
            "rune_table_opens": self.rune_table_opens,
            "quick_texts_pasted": self.quick_texts_pasted,
            "maximize_all": self.maximize_all,
            "relay_sent": self.relay_sent,
            "relay_turned_on": self.relay_turned_on,
            "health_checks": self.health_checks,
            "tray_focus": self.tray_focus,
            "settings_changed": self.settings_changed,
            "clients_peak": self.clients_peak,
            "listening_lost": self.listening_lost,
            "failures": self.failures,
        });

        for kind in NotificationKind::ALL {
            let switches = self.auto_focus_kinds.get(&kind).copied().unwrap_or(0);

            counted[format!("auto_focus_{}", named_kind(kind))] = json!(switches);
        }

        counted
    }

    pub fn start_over(&mut self) {
        *self = Self {
            online: self.online,
            clients_peak: self.online,
            ..Self::default()
        };
    }

    pub fn count_walk_switch(&mut self) {
        self.walk_switches = self.walk_switches.saturating_add(1);
    }

    pub fn count_rune_table_open(&mut self) {
        self.rune_table_opens = self.rune_table_opens.saturating_add(1);
    }

    pub fn count_health_check(&mut self) {
        self.health_checks = self.health_checks.saturating_add(1);
    }

    pub fn count(&mut self, event: &JournalEvent) {
        match event {
            JournalEvent::Notification {
                notification_kind,
                outcome,
                ..
            } => self.count_notification(*notification_kind, outcome),

            JournalEvent::Shortcut { outcome, .. } => self.count_shortcut(outcome),

            JournalEvent::CharacterShortcut { outcome, .. } => {
                self.count_character_shortcut(outcome);
            }

            JournalEvent::TrayFocus { outcome, .. } => self.count_tray_focus(outcome),

            JournalEvent::WheelPicked { outcome } => self.count_wheel_pick(outcome),

            JournalEvent::MaximizeAll { outcome, .. } => self.count_maximize_all(outcome),

            JournalEvent::QuickTextPasted { .. } => {
                self.quick_texts_pasted = self.quick_texts_pasted.saturating_add(1);
            }

            JournalEvent::RelaySent { .. } => {
                self.relay_sent = self.relay_sent.saturating_add(1);
            }

            JournalEvent::RelayEnabled { .. } => {
                self.relay_turned_on = self.relay_turned_on.saturating_add(1);
            }

            JournalEvent::WalkEnabled { enabled, .. } => {
                if *enabled {
                    self.walk_turned_on = self.walk_turned_on.saturating_add(1);
                }
            }

            JournalEvent::Setting { .. } | JournalEvent::Roster { .. } => {
                self.settings_changed = self.settings_changed.saturating_add(1);
            }

            JournalEvent::CharacterOnline { .. } => {
                self.online = self.online.saturating_add(1);
                self.clients_peak = self.clients_peak.max(self.online);
            }

            JournalEvent::CharacterOffline { .. } => {
                self.online = self.online.saturating_sub(1);
            }

            JournalEvent::ListeningLost { .. } => {
                self.listening_lost = self.listening_lost.saturating_add(1);
                self.count_failure();
            }

            JournalEvent::WalkListeningLost => {
                self.listening_lost = self.listening_lost.saturating_add(1);
            }

            JournalEvent::ConfigLoadFailed { .. }
            | JournalEvent::ConfigNotSetAside { .. }
            | JournalEvent::ListeningFailed { .. }
            | JournalEvent::NotificationUnreadable { .. }
            | JournalEvent::ShortcutsFailed { .. }
            | JournalEvent::QuickTextFailed { .. }
            | JournalEvent::ClientMaximizeFailed { .. }
            | JournalEvent::ClientsCountFailed { .. }
            | JournalEvent::ShortTitlesFailed { .. }
            | JournalEvent::WindowIconFailed { .. }
            | JournalEvent::TrayFailed { .. }
            | JournalEvent::WindowFailed { .. }
            | JournalEvent::SnapshotFailed { .. }
            | JournalEvent::ScreenStopped { .. }
            | JournalEvent::StartAtLoginFailed { .. }
            | JournalEvent::Panicked { .. }
            | JournalEvent::PanickedElsewhere { .. }
            | JournalEvent::ScanFailed { .. }
            | JournalEvent::WakesFailed { .. }
            | JournalEvent::SaveFailed { .. }
            | JournalEvent::UpdateFailed { .. }
            | JournalEvent::OpenFailed { .. }
            | JournalEvent::RelayFailed { .. }
            | JournalEvent::WalkListeningRefused { .. }
            | JournalEvent::WalkSwitchFailed { .. }
            | JournalEvent::BannerFailed { .. }
            | JournalEvent::WheelFailed { .. }
            | JournalEvent::RuneTableFailed { .. }
            | JournalEvent::DisplayAwakeFailed { .. } => self.count_failure(),

            JournalEvent::Started { .. }
            | JournalEvent::LaunchedAgain
            | JournalEvent::Authorization { .. }
            | JournalEvent::AuthorizationRequested { .. }
            | JournalEvent::Check { .. }
            | JournalEvent::Listening
            | JournalEvent::SilentEar { .. }
            | JournalEvent::ShortcutsBound { .. }
            | JournalEvent::ClientMaximized
            | JournalEvent::StartAtLoginReconciled { .. }
            | JournalEvent::UpdateAvailable { .. }
            | JournalEvent::UpdateUpToDate
            | JournalEvent::RelayPaired
            | JournalEvent::RelayUnpaired
            | JournalEvent::RelayDisabled { .. }
            | JournalEvent::RelayNoticeSent { .. }
            | JournalEvent::RelayTestSent
            | JournalEvent::WalkIdle { .. }
            | JournalEvent::WalkListeningResumed
            | JournalEvent::DisplayAwake { .. }
            | JournalEvent::Reset
            | JournalEvent::Quit => {}
        }
    }

    fn count_notification(&mut self, kind: Option<NotificationKind>, outcome: &Outcome) {
        match outcome {
            Outcome::Focused { .. } => {
                self.auto_focus_switches = self.auto_focus_switches.saturating_add(1);

                if let Some(kind) = kind {
                    let counted = self.auto_focus_kinds.entry(kind).or_default();

                    *counted = counted.saturating_add(1);
                }
            }
            Outcome::FocusFailed { .. } => self.count_failure(),
            Outcome::KindDisabled
            | Outcome::KindUnknown
            | Outcome::BodyUnread
            | Outcome::Excluded
            | Outcome::NoWindow
            | Outcome::LeftMinimized => {}
        }
    }

    fn count_shortcut(&mut self, outcome: &ShortcutOutcome) {
        match outcome {
            ShortcutOutcome::Focused { .. } => {
                self.switches = self.switches.saturating_add(1);
            }
            ShortcutOutcome::Excluded { .. } | ShortcutOutcome::Included { .. } => {
                self.settings_changed = self.settings_changed.saturating_add(1);
            }
            ShortcutOutcome::FocusFailed { .. } | ShortcutOutcome::ForegroundUnknown { .. } => {
                self.count_failure();
            }
            ShortcutOutcome::OutsideGame
            | ShortcutOutcome::NotInRoster { .. }
            | ShortcutOutcome::NobodyInCycle
            | ShortcutOutcome::NoMain
            | ShortcutOutcome::AlreadyThere { .. }
            | ShortcutOutcome::NoWindow { .. } => {}
        }
    }

    fn count_character_shortcut(&mut self, outcome: &CharacterShortcutOutcome) {
        match outcome {
            CharacterShortcutOutcome::Focused => {
                self.character_switches = self.character_switches.saturating_add(1);
            }
            CharacterShortcutOutcome::FocusFailed { .. }
            | CharacterShortcutOutcome::ForegroundUnknown { .. } => self.count_failure(),
            CharacterShortcutOutcome::AlreadyThere
            | CharacterShortcutOutcome::NotInRoster
            | CharacterShortcutOutcome::NoWindow
            | CharacterShortcutOutcome::OutsideGame => {}
        }
    }

    fn count_tray_focus(&mut self, outcome: &TrayOutcome) {
        match outcome {
            TrayOutcome::Focused => {
                self.tray_focus = self.tray_focus.saturating_add(1);
            }
            TrayOutcome::FocusFailed { .. } => self.count_failure(),
            TrayOutcome::NoWindow => {}
        }
    }

    fn count_wheel_pick(&mut self, outcome: &WheelOutcome) {
        match outcome {
            WheelOutcome::Focused { .. } => {
                self.wheel_picks = self.wheel_picks.saturating_add(1);
            }
            WheelOutcome::FocusFailed { .. } => self.count_failure(),
            WheelOutcome::NoWindow { .. } => {}
        }
    }

    fn count_maximize_all(&mut self, outcome: &MaximizeAllOutcome) {
        match outcome {
            MaximizeAllOutcome::Asked { .. } => {
                self.maximize_all = self.maximize_all.saturating_add(1);
            }
            MaximizeAllOutcome::Refused { .. } => self.count_failure(),
            MaximizeAllOutcome::NothingMoved
            | MaximizeAllOutcome::NoClient
            | MaximizeAllOutcome::Denied => {}
        }
    }

    fn count_failure(&mut self) {
        self.failures = self.failures.saturating_add(1);
    }
}

fn named_kind(kind: NotificationKind) -> &'static str {
    match kind {
        NotificationKind::Combat => "combat",
        NotificationKind::Trade => "trade",
        NotificationKind::Group => "group",
        NotificationKind::PrivateMessage => "private_message",
        NotificationKind::Challenge => "challenge",
        NotificationKind::Craft => "craft",
        NotificationKind::Perceptor => "perceptor",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app::journal::RelayStop;
    use crate::app::journal::RosterChange;
    use crate::app::journal::SettingChange;
    use crate::app::journal::Surface;
    use crate::app::journal::WalkFrom;
    use crate::app::view::ShortcutAction;

    #[test]
    fn a_fresh_session_has_counted_nothing() {
        let tally = Tally::new();

        assert_eq!(tally.switches, 0);
        assert_eq!(tally.auto_focus_switches, 0);
        assert_eq!(tally.failures, 0);
        assert_eq!(tally.clients_peak, 0);
    }

    #[test]
    fn a_focus_that_landed_is_counted_by_the_hand_that_asked_for_it() {
        let mut tally = Tally::new();

        tally.count(&JournalEvent::Shortcut {
            action: ShortcutAction::Next,
            outcome: ShortcutOutcome::Focused {
                nickname: "Ilyzaelle".to_owned(),
            },
        });
        tally.count(&JournalEvent::CharacterShortcut {
            nickname: "Ilyzaelle".to_owned(),
            outcome: CharacterShortcutOutcome::Focused,
        });
        tally.count(&JournalEvent::TrayFocus {
            nickname: "Ilyzaelle".to_owned(),
            outcome: TrayOutcome::Focused,
        });
        tally.count(&JournalEvent::WheelPicked {
            outcome: WheelOutcome::Focused {
                nickname: "Ilyzaelle".to_owned(),
            },
        });
        tally.count_walk_switch();

        assert_eq!(tally.switches, 1);
        assert_eq!(tally.character_switches, 1);
        assert_eq!(tally.tray_focus, 1);
        assert_eq!(tally.wheel_picks, 1);
        assert_eq!(tally.walk_switches, 1);
        assert_eq!(tally.failures, 0);
    }

    #[test]
    fn a_notification_that_woke_a_window_is_counted_by_its_kind_too() {
        let mut tally = Tally::new();

        tally.count(&focused_notification(NotificationKind::Combat));
        tally.count(&focused_notification(NotificationKind::Combat));
        tally.count(&focused_notification(NotificationKind::Trade));

        assert_eq!(tally.auto_focus_switches, 3);
        assert_eq!(
            tally.auto_focus_kinds.get(&NotificationKind::Combat),
            Some(&2)
        );
        assert_eq!(
            tally.auto_focus_kinds.get(&NotificationKind::Trade),
            Some(&1)
        );
        assert_eq!(tally.auto_focus_kinds.get(&NotificationKind::Craft), None);
    }

    #[test]
    fn a_notification_nobody_asked_to_be_woken_for_is_not_a_switch() {
        let mut tally = Tally::new();

        tally.count(&JournalEvent::Notification {
            nickname: "Ilyzaelle".to_owned(),
            notification_kind: Some(NotificationKind::Combat),
            outcome: Outcome::KindDisabled,
        });
        tally.count(&JournalEvent::Notification {
            nickname: "Ilyzaelle".to_owned(),
            notification_kind: None,
            outcome: Outcome::KindUnknown,
        });

        assert_eq!(tally.auto_focus_switches, 0);
        assert!(tally.auto_focus_kinds.is_empty());
        assert_eq!(tally.failures, 0);
    }

    #[test]
    fn a_focus_the_system_refused_is_a_failure_wherever_it_came_from() {
        let mut tally = Tally::new();
        let detail = "the window would not come".to_owned();

        tally.count(&JournalEvent::Notification {
            nickname: "Ilyzaelle".to_owned(),
            notification_kind: Some(NotificationKind::Combat),
            outcome: Outcome::FocusFailed {
                detail: detail.clone(),
            },
        });
        tally.count(&JournalEvent::TrayFocus {
            nickname: "Ilyzaelle".to_owned(),
            outcome: TrayOutcome::FocusFailed {
                detail: detail.clone(),
            },
        });
        tally.count(&JournalEvent::WheelFailed { detail });

        assert_eq!(tally.failures, 3);
        assert_eq!(tally.auto_focus_switches, 0);
        assert_eq!(tally.tray_focus, 0);
    }

    #[test]
    fn the_peak_holds_the_most_clients_that_were_open_at_once() {
        let mut tally = Tally::new();

        tally.count(&online("Ilyzaelle"));
        tally.count(&online("Aryenne"));
        tally.count(&online("Nokatt"));
        tally.count(&offline("Nokatt"));
        tally.count(&offline("Aryenne"));
        tally.count(&online("Aryenne"));

        assert_eq!(tally.clients_peak, 3);
    }

    #[test]
    fn a_client_closing_before_any_opened_leaves_the_peak_alone() {
        let mut tally = Tally::new();

        tally.count(&offline("Ilyzaelle"));
        tally.count(&online("Ilyzaelle"));

        assert_eq!(tally.clients_peak, 1);
    }

    #[test]
    fn a_tally_started_over_forgets_the_counts_and_keeps_the_clients_still_open() {
        let mut tally = Tally::new();

        tally.count(&online("Ilyzaelle"));
        tally.count(&online("Aryenne"));
        tally.count(&online("Nokatt"));
        tally.count(&offline("Nokatt"));
        tally.count_walk_switch();

        tally.start_over();

        assert_eq!(tally.walk_switches, 0);
        assert_eq!(tally.clients_peak, 2);

        tally.count(&offline("Aryenne"));
        tally.count(&offline("Ilyzaelle"));

        assert_eq!(tally.online, 0);
    }

    #[test]
    fn touching_a_setting_or_the_roster_says_the_player_went_looking() {
        let mut tally = Tally::new();

        tally.count(&JournalEvent::Setting {
            change: SettingChange::MaximizeOnLaunch { maximize: false },
        });
        tally.count(&JournalEvent::Roster {
            change: RosterChange::Main {
                nickname: "Ilyzaelle".to_owned(),
                main: true,
            },
        });
        tally.count(&JournalEvent::Shortcut {
            action: ShortcutAction::ToggleExcluded,
            outcome: ShortcutOutcome::Excluded {
                nickname: "Nokatt".to_owned(),
            },
        });

        assert_eq!(tally.settings_changed, 3);
        assert_eq!(tally.switches, 0);
    }

    #[test]
    fn a_walk_turned_on_and_never_clicked_is_told_apart_from_one_that_served() {
        let mut tally = Tally::new();

        tally.count(&JournalEvent::WalkEnabled {
            enabled: true,
            from: WalkFrom::Shortcut,
        });
        tally.count(&JournalEvent::WalkEnabled {
            enabled: false,
            from: WalkFrom::ListeningLost,
        });

        let counted = tally.counted();

        assert_eq!(counted["walk_turned_on"], json!(1));
        assert_eq!(
            counted["walk_switches"],
            json!(0),
            "the player turned it on and clicked nowhere"
        );
    }

    #[test]
    fn a_relay_turned_on_that_sent_nothing_is_told_the_same_way() {
        let mut tally = Tally::new();

        tally.count(&JournalEvent::RelayEnabled {
            surface: Surface::Tray,
        });
        tally.count(&JournalEvent::RelayDisabled {
            reason: RelayStop::Window,
        });

        let counted = tally.counted();

        assert_eq!(counted["relay_turned_on"], json!(1));
        assert_eq!(counted["relay_sent"], json!(0));
    }

    #[test]
    fn a_maximizing_that_moved_nothing_is_neither_a_use_nor_a_failure() {
        let mut tally = Tally::new();

        tally.count(&JournalEvent::MaximizeAll {
            from: Surface::Shortcut,
            outcome: MaximizeAllOutcome::Asked { windows: 4 },
        });
        tally.count(&JournalEvent::MaximizeAll {
            from: Surface::Tray,
            outcome: MaximizeAllOutcome::NothingMoved,
        });

        assert_eq!(tally.maximize_all, 1);
        assert_eq!(tally.failures, 0);
    }

    #[test]
    fn a_lost_ear_is_told_once_as_a_loss_and_once_as_a_failure() {
        let mut tally = Tally::new();

        tally.count(&JournalEvent::ListeningLost {
            detail: "the centre stopped answering".to_owned(),
        });
        tally.count(&JournalEvent::WalkListeningLost);

        assert_eq!(tally.listening_lost, 2);
        assert_eq!(tally.failures, 1);
    }

    fn focused_notification(kind: NotificationKind) -> JournalEvent {
        JournalEvent::Notification {
            nickname: "Ilyzaelle".to_owned(),
            notification_kind: Some(kind),
            outcome: Outcome::Focused { focus_micros: 900 },
        }
    }

    fn online(nickname: &str) -> JournalEvent {
        JournalEvent::CharacterOnline {
            nickname: nickname.to_owned(),
        }
    }

    fn offline(nickname: &str) -> JournalEvent {
        JournalEvent::CharacterOffline {
            nickname: nickname.to_owned(),
        }
    }
}
