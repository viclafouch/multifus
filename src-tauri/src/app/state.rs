use std::collections::HashMap;
use std::collections::HashSet;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::time::Duration;
use std::time::Instant;

use tauri::AppHandle;
use tauri::Manager;

use crate::app::journal::Journal;
use crate::app::journal::JournalEvent;
use crate::app::journal::Launch;
use crate::app::journal::Outcome;
use crate::app::journal::RelayStop;
use crate::app::journal::RosterChange;
use crate::app::journal::SettingChange;
use crate::app::journal::ShortcutOutcome;
use crate::app::journal::Surface;
use crate::app::view::AuthorizationView;
use crate::app::view::AutoFocusView;
use crate::app::view::Binding;
use crate::app::view::CharacterView;
use crate::app::view::ConfigProblem;
use crate::app::view::ConfigView;
use crate::app::view::PairingView;
use crate::app::view::QuickReplyView;
use crate::app::view::RelayView;
use crate::app::view::ScreenSaverView;
use crate::app::view::ShortcutAction;
use crate::app::view::ShortcutStatus;
use crate::app::view::ShortcutView;
use crate::app::view::Snapshot;
use crate::app::view::SwitchView;
use crate::app::view::TestView;
use crate::app::view::UpdateView;
use crate::config::ConfigError;
use crate::config::ConfigStore;
use crate::config::Loaded;
use crate::config::QuickReply;
use crate::config::QuickReplyId;
use crate::config::Settings;
use crate::config::Shortcut;
use crate::domain::Character;
use crate::domain::Gender;
use crate::domain::NotificationKind;
use crate::platform::GameWindow;
use crate::platform::PlatformNotificationWatcher;
use crate::platform::WindowId;

pub type AppState = Mutex<Multifus>;

pub type WatcherState = Mutex<PlatformNotificationWatcher>;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StartId(u64);

#[derive(Debug)]
pub struct Multifus {
    store: ConfigStore,
    version: String,
    system: String,
    settings: Settings,
    shortcut_statuses: HashMap<Binding, ShortcutStatus>,
    windows: HashMap<String, WindowId>,
    seen_client_windows: Option<HashSet<WindowId>>,
    granted: Option<bool>,
    listening: bool,
    problem: Option<ConfigProblem>,
    update: UpdateView,
    pairing: PairingView,
    test: TestView,
    last_test: Option<Instant>,
    relay_active: bool,
    relay_start: Option<StartId>,
    switch: SwitchView,
    last_start: u64,
    screen_saver: ScreenSaverView,
    journal: Journal,
}

#[derive(Debug)]
pub struct MultifusParams {
    pub store: ConfigStore,
    pub loaded: Loaded,
    pub version: String,
    pub system: String,
    pub launch: Launch,
    pub screen_saver: ScreenSaverView,
}

impl Multifus {
    #[must_use]
    pub fn new(params: MultifusParams) -> Self {
        let MultifusParams {
            store,
            loaded,
            version,
            system,
            launch,
            screen_saver,
        } = params;

        let Loaded {
            settings,
            failure,
            quarantined,
            quarantine_failure,
        } = loaded;

        let mut journal = Journal::new();

        journal.push(JournalEvent::Started {
            version: version.clone(),
            system: system.clone(),
            launch,
        });

        let problem = triage_config(
            &mut journal,
            failure,
            quarantined.map(|path| path.display().to_string()),
            quarantine_failure,
        );

        Self {
            store,
            version,
            system,
            settings,
            shortcut_statuses: HashMap::new(),
            windows: HashMap::new(),
            seen_client_windows: None,
            granted: None,
            listening: false,
            problem,
            update: UpdateView::Checking,
            pairing: PairingView::Idle,
            test: TestView::Idle,
            last_test: None,
            relay_active: false,
            relay_start: None,
            switch: SwitchView::Idle,
            last_start: 0,
            screen_saver,
            journal,
        }
    }

    #[must_use]
    pub fn snapshot(&self) -> Snapshot {
        Snapshot {
            version: self.version.clone(),
            system: self.system.clone(),
            characters: self
                .settings
                .roster
                .characters()
                .iter()
                .map(view_of)
                .collect(),
            start_at_login: self.settings.start_at_login,
            maximize_on_launch: self.settings.maximize_on_launch,
            short_titles: self.settings.short_titles,
            shortcuts: ShortcutAction::ALL
                .into_iter()
                .map(|action| ShortcutView {
                    action,
                    accelerator: self.accelerator(action),
                    status: self.status_of(Binding::Action { action }),
                })
                .collect(),
            quick_replies: self
                .settings
                .quick_replies
                .iter()
                .map(|quick_reply| QuickReplyView {
                    id: quick_reply.id,
                    text: quick_reply.text.clone(),
                    accelerator: accelerator_of(quick_reply.shortcut.as_ref()),
                    status: self.status_of(Binding::QuickReply { id: quick_reply.id }),
                })
                .collect(),
            auto_focus: NotificationKind::ALL
                .into_iter()
                .map(|kind| AutoFocusView {
                    kind,
                    enabled: self.settings.auto_focus.is_kind_enabled(kind),
                })
                .collect(),
            auto_focus_enabled: self.settings.auto_focus.enabled,
            wakes_minimized: self.settings.auto_focus.wakes_minimized,
            authorization: AuthorizationView {
                granted: self.is_granted(),
                listening: self.listening,
            },
            config: ConfigView {
                path: self.store.path().display().to_string(),
                problem: self.problem.clone(),
            },
            update: self.update.clone(),
            relay: RelayView {
                paired: self.settings.relay.chat_id.is_some(),
                send_body: self.settings.relay.send_body,
                active: self.relay_active,
                ready: self.is_relay_ready(),
                screen_saver: self.screen_saver,
                pairing: self.pairing.clone(),
                switch: self.switch.clone(),
                test: self.test.clone(),
            },
            journal: self.journal.entries(),
        }
    }

    #[must_use]
    pub fn connected(&self) -> Vec<CharacterView> {
        self.settings
            .roster
            .characters()
            .iter()
            .filter(|character| character.online)
            .map(view_of)
            .collect()
    }

    pub fn log(&mut self, event: JournalEvent) {
        self.journal.push(event);
    }

    pub fn log_unless_repeated(&mut self, event: JournalEvent) -> bool {
        self.journal.push_unless_repeated(event)
    }

    pub fn save(&mut self) {
        match self.store.save(&self.settings) {
            Ok(()) => {
                if matches!(self.problem, Some(ConfigProblem::NotSaved { .. })) {
                    self.problem = None;
                }
            }
            Err(error) => {
                let detail = error.to_string();

                self.log(JournalEvent::SaveFailed {
                    detail: detail.clone(),
                });
                self.problem = Some(ConfigProblem::NotSaved { detail });
            }
        }
    }

    pub fn dismiss_problem(&mut self) {
        self.problem = None;
    }

    #[must_use]
    pub fn quarantined_path(&self) -> Option<&str> {
        match &self.problem {
            Some(ConfigProblem::Malformed { quarantined, .. }) => quarantined.as_deref(),
            _ => None,
        }
    }

    pub fn set_gender(&mut self, nickname: &str, gender: Option<Gender>) {
        let Some(character) = self.settings.roster.get_mut(nickname) else {
            return;
        };

        character.gender = gender;

        self.log(JournalEvent::Roster {
            change: RosterChange::GenderAssigned {
                nickname: nickname.to_owned(),
                gender,
            },
        });
        self.save();
    }

    pub fn toggle_asleep(&mut self, nickname: &str) {
        let change = match self.settings.roster.toggle_asleep(nickname) {
            Some(true) => RosterChange::Slept {
                nickname: nickname.to_owned(),
            },
            Some(false) => RosterChange::Woke {
                nickname: nickname.to_owned(),
            },
            None => return,
        };

        self.log(JournalEvent::Roster { change });
    }

    pub fn set_gender_asleep(&mut self, gender: Gender, asleep: bool) {
        let moved = self.settings.roster.set_asleep_for_gender(gender, asleep);

        if moved == 0 {
            return;
        }

        self.log(JournalEvent::Roster {
            change: RosterChange::GenderAsleep { gender, asleep },
        });
    }

    pub fn reorder(&mut self, order: &[String]) {
        let before = self.nicknames();

        self.settings.roster.reorder(order);

        let after = self.nicknames();

        if after != before {
            self.log(JournalEvent::Roster {
                change: RosterChange::Reordered { order: after },
            });
        }

        self.save();
    }

    pub fn remove(&mut self, nickname: &str) {
        if self.settings.roster.remove(nickname).is_some() {
            self.windows.remove(nickname);

            self.log(JournalEvent::Roster {
                change: RosterChange::Removed {
                    nickname: nickname.to_owned(),
                },
            });
            self.save();
        }
    }

    #[must_use]
    fn nicknames(&self) -> Vec<String> {
        self.settings
            .roster
            .characters()
            .iter()
            .map(|character| character.nickname.clone())
            .collect()
    }

    #[must_use]
    fn shortcut(&self, action: ShortcutAction) -> Option<&Shortcut> {
        match action {
            ShortcutAction::Next => self.settings.shortcuts.next.as_ref(),
            ShortcutAction::Previous => self.settings.shortcuts.previous.as_ref(),
            ShortcutAction::ToggleAsleep => self.settings.shortcuts.toggle_asleep.as_ref(),
            ShortcutAction::Swap => self.settings.shortcuts.swap.as_ref(),
        }
    }

    #[must_use]
    fn accelerator(&self, action: ShortcutAction) -> Option<String> {
        accelerator_of(self.shortcut(action))
    }

    #[must_use]
    fn status_of(&self, binding: Binding) -> ShortcutStatus {
        self.shortcut_statuses
            .get(&binding)
            .cloned()
            .unwrap_or(ShortcutStatus::Pending)
    }

    #[must_use]
    pub fn bindings(&self) -> Vec<(Binding, Option<String>)> {
        let actions = ShortcutAction::ALL
            .into_iter()
            .map(|action| (Binding::Action { action }, self.accelerator(action)));

        let quick_replies = self.settings.quick_replies.iter().map(|quick_reply| {
            (
                Binding::QuickReply { id: quick_reply.id },
                accelerator_of(quick_reply.shortcut.as_ref()),
            )
        });

        actions.chain(quick_replies).collect()
    }

    pub fn set_shortcut_statuses(&mut self, statuses: HashMap<Binding, ShortcutStatus>) {
        self.shortcut_statuses = statuses;
    }

    pub fn set_shortcut(&mut self, action: ShortcutAction, accelerator: Option<String>) {
        let shortcut = accelerator.and_then(Shortcut::new);

        let slot = match action {
            ShortcutAction::Next => &mut self.settings.shortcuts.next,
            ShortcutAction::Previous => &mut self.settings.shortcuts.previous,
            ShortcutAction::ToggleAsleep => &mut self.settings.shortcuts.toggle_asleep,
            ShortcutAction::Swap => &mut self.settings.shortcuts.swap,
        };

        *slot = shortcut;

        self.save();
    }

    #[must_use]
    pub fn quick_reply_text(&self, id: QuickReplyId) -> Option<String> {
        self.settings
            .quick_replies
            .iter()
            .find(|quick_reply| quick_reply.id == id)
            .map(|quick_reply| quick_reply.text.clone())
    }

    pub fn add_quick_reply(&mut self) -> QuickReplyId {
        let id = self
            .settings
            .quick_replies
            .iter()
            .map(|quick_reply| quick_reply.id)
            .max()
            .map_or_else(QuickReplyId::default, QuickReplyId::next);

        self.settings.quick_replies.push(QuickReply::new(id));
        self.save();

        id
    }

    pub fn set_quick_reply_text(&mut self, id: QuickReplyId, text: &str) {
        let Some(quick_reply) = self.quick_reply_mut(id) else {
            return;
        };

        quick_reply.set_text(text);
        self.save();
    }

    pub fn set_quick_reply_shortcut(&mut self, id: QuickReplyId, accelerator: Option<String>) {
        let shortcut = accelerator.and_then(Shortcut::new);

        let Some(quick_reply) = self.quick_reply_mut(id) else {
            return;
        };

        quick_reply.shortcut = shortcut;
        self.save();
    }

    pub fn remove_quick_reply(&mut self, id: QuickReplyId) {
        self.settings
            .quick_replies
            .retain(|quick_reply| quick_reply.id != id);
        self.save();
    }

    #[must_use]
    fn quick_reply_mut(&mut self, id: QuickReplyId) -> Option<&mut QuickReply> {
        self.settings
            .quick_replies
            .iter_mut()
            .find(|quick_reply| quick_reply.id == id)
    }

    #[must_use]
    pub fn starts_at_login(&self) -> bool {
        self.settings.start_at_login
    }

    pub fn set_start_at_login(&mut self, start_at_login: bool) {
        self.settings.start_at_login = start_at_login;
        self.save();
    }

    #[must_use]
    pub fn maximizes_on_launch(&self) -> bool {
        self.settings.maximize_on_launch
    }

    pub fn set_maximize_on_launch(&mut self, maximize: bool) {
        self.settings.maximize_on_launch = maximize;

        self.log(JournalEvent::Setting {
            change: SettingChange::MaximizeOnLaunch { maximize },
        });
        self.save();
    }

    #[must_use]
    pub fn shortens_titles(&self) -> bool {
        self.settings.short_titles
    }

    #[must_use]
    pub fn client_title_suffix(&self) -> Option<String> {
        self.settings.client_title_suffix.clone()
    }

    pub fn learn_title_suffix(&mut self, suffix: String) {
        if self.settings.client_title_suffix.as_deref() == Some(suffix.as_str()) {
            return;
        }

        self.settings.client_title_suffix = Some(suffix);
        self.save();
    }

    pub fn set_short_titles(&mut self, short: bool) {
        self.settings.short_titles = short;

        self.log(JournalEvent::Setting {
            change: SettingChange::ShortTitles { short },
        });
        self.save();
    }

    pub fn set_auto_focus(&mut self, kind: NotificationKind, enabled: bool) {
        self.settings.auto_focus.set(kind, enabled);

        self.log(JournalEvent::Setting {
            change: SettingChange::AutoFocusKind {
                notification_kind: kind,
                enabled,
            },
        });
        self.save();
    }

    pub fn set_auto_focus_enabled(&mut self, enabled: bool, from: Surface) {
        self.settings.auto_focus.enabled = enabled;

        self.log(JournalEvent::Setting {
            change: SettingChange::AutoFocusEnabled { enabled, from },
        });
        self.save();
    }

    #[must_use]
    pub fn is_auto_focus_enabled(&self) -> bool {
        self.settings.auto_focus.enabled
    }

    pub fn set_wakes_minimized(&mut self, wakes: bool, from: Surface) {
        self.settings.auto_focus.wakes_minimized = wakes;

        self.log(JournalEvent::Setting {
            change: SettingChange::WakesMinimized { wakes, from },
        });
        self.save();
    }

    pub fn toggle_auto_focus(&mut self) {
        self.set_auto_focus_enabled(!self.settings.auto_focus.enabled, Surface::Tray);
    }

    #[must_use]
    pub fn wakes_minimized(&self) -> bool {
        self.settings.auto_focus.wakes_minimized
    }

    pub fn toggle_wakes_minimized(&mut self) {
        self.set_wakes_minimized(!self.settings.auto_focus.wakes_minimized, Surface::Tray);
    }

    pub fn reset(&mut self) {
        self.settings = Settings::default();
        self.windows.clear();
        self.test = TestView::Idle;
        self.last_test = None;
        self.log(JournalEvent::Reset);
        self.save();
    }

    pub fn set_relayed(&mut self, nickname: &str, relayed: bool) {
        if !self.settings.roster.set_relayed(nickname, relayed) {
            return;
        }

        self.log(JournalEvent::Roster {
            change: RosterChange::Relayed {
                nickname: nickname.to_owned(),
                relayed,
            },
        });
        self.save();
    }

    pub fn set_send_body(&mut self, send_body: bool) {
        self.settings.relay.send_body = send_body;

        self.log(JournalEvent::Setting {
            change: SettingChange::RelayBody { send_body },
        });
        self.save();
    }

    #[must_use]
    pub fn is_relay_ready(&self) -> bool {
        self.settings.relay.chat_id.is_some() && self.settings.roster.has_relayed()
    }

    #[must_use]
    pub fn chat_id(&self) -> Option<i64> {
        self.settings.relay.chat_id
    }

    #[must_use]
    pub fn sends_body(&self) -> bool {
        self.settings.relay.send_body
    }

    #[must_use]
    pub fn relays(&self, nickname: &str) -> bool {
        self.relay_active
            && self
                .settings
                .roster
                .get(nickname)
                .is_some_and(|character| character.relayed)
    }

    #[must_use]
    pub fn is_relay_active(&self) -> bool {
        self.relay_active
    }

    #[must_use]
    pub fn has_relayed_online(&self) -> bool {
        self.settings.roster.has_relayed_online()
    }

    pub fn begin_relay_start(&mut self) -> Option<StartId> {
        if self.relay_active || self.relay_start.is_some() {
            return None;
        }

        self.last_start += 1;
        self.relay_start = Some(StartId(self.last_start));
        self.switch = SwitchView::Starting;

        self.relay_start
    }

    pub fn is_relay_starting(&self, start: StartId) -> bool {
        self.relay_start == Some(start)
    }

    #[must_use]
    pub fn has_relay_start(&self) -> bool {
        self.relay_start.is_some()
    }

    pub fn end_relay_start(&mut self, start: StartId, outcome: SwitchView) {
        if self.relay_start != Some(start) {
            return;
        }

        self.relay_start = None;
        self.switch = outcome;
    }

    pub fn enable_relay(&mut self, surface: Surface) -> bool {
        if self.relay_active {
            return false;
        }

        self.relay_active = true;
        self.log(JournalEvent::RelayEnabled { surface });

        true
    }

    pub fn disable_relay(&mut self, reason: RelayStop) -> bool {
        if !self.relay_active {
            return false;
        }

        self.relay_active = false;
        self.log(JournalEvent::RelayDisabled { reason });

        true
    }

    pub fn cancel_relay_start(&mut self) {
        self.relay_start = None;
        self.switch = SwitchView::Idle;
    }

    pub fn set_pairing(&mut self, pairing: PairingView) {
        self.pairing = pairing;
    }

    pub fn set_test(&mut self, test: TestView) {
        self.test = test;
    }

    pub fn test_view(&self) -> &TestView {
        &self.test
    }

    pub fn mark_test_sent(&mut self) {
        self.last_test = Some(Instant::now());
    }

    pub fn since_last_test(&self) -> Option<Duration> {
        self.last_test.map(|at| at.elapsed())
    }

    pub fn set_paired(&mut self, chat_id: i64) {
        self.settings.relay.chat_id = Some(chat_id);
        self.pairing = PairingView::Idle;
        self.test = TestView::Idle;
        self.last_test = None;

        self.log(JournalEvent::RelayPaired);
        self.save();
    }

    pub fn set_unpaired(&mut self) {
        self.settings.relay.chat_id = None;
        self.pairing = PairingView::Idle;
        self.test = TestView::Idle;
        self.last_test = None;

        self.log(JournalEvent::RelayUnpaired);
        self.save();
    }

    pub fn set_update(&mut self, update: UpdateView) {
        self.update = update;
    }

    #[must_use]
    pub fn available_update(&self) -> Option<String> {
        match &self.update {
            UpdateView::Available { version } => Some(version.clone()),
            UpdateView::Checking
            | UpdateView::UpToDate
            | UpdateView::Installing
            | UpdateView::Failed { .. } => None,
        }
    }

    pub fn apply_windows(&mut self, windows: &[GameWindow]) -> ScanChange {
        let mut changed = self.set_granted(true);
        let mut relayed_gone = Vec::new();

        self.windows = windows
            .iter()
            .map(|window| (window.nickname().to_owned(), window.id()))
            .collect();

        for window in windows {
            if self.settings.roster.get(window.nickname()).is_none() {
                self.settings.roster.add(Character::new(window.nickname()));
                self.log(JournalEvent::CharacterOnline {
                    nickname: window.nickname().to_owned(),
                });

                changed = true;
                self.save();
            }
        }

        let transitions = self
            .settings
            .roster
            .characters()
            .iter()
            .filter_map(|character| {
                let online = self.windows.contains_key(&character.nickname);

                (character.online != online)
                    .then(|| (character.nickname.clone(), online, character.relayed))
            })
            .collect::<Vec<_>>();

        for (nickname, online, relayed) in transitions {
            self.settings.roster.set_online(&nickname, online);

            if online {
                self.log(JournalEvent::CharacterOnline { nickname });
            } else {
                if relayed {
                    relayed_gone.push(nickname.clone());
                }

                self.log(JournalEvent::CharacterOffline { nickname });
            }

            changed = true;
        }

        self.scan_change(changed, relayed_gone)
    }

    pub fn take_appeared_client_windows(&mut self, windows: &[WindowId]) -> Vec<WindowId> {
        let Some(seen) = self.seen_client_windows.as_ref() else {
            self.seen_client_windows = Some(windows.iter().copied().collect());

            return Vec::new();
        };

        windows
            .iter()
            .copied()
            .filter(|window| !seen.contains(window))
            .collect()
    }

    pub fn remember_client_window(&mut self, window: WindowId) {
        if let Some(seen) = self.seen_client_windows.as_mut() {
            seen.insert(window);
        }
    }

    pub fn forget_client_windows(&mut self) {
        self.seen_client_windows = None;
    }

    #[must_use]
    pub fn window_of(&self, nickname: &str) -> Option<WindowId> {
        self.windows.get(nickname).copied()
    }

    pub fn apply_denied(&mut self) -> ScanChange {
        let mut changed = self.set_granted(false);
        let mut relayed_gone = Vec::new();

        self.windows.clear();

        let still_online = self
            .settings
            .roster
            .characters()
            .iter()
            .filter(|character| character.online)
            .map(|character| (character.nickname.clone(), character.relayed))
            .collect::<Vec<_>>();

        for (nickname, relayed) in still_online {
            self.settings.roster.set_online(&nickname, false);

            if relayed {
                relayed_gone.push(nickname.clone());
            }

            self.log(JournalEvent::CharacterOffline { nickname });

            changed = true;
        }

        self.scan_change(changed, relayed_gone)
    }

    fn scan_change(&self, changed: bool, relayed_gone: Vec<String>) -> ScanChange {
        ScanChange {
            changed,
            relayed_gone,
            none_relayed_left: !self.settings.roster.has_relayed_online(),
        }
    }

    pub fn set_granted(&mut self, granted: bool) -> bool {
        if self.granted == Some(granted) {
            return false;
        }

        self.granted = Some(granted);
        self.log(JournalEvent::Authorization { granted });

        true
    }

    #[must_use]
    pub fn is_granted(&self) -> bool {
        self.granted == Some(true)
    }

    pub fn set_listening(&mut self, listening: bool) -> bool {
        if self.listening == listening {
            return false;
        }

        self.listening = listening;

        if listening {
            self.log(JournalEvent::Listening);
        }

        true
    }

    #[must_use]
    pub fn is_listening(&self) -> bool {
        self.listening
    }

    #[must_use]
    pub fn decide(&self, nickname: &str, kind: Option<NotificationKind>) -> Decision {
        let Some(kind) = kind else {
            return Decision::Ignored(Outcome::KindUnknown);
        };

        if !self.settings.auto_focus.is_enabled(kind) {
            return Decision::Ignored(Outcome::KindDisabled);
        }

        match self.windows.get(nickname) {
            Some(window) if self.settings.auto_focus.wakes_minimized => Decision::Focus(*window),
            Some(window) => Decision::FocusUnlessMinimized(*window),
            None => Decision::Ignored(Outcome::NoWindow),
        }
    }

    pub fn decide_shortcut(&mut self, action: ShortcutAction, current: &str) -> ShortcutEffect {
        match action {
            ShortcutAction::Next => {
                let target = nickname_of(self.settings.roster.next_in_cycle(current));

                self.aim_at(target)
            }
            ShortcutAction::Previous => {
                let target = nickname_of(self.settings.roster.previous_in_cycle(current));

                self.aim_at(target)
            }
            ShortcutAction::ToggleAsleep => self.toggle_foreground(current),
            ShortcutAction::Swap => match self.settings.roster.swap() {
                Some(awake) => ShortcutEffect::Settled(ShortcutOutcome::Swapped { awake }),
                None => ShortcutEffect::Settled(ShortcutOutcome::NoGender),
            },
        }
    }

    fn aim_at(&self, target: Option<String>) -> ShortcutEffect {
        let Some(nickname) = target else {
            return ShortcutEffect::Settled(ShortcutOutcome::NobodyInCycle);
        };

        match self.windows.get(&nickname) {
            Some(window) => ShortcutEffect::Focus {
                nickname,
                window: *window,
            },
            None => ShortcutEffect::Settled(ShortcutOutcome::NoWindow { nickname }),
        }
    }

    fn toggle_foreground(&mut self, current: &str) -> ShortcutEffect {
        let nickname = current.to_owned();

        let outcome = match self.settings.roster.toggle_asleep(current) {
            Some(true) => ShortcutOutcome::Slept { nickname },
            Some(false) => ShortcutOutcome::Woke { nickname },
            None => ShortcutOutcome::NotInRoster { nickname },
        };

        ShortcutEffect::Settled(outcome)
    }
}

fn triage_config(
    journal: &mut Journal,
    failure: Option<ConfigError>,
    quarantined: Option<String>,
    quarantine_failure: Option<ConfigError>,
) -> Option<ConfigProblem> {
    let problem = failure.map(|failure| {
        let detail = failure.to_string();

        journal.push(JournalEvent::ConfigLoadFailed {
            detail: detail.clone(),
            quarantined: quarantined.clone(),
        });

        match failure {
            ConfigError::Malformed { .. } => ConfigProblem::Malformed {
                detail,
                quarantined,
            },
            _ => ConfigProblem::Unreadable { detail },
        }
    });

    let Some(failure) = quarantine_failure else {
        return problem;
    };

    let detail = failure.to_string();

    journal.push(JournalEvent::ConfigNotSetAside {
        detail: detail.clone(),
    });

    Some(ConfigProblem::NotSetAside { detail })
}

#[must_use]
fn accelerator_of(shortcut: Option<&Shortcut>) -> Option<String> {
    shortcut.map(|shortcut| shortcut.as_str().to_owned())
}

fn nickname_of(character: Option<&Character>) -> Option<String> {
    character.map(|character| character.nickname.clone())
}

fn view_of(character: &Character) -> CharacterView {
    CharacterView {
        nickname: character.nickname.clone(),
        gender: character.gender,
        asleep: character.asleep,
        online: character.online,
        relayed: character.relayed,
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct ScanChange {
    pub changed: bool,
    pub relayed_gone: Vec<String>,
    pub none_relayed_left: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Decision {
    Focus(WindowId),
    FocusUnlessMinimized(WindowId),
    Ignored(Outcome),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ShortcutEffect {
    Focus { nickname: String, window: WindowId },
    Settled(ShortcutOutcome),
}

pub fn lock(app: &AppHandle) -> MutexGuard<'_, Multifus> {
    app.state::<AppState>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}

#[cfg(test)]
mod tests {
    use tempfile::TempDir;

    use crate::app::journal::RelayFailure;

    use super::*;

    fn multifus(directory: &TempDir) -> Multifus {
        Multifus::new(MultifusParams {
            store: ConfigStore::in_directory(directory.path()),
            loaded: Loaded {
                settings: Settings::default(),
                failure: None,
                quarantined: None,
                quarantine_failure: None,
            },
            version: "0.0.0".to_owned(),
            system: "test".to_owned(),
            launch: Launch::ByHand,
            screen_saver: ScreenSaverView::Never,
        })
    }

    fn journalled(state: &Multifus) -> Vec<JournalEvent> {
        state
            .journal
            .entries()
            .into_iter()
            .map(|entry| entry.event)
            .filter(|event| !matches!(event, JournalEvent::Started { .. }))
            .collect()
    }

    fn window(pid: u64, nickname: &str) -> GameWindow {
        let title = format!("{nickname} - Dofus Retro v1.48.21");

        GameWindow::from_title(WindowId::from_raw(pid), &title).expect("a game window")
    }

    #[test]
    fn a_window_in_the_dock_is_only_spared_once_the_switch_is_off() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        assert_eq!(
            state.decide("Alpha", Some(NotificationKind::Combat)),
            Decision::Focus(WindowId::from_raw(1))
        );

        state.set_wakes_minimized(false, Surface::Window);

        assert_eq!(
            state.decide("Alpha", Some(NotificationKind::Combat)),
            Decision::FocusUnlessMinimized(WindowId::from_raw(1))
        );
    }

    #[test]
    fn sparing_the_minimized_says_nothing_about_the_kinds() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_wakes_minimized(false, Surface::Window);

        state.set_auto_focus(NotificationKind::Combat, false);

        assert_eq!(
            state.decide("Alpha", Some(NotificationKind::Combat)),
            Decision::Ignored(Outcome::KindDisabled)
        );
        assert_eq!(
            state.decide("Alpha", Some(NotificationKind::Trade)),
            Decision::FocusUnlessMinimized(WindowId::from_raw(1))
        );
    }

    #[test]
    fn the_cycle_shortcuts_hand_back_the_window_of_the_next_character() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);

        assert_eq!(
            state.decide_shortcut(ShortcutAction::Next, "Alpha"),
            ShortcutEffect::Focus {
                nickname: "Bravo".to_owned(),
                window: WindowId::from_raw(2),
            }
        );
        assert_eq!(
            state.decide_shortcut(ShortcutAction::Previous, "Alpha"),
            ShortcutEffect::Focus {
                nickname: "Bravo".to_owned(),
                window: WindowId::from_raw(2),
            }
        );
    }

    #[test]
    fn the_veille_shortcut_acts_on_the_character_in_front() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);

        assert_eq!(
            state.decide_shortcut(ShortcutAction::ToggleAsleep, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::Slept {
                nickname: "Alpha".to_owned()
            })
        );

        assert_eq!(
            state.decide_shortcut(ShortcutAction::Next, "Bravo"),
            ShortcutEffect::Focus {
                nickname: "Bravo".to_owned(),
                window: WindowId::from_raw(2),
            }
        );

        assert_eq!(
            state.decide_shortcut(ShortcutAction::ToggleAsleep, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::Woke {
                nickname: "Alpha".to_owned()
            })
        );
    }

    #[test]
    fn a_shortcut_fired_from_a_client_opened_a_moment_ago_says_so() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert_eq!(
            state.decide_shortcut(ShortcutAction::ToggleAsleep, "Echo"),
            ShortcutEffect::Settled(ShortcutOutcome::NotInRoster {
                nickname: "Echo".to_owned()
            })
        );
    }

    #[test]
    fn the_swap_shortcut_alternates_and_does_nothing_without_a_gender() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);

        assert_eq!(
            state.decide_shortcut(ShortcutAction::Swap, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::NoGender)
        );

        state.set_gender("Alpha", Some(Gender::Male));
        state.set_gender("Bravo", Some(Gender::Female));

        assert_eq!(
            state.decide_shortcut(ShortcutAction::Swap, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::Swapped {
                awake: Gender::Female
            })
        );
        assert_eq!(
            state.decide_shortcut(ShortcutAction::Swap, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::Swapped {
                awake: Gender::Male
            })
        );
    }

    #[test]
    fn a_veille_moved_from_a_row_is_written_down() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        state.toggle_asleep("Alpha");
        state.toggle_asleep("Alpha");

        let written = journalled(&state);

        assert!(
            written.contains(&JournalEvent::Roster {
                change: RosterChange::Slept {
                    nickname: "Alpha".to_owned()
                }
            }),
            "{written:?}"
        );
        assert!(
            written.contains(&JournalEvent::Roster {
                change: RosterChange::Woke {
                    nickname: "Alpha".to_owned()
                }
            }),
            "{written:?}"
        );
    }

    #[test]
    fn a_veille_on_a_character_nobody_knows_writes_nothing() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.toggle_asleep("Nobody");

        assert_eq!(journalled(&state), Vec::new());
    }

    #[test]
    fn a_grouped_action_on_nobody_writes_nothing() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        state.set_gender_asleep(Gender::Female, true);

        let roster_changes = journalled(&state)
            .into_iter()
            .filter(|event| matches!(event, JournalEvent::Roster { .. }))
            .count();

        assert_eq!(roster_changes, 0);
    }

    #[test]
    fn a_drag_that_changes_nothing_writes_nothing() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);

        state.reorder(&["Alpha".to_owned(), "Bravo".to_owned()]);

        let reordered = journalled(&state)
            .into_iter()
            .filter(|event| {
                matches!(
                    event,
                    JournalEvent::Roster {
                        change: RosterChange::Reordered { .. }
                    }
                )
            })
            .count();

        assert_eq!(reordered, 0);

        state.reorder(&["Bravo".to_owned(), "Alpha".to_owned()]);

        assert!(journalled(&state).contains(&JournalEvent::Roster {
            change: RosterChange::Reordered {
                order: vec!["Bravo".to_owned(), "Alpha".to_owned()]
            }
        }));
    }

    #[test]
    fn a_setting_says_which_surface_it_came_from() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.toggle_auto_focus();
        state.set_wakes_minimized(false, Surface::Window);

        let written = journalled(&state);

        assert!(
            written.contains(&JournalEvent::Setting {
                change: SettingChange::AutoFocusEnabled {
                    enabled: false,
                    from: Surface::Tray
                }
            }),
            "{written:?}"
        );
        assert!(
            written.contains(&JournalEvent::Setting {
                change: SettingChange::WakesMinimized {
                    wakes: false,
                    from: Surface::Window
                }
            }),
            "{written:?}"
        );
    }

    #[test]
    fn a_revoked_authorization_says_who_went_offline() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);

        state.apply_denied();

        let written = journalled(&state);

        for nickname in ["Alpha", "Bravo"] {
            assert!(
                written.contains(&JournalEvent::CharacterOffline {
                    nickname: nickname.to_owned()
                }),
                "{nickname} left without a line: {written:?}"
            );
        }
    }

    #[test]
    fn the_first_line_carries_what_a_transcript_is_read_against() {
        let directory = TempDir::new().expect("a temporary directory");
        let state = multifus(&directory);

        let first = state
            .journal
            .entries()
            .into_iter()
            .next()
            .expect("a run opens on a line");

        assert_eq!(
            first.event,
            JournalEvent::Started {
                version: "0.0.0".to_owned(),
                system: "test".to_owned(),
                launch: Launch::ByHand,
            }
        );
    }

    #[test]
    fn a_scan_says_which_relayed_characters_have_just_gone() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.set_relayed("Bravo", false);

        let gone = state.apply_windows(&[window(2, "Bravo")]);

        assert_eq!(gone.relayed_gone, vec!["Alpha".to_owned()]);
        assert!(gone.none_relayed_left, "Bravo is not relayed");

        let quiet = state.apply_windows(&[window(2, "Bravo")]);

        assert!(quiet.relayed_gone.is_empty());
    }

    #[test]
    fn an_authorization_taken_away_is_a_departure_the_relay_has_to_say() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        let denied = state.apply_denied();

        assert_eq!(denied.relayed_gone, vec!["Alpha".to_owned()]);
        assert!(denied.none_relayed_left);
    }

    #[test]
    fn the_relay_is_ready_only_once_a_bot_and_somebody_are_there() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        assert!(!state.is_relay_ready(), "no bot yet");

        state.set_paired(42);

        assert!(state.is_relay_ready());

        state.set_relayed("Alpha", false);

        assert!(!state.is_relay_ready(), "nobody is ticked, see ADR 0011");
    }

    #[test]
    fn a_test_message_does_not_outlive_the_bot_it_proved() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.set_paired(42);
        state.set_test(TestView::Sent);

        state.set_unpaired();

        assert_eq!(state.snapshot().relay.test, TestView::Idle);

        state.set_test(TestView::Sent);
        state.set_paired(43);

        assert_eq!(state.snapshot().relay.test, TestView::Idle);

        state.set_test(TestView::Sent);
        state.reset();

        assert_eq!(state.snapshot().relay.test, TestView::Idle);
    }

    #[test]
    fn an_asleep_character_is_still_relayed_and_an_unticked_one_is_not() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.set_paired(42);
        state.set_relayed("Bravo", false);
        state.toggle_asleep("Alpha");

        assert!(!state.relays("Alpha"), "the relay is not switched on");

        state.enable_relay(Surface::Tray);

        assert!(state.relays("Alpha"), "the veille does not silence anybody");
        assert!(!state.relays("Bravo"));
        assert!(!state.relays("Nobody"));
    }

    #[test]
    fn a_relay_that_stops_writes_the_gesture_that_stopped_it() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert!(state.enable_relay(Surface::Window));
        assert!(
            !state.enable_relay(Surface::Tray),
            "already on, nothing to write"
        );
        assert!(state.disable_relay(RelayStop::Shortcut));
        assert!(!state.disable_relay(RelayStop::Tray), "already off");

        let written = journalled(&state);

        assert!(
            written.contains(&JournalEvent::RelayEnabled {
                surface: Surface::Window
            }),
            "{written:?}"
        );
        assert!(
            written.contains(&JournalEvent::RelayDisabled {
                reason: RelayStop::Shortcut
            }),
            "{written:?}"
        );
    }

    #[test]
    fn a_cancelled_start_never_rides_a_later_click_s_claim() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        let first = state.begin_relay_start().expect("nothing was starting");

        assert!(state.begin_relay_start().is_none(), "one start at a time");

        state.cancel_relay_start();

        let second = state.begin_relay_start().expect("the claim was let go");

        assert!(!state.is_relay_starting(first));
        assert!(state.is_relay_starting(second));

        state.end_relay_start(
            first,
            SwitchView::Failed {
                reason: RelayFailure::Keychain {
                    detail: "refusé".to_owned(),
                },
            },
        );

        assert!(state.is_relay_starting(second));
        assert!(state.has_relay_start(), "the stop_if_unready rule sees it");
        assert_eq!(state.snapshot().relay.switch, SwitchView::Starting);
    }

    #[test]
    fn no_two_quick_replies_ever_share_an_identifier() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        let first = state.add_quick_reply();
        let second = state.add_quick_reply();

        assert_ne!(first, second);

        state.set_quick_reply_text(first, "prix libre");
        state.remove_quick_reply(second);

        let third = state.add_quick_reply();

        assert_ne!(third, first);
        assert_eq!(state.quick_reply_text(first).as_deref(), Some("prix libre"));
        assert_eq!(state.quick_reply_text(third).as_deref(), Some(""));
    }

    #[test]
    fn the_four_actions_come_before_the_quick_replies() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        let id = state.add_quick_reply();
        state.set_quick_reply_shortcut(id, Some("Alt+P".to_owned()));

        let bindings = state.bindings();

        assert_eq!(bindings.len(), 5);
        assert_eq!(
            bindings.first().map(|(binding, _)| *binding),
            Some(Binding::Action {
                action: ShortcutAction::Next
            })
        );
        assert_eq!(
            bindings.last().cloned(),
            Some((Binding::QuickReply { id }, Some("Alt+P".to_owned())))
        );
    }

    #[test]
    fn a_quick_reply_that_is_gone_pastes_nothing_and_shows_nothing() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        let id = state.add_quick_reply();

        state.remove_quick_reply(id);

        assert_eq!(state.quick_reply_text(id), None);
        assert!(state.snapshot().quick_replies.is_empty());
    }

    #[test]
    fn a_quick_reply_pastes_what_it_says_now_and_not_what_it_said_at_startup() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        let id = state.add_quick_reply();

        state.set_quick_reply_text(id, "prix libre");
        state.set_quick_reply_text(id, "de rien");

        assert_eq!(state.quick_reply_text(id).as_deref(), Some("de rien"));
    }

    fn open(raws: &[u64]) -> Vec<WindowId> {
        raws.iter().copied().map(WindowId::from_raw).collect()
    }

    #[test]
    fn the_first_turn_of_a_run_finds_nothing_that_has_just_opened() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert_eq!(
            state.take_appeared_client_windows(&open(&[1, 2])),
            Vec::new()
        );
    }

    #[test]
    fn a_client_opened_after_the_first_turn_is_the_only_one_that_appears() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.take_appeared_client_windows(&open(&[1]));

        assert_eq!(
            state.take_appeared_client_windows(&open(&[1, 2])),
            open(&[2])
        );
    }

    #[test]
    fn a_window_that_has_been_filled_never_appears_again() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.take_appeared_client_windows(&open(&[1]));
        state.take_appeared_client_windows(&open(&[1, 2]));

        state.remember_client_window(WindowId::from_raw(2));

        assert_eq!(
            state.take_appeared_client_windows(&open(&[1, 2])),
            Vec::new()
        );
    }

    #[test]
    fn a_window_the_system_refused_to_fill_is_offered_again() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.take_appeared_client_windows(&open(&[1]));

        assert_eq!(
            state.take_appeared_client_windows(&open(&[1, 2])),
            open(&[2])
        );
        assert_eq!(
            state.take_appeared_client_windows(&open(&[1, 2])),
            open(&[2])
        );
    }

    #[test]
    fn a_window_that_flickers_out_of_sight_does_not_appear_again() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.take_appeared_client_windows(&open(&[1]));
        state.take_appeared_client_windows(&open(&[]));

        assert_eq!(state.take_appeared_client_windows(&open(&[1])), Vec::new());
    }

    #[test]
    fn forgetting_the_client_windows_makes_the_next_turn_a_first_one() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.take_appeared_client_windows(&open(&[1]));

        state.forget_client_windows();

        assert_eq!(
            state.take_appeared_client_windows(&open(&[1, 2])),
            Vec::new()
        );
    }

    #[test]
    fn a_turn_that_finds_no_window_leaves_the_next_one_to_appear() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.take_appeared_client_windows(&open(&[]));

        assert_eq!(state.take_appeared_client_windows(&open(&[1])), open(&[1]));
    }

    #[test]
    fn nothing_is_filled_to_the_screen_until_somebody_asks_for_it() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert!(!state.maximizes_on_launch());

        state.set_maximize_on_launch(true);

        assert!(state.maximizes_on_launch());
        assert!(state.snapshot().maximize_on_launch);
        assert!(
            journalled(&state).contains(&JournalEvent::Setting {
                change: SettingChange::MaximizeOnLaunch { maximize: true }
            }),
            "{:?}",
            journalled(&state)
        );
    }

    #[test]
    fn no_window_is_renamed_until_somebody_asks_for_it() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert!(!state.shortens_titles());

        state.set_short_titles(true);

        assert!(state.shortens_titles());
        assert!(state.snapshot().short_titles);
        assert!(
            journalled(&state).contains(&JournalEvent::Setting {
                change: SettingChange::ShortTitles { short: true }
            }),
            "{:?}",
            journalled(&state)
        );
    }

    #[test]
    fn a_cycle_shortcut_with_everyone_asleep_settles_on_nothing() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.toggle_asleep("Alpha");

        assert_eq!(
            state.decide_shortcut(ShortcutAction::Next, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::NobodyInCycle)
        );
    }
}
