use std::collections::HashMap;
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::time::Duration;
use std::time::Instant;

use tauri::AppHandle;
use tauri::Manager;

use crate::app::journal::CharacterShortcutOutcome;
use crate::app::journal::Journal;
use crate::app::journal::JournalEvent;
use crate::app::journal::Launch;
use crate::app::journal::Outcome;
use crate::app::journal::RelayStop;
use crate::app::journal::RosterChange;
use crate::app::journal::SettingChange;
use crate::app::journal::ShortcutOutcome;
use crate::app::journal::Surface;
use crate::app::journal::WalkFrom;
use crate::app::view::AuthorizationView;
use crate::app::view::AutoFocusView;
use crate::app::view::BannerCharacter;
use crate::app::view::BannerStep;
use crate::app::view::BannerView;
use crate::app::view::Binding;
use crate::app::view::BindingView;
use crate::app::view::CharacterView;
use crate::app::view::Check;
use crate::app::view::ClientsView;
use crate::app::view::ConfigProblem;
use crate::app::view::ConfigView;
use crate::app::view::OnboardingView;
use crate::app::view::PairingView;
use crate::app::view::QuickReplyView;
use crate::app::view::RelayView;
use crate::app::view::RuneTableView;
use crate::app::view::ScreenSaverView;
use crate::app::view::ShortcutAction;
use crate::app::view::ShortcutStatus;
use crate::app::view::ShortcutView;
use crate::app::view::Snapshot;
use crate::app::view::Step;
use crate::app::view::StepView;
use crate::app::view::SwitchView;
use crate::app::view::TestView;
use crate::app::view::UpdateView;
use crate::app::view::WalkView;
use crate::app::view::WheelSlice;
use crate::app::view::WheelView;
use crate::app::walk::WalkPlan;
use crate::app::wheel;
use crate::app::wheel::WheelPlan;
use crate::config::Banner;
use crate::config::BannerCorner;
use crate::config::ConfigError;
use crate::config::ConfigStore;
use crate::config::Language;
use crate::config::Loaded;
use crate::config::QuickReply;
use crate::config::QuickReplyId;
use crate::config::RUNE_TABLE_CLEAREST;
use crate::config::RUNE_TABLE_NARROWEST;
use crate::config::RUNE_TABLE_STEP;
use crate::config::RUNE_TABLE_VEIL_STEP;
use crate::config::RUNE_TABLE_WIDEST;
use crate::config::RuneOffset;
use crate::config::Settings;
use crate::config::Shortcuts;
use crate::config::Traces;
use crate::config::WHEEL_SMALLEST;
use crate::config::WHEEL_STEP;
use crate::config::WHEEL_WIDEST;
use crate::domain::Character;
use crate::domain::Class;
use crate::domain::Color;
use crate::domain::Gender;
use crate::domain::NotificationKind;
use crate::domain::Portrait;
use crate::domain::Shortcut;
use crate::platform::GameWindow;
use crate::platform::KeyLabels;
use crate::platform::PasteSender;
use crate::platform::PlatformNotificationWatcher;
use crate::platform::WindowId;
use crate::platform::WindowManager;

pub type AppState = Mutex<Multifus>;

pub type WatcherState = Mutex<PlatformNotificationWatcher>;

pub type WindowState = Arc<dyn WindowManager>;

pub type PasteState = Arc<dyn PasteSender>;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StartId(u64);

#[derive(Debug)]
pub struct Multifus {
    store: ConfigStore,
    version: String,
    system: String,
    system_language: Language,
    keyboard: KeyLabels,
    settings: Settings,
    shortcut_statuses: HashMap<Binding, ShortcutStatus>,
    held: HashMap<Binding, String>,
    shortcuts_armed: bool,
    windows: HashMap<String, WindowId>,
    windows_seen: HashMap<String, WindowId>,
    seen_client_windows: Option<HashSet<WindowId>>,
    client_watchers: usize,
    watched_clients: Option<ClientsView>,
    painted_windows: HashMap<WindowId, WindowLook>,
    taskbar_combines: bool,
    granted: Option<bool>,
    listening: bool,
    heard: bool,
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
    walk_enabled: bool,
    banner_character: Option<BannerCharacter>,
    rune_table_open: bool,
    rune_table_previewing: bool,
    journal: Journal,
}

#[derive(Debug)]
pub struct MultifusParams {
    pub store: ConfigStore,
    pub loaded: Loaded,
    pub version: String,
    pub system: String,
    pub system_language: Language,
    pub keyboard: KeyLabels,
    pub launch: Launch,
    pub screen_saver: ScreenSaverView,
    pub taskbar_combines: bool,
}

impl Multifus {
    #[must_use]
    pub fn new(params: MultifusParams) -> Self {
        let MultifusParams {
            store,
            loaded,
            version,
            system,
            system_language,
            keyboard,
            launch,
            screen_saver,
            taskbar_combines,
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
            system_language,
            keyboard,
            settings,
            shortcut_statuses: HashMap::new(),
            held: HashMap::new(),
            shortcuts_armed: false,
            windows: HashMap::new(),
            windows_seen: HashMap::new(),
            seen_client_windows: None,
            client_watchers: 0,
            watched_clients: None,
            painted_windows: HashMap::new(),
            taskbar_combines,
            granted: None,
            listening: false,
            heard: false,
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
            walk_enabled: false,
            banner_character: None,
            rune_table_open: false,
            rune_table_previewing: false,
            journal,
        }
    }

    #[must_use]
    pub fn snapshot(&self) -> Snapshot {
        let defaults = Shortcuts::default();

        Snapshot {
            version: self.version.clone(),
            system: self.system.clone(),
            language: self.language(),
            keyboard: self.keyboard.clone(),
            characters: self
                .settings
                .roster
                .characters()
                .iter()
                .map(|character| self.view_of(character))
                .collect(),
            start_at_login: self.settings.start_at_login,
            maximize_on_launch: self.settings.maximize_on_launch,
            short_titles: self.settings.short_titles,
            paint_portraits: self.settings.paint_portraits,
            ungroup_taskbar: self.settings.ungroup_taskbar,
            taskbar_combines: self.taskbar_combines,
            shortcuts: ShortcutAction::ALL
                .into_iter()
                .map(|action| ShortcutView {
                    action,
                    accelerator: self.accelerator(action),
                    status: self.status_of(&Binding::Action { action }),
                    is_default: self.shortcut(action) == shortcut_in(&defaults, action),
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
                    status: self.status_of(&Binding::QuickReply { id: quick_reply.id }),
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
            onboarding: self.onboarding(),
            config: ConfigView {
                path: self.config_path().display().to_string(),
                problem: self.problem.clone(),
            },
            update: self.update.clone(),
            walk: WalkView {
                enabled: self.walk_enabled,
                banner: BannerView {
                    corner: self.settings.banner.corner,
                    screen: self.settings.banner.screen.clone(),
                },
            },
            wheel: WheelView {
                diameter: self.settings.wheel.diameter,
                smallest: WHEEL_SMALLEST,
                widest: WHEEL_WIDEST,
                step: WHEEL_STEP,
                dead_zone: wheel::DEAD_ZONE,
                demo: wheel::demo_slices(wheel::demo_crowd()),
            },
            rune_table: RuneTableView {
                width: self.settings.rune_table.width,
                narrowest: RUNE_TABLE_NARROWEST,
                widest: RUNE_TABLE_WIDEST,
                step: RUNE_TABLE_STEP,
                transparency: self.settings.rune_table.transparency,
                clearest: RUNE_TABLE_CLEAREST,
                veil_step: RUNE_TABLE_VEIL_STEP,
                everywhere: self.settings.rune_table.everywhere,
                previewing: self.rune_table_previewing,
            },
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
            .map(|character| self.view_of(character))
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
    pub fn config_path(&self) -> PathBuf {
        self.store.path().to_path_buf()
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

    pub fn set_class(&mut self, nickname: &str, class: Option<Class>) {
        let Some(character) = self.settings.roster.get_mut(nickname) else {
            return;
        };

        character.class = class;

        self.log(JournalEvent::Roster {
            change: RosterChange::ClassAssigned {
                nickname: nickname.to_owned(),
                class,
            },
        });
        self.save();
    }

    pub fn set_color(&mut self, nickname: &str, color: Option<Color>) {
        let Some(character) = self.settings.roster.get_mut(nickname) else {
            return;
        };

        character.color = color;

        self.log(JournalEvent::Roster {
            change: RosterChange::ColorAssigned {
                nickname: nickname.to_owned(),
                color,
            },
        });
        self.save();
    }

    pub fn toggle_excluded(&mut self, nickname: &str) {
        let change = match self.settings.roster.toggle_excluded(nickname) {
            Some(true) => RosterChange::Excluded {
                nickname: nickname.to_owned(),
            },
            Some(false) => RosterChange::Included {
                nickname: nickname.to_owned(),
            },
            None => return,
        };

        self.log(JournalEvent::Roster { change });
    }

    pub fn set_gender_excluded(&mut self, gender: Gender, excluded: bool) {
        let moved = self
            .settings
            .roster
            .set_excluded_for_gender(gender, excluded);

        if moved == 0 {
            return;
        }

        self.log(JournalEvent::Roster {
            change: RosterChange::GenderExcluded { gender, excluded },
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
        shortcut_in(&self.settings.shortcuts, action)
    }

    #[must_use]
    fn accelerator(&self, action: ShortcutAction) -> Option<String> {
        accelerator_of(self.shortcut(action))
    }

    #[must_use]
    fn status_of(&self, binding: &Binding) -> ShortcutStatus {
        self.shortcut_statuses
            .get(binding)
            .cloned()
            .unwrap_or(ShortcutStatus::Unbound)
    }

    #[must_use]
    fn view_of(&self, character: &Character) -> CharacterView {
        CharacterView {
            nickname: character.nickname.clone(),
            gender: character.gender,
            class: character.class,
            color: character.color,
            main: character.main,
            excluded: character.excluded,
            online: character.online,
            relayed: character.relayed,
            shortcut: accelerator_of(character.shortcut.as_ref()),
            shortcut_status: self.status_of(&Binding::Character {
                nickname: character.nickname.clone(),
            }),
        }
    }

    #[must_use]
    pub fn bindings(&self) -> Vec<(Binding, Option<String>)> {
        let actions = ShortcutAction::ALL
            .into_iter()
            .map(|action| (Binding::Action { action }, self.accelerator(action)));

        let characters = self.settings.roster.characters().iter().map(|character| {
            (
                Binding::Character {
                    nickname: character.nickname.clone(),
                },
                accelerator_of(character.shortcut.as_ref()),
            )
        });

        let quick_replies = self.settings.quick_replies.iter().map(|quick_reply| {
            (
                Binding::QuickReply { id: quick_reply.id },
                accelerator_of(quick_reply.shortcut.as_ref()),
            )
        });

        actions.chain(characters).chain(quick_replies).collect()
    }

    #[must_use]
    pub fn held(&self) -> HashMap<Binding, String> {
        self.held.clone()
    }

    #[must_use]
    pub fn shortcuts_armed(&self) -> bool {
        self.shortcuts_armed
    }

    pub fn arm_shortcuts(&mut self, armed: bool) {
        self.shortcuts_armed = armed;
    }

    pub fn remember_bound(&mut self, bindings: &[BindingView]) -> bool {
        let statuses = bindings
            .iter()
            .map(|bound| (bound.binding.clone(), bound.status.clone()))
            .collect::<HashMap<_, _>>();
        let learnt = statuses != self.shortcut_statuses;

        self.shortcut_statuses = statuses;

        self.held = bindings
            .iter()
            .filter_map(|bound| {
                let accelerator = bound.accelerator.clone()?;

                matches!(bound.status, ShortcutStatus::Registered)
                    .then(|| (bound.binding.clone(), accelerator))
            })
            .collect();

        learnt
    }

    pub fn set_shortcut(&mut self, action: ShortcutAction, accelerator: Option<String>) {
        let shortcut = accelerator.and_then(Shortcut::new);

        let slot = match action {
            ShortcutAction::Next => &mut self.settings.shortcuts.next,
            ShortcutAction::Previous => &mut self.settings.shortcuts.previous,
            ShortcutAction::Main => &mut self.settings.shortcuts.main,
            ShortcutAction::ToggleExcluded => &mut self.settings.shortcuts.toggle_excluded,
            ShortcutAction::Walk => &mut self.settings.shortcuts.walk,
            ShortcutAction::MaximizeAll => &mut self.settings.shortcuts.maximize_all,
            ShortcutAction::Wheel => &mut self.settings.shortcuts.wheel,
            ShortcutAction::RuneTable => &mut self.settings.shortcuts.rune_table,
        };

        *slot = shortcut;

        self.save();
    }

    pub fn set_character_shortcut(&mut self, nickname: &str, accelerator: Option<String>) {
        let shortcut = accelerator.and_then(Shortcut::new);

        let Some(character) = self.settings.roster.get_mut(nickname) else {
            return;
        };

        character.shortcut = shortcut;
        self.save();
    }

    pub fn reset_shortcuts(&mut self) {
        self.settings.shortcuts = Shortcuts::default();

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
    pub fn language(&self) -> Language {
        self.settings.language.unwrap_or(self.system_language)
    }

    pub fn set_language(&mut self, language: Language) {
        self.settings.language = Some(language);

        self.log(JournalEvent::Setting {
            change: SettingChange::Language { language },
        });
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

    pub fn set_taskbar_combines(&mut self, combines: bool) -> bool {
        let changed = self.taskbar_combines != combines;

        self.taskbar_combines = combines;

        changed
    }

    #[must_use]
    pub fn paints_portraits(&self) -> bool {
        self.settings.paint_portraits
    }

    pub fn set_paint_portraits(&mut self, paint: bool) {
        self.settings.paint_portraits = paint;

        self.log(JournalEvent::Setting {
            change: SettingChange::PaintPortraits { paint },
        });
        self.save();
    }

    #[must_use]
    pub fn ungroups_taskbar(&self) -> bool {
        self.settings.ungroup_taskbar
    }

    pub fn set_ungroup_taskbar(&mut self, ungroup: bool) {
        self.settings.ungroup_taskbar = ungroup;

        self.log(JournalEvent::Setting {
            change: SettingChange::UngroupTaskbar { ungroup },
        });
        self.save();
    }

    #[must_use]
    pub fn looks_to_paint(&self) -> Vec<Painting> {
        self.windows_seen
            .iter()
            .filter_map(|(nickname, window)| {
                let look = self.look_wanted(nickname);

                (self.painted_windows.get(window) != Some(&look)).then(|| Painting {
                    nickname: nickname.clone(),
                    window: *window,
                    look,
                })
            })
            .collect()
    }

    #[must_use]
    fn look_wanted(&self, nickname: &str) -> WindowLook {
        let Some(character) = self
            .settings
            .roster
            .get(nickname)
            .filter(|character| character.online)
        else {
            return WindowLook::default();
        };

        let portrait = self
            .settings
            .paint_portraits
            .then(|| character.portrait())
            .flatten();

        WindowLook {
            portrait,
            color: portrait.and(character.color),
            ungrouped: self.settings.ungroup_taskbar && self.taskbar_combines,
        }
    }

    pub fn remember_painted(&mut self, painting: &Painting) {
        self.painted_windows.insert(painting.window, painting.look);

        let portraits = trace_nickname(
            &mut self.settings.traces.portraits,
            &painting.nickname,
            painting.look.portrait.is_some(),
        );
        let ungrouped = trace_nickname(
            &mut self.settings.traces.ungrouped,
            &painting.nickname,
            painting.look.ungrouped,
        );

        if portraits || ungrouped {
            self.save();
        }
    }

    pub fn forget_closed_windows(&mut self) {
        let live = self.windows.values().copied().collect::<HashSet<_>>();

        self.painted_windows
            .retain(|window, _| live.contains(window));
    }

    #[must_use]
    pub fn wore_portrait(&self, nickname: &str) -> bool {
        self.settings.traces.portraits.contains(nickname)
    }

    #[must_use]
    pub fn was_ungrouped(&self, nickname: &str) -> bool {
        self.settings.traces.ungrouped.contains(nickname)
    }

    #[must_use]
    pub fn portraits_to_give_back(&self) -> Vec<TracedWindow> {
        self.traced_windows(&self.settings.traces.portraits)
    }

    #[must_use]
    pub fn groups_to_give_back(&self) -> Vec<TracedWindow> {
        self.traced_windows(&self.settings.traces.ungrouped)
    }

    #[must_use]
    fn traced_windows(&self, traced: &HashSet<String>) -> Vec<TracedWindow> {
        self.windows_seen
            .iter()
            .filter(|(nickname, _)| traced.contains(*nickname))
            .map(|(nickname, window)| (nickname.clone(), *window))
            .collect()
    }

    pub fn forget_window(&mut self, nickname: &str) {
        let forgotten = [nickname.to_owned()];

        self.forget_portraits(&forgotten);
        self.forget_groups(&forgotten);
    }

    pub fn forget_portraits(&mut self, nicknames: &[String]) {
        self.forget_traces(nicknames, |traces| &mut traces.portraits);
    }

    pub fn forget_groups(&mut self, nicknames: &[String]) {
        self.forget_traces(nicknames, |traces| &mut traces.ungrouped);
    }

    fn forget_traces(
        &mut self,
        nicknames: &[String],
        traced: impl Fn(&mut Traces) -> &mut HashSet<String>,
    ) {
        let mut forgotten = false;

        for nickname in nicknames {
            forgotten |= traced(&mut self.settings.traces).remove(nickname);
        }

        if forgotten {
            self.save();
        }
    }

    pub fn remember_short_titles(&mut self, on_screen: bool) {
        if self.settings.traces.short_titles == on_screen {
            return;
        }

        self.settings.traces.short_titles = on_screen;
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

    pub fn is_walk_enabled(&self) -> bool {
        self.walk_enabled
    }

    pub fn set_walk_enabled(&mut self, enabled: bool, from: WalkFrom) {
        if self.walk_enabled == enabled {
            return;
        }

        self.walk_enabled = enabled;

        self.journal
            .push(JournalEvent::WalkEnabled { enabled, from });
    }

    #[must_use]
    pub fn banner_step(&self) -> BannerStep {
        BannerStep {
            corner: self.settings.banner.corner,
            character: self.banner_character.clone(),
            previewing: !self.walk_enabled,
        }
    }

    #[must_use]
    pub fn banner_place(&self) -> Banner {
        self.settings.banner.clone()
    }

    pub fn set_banner_corner(&mut self, corner: BannerCorner) {
        self.settings.banner.corner = corner;

        self.save();
    }

    pub fn set_banner_screen(&mut self, screen: Option<String>) {
        self.settings.banner.screen = screen;

        self.save();
    }

    pub fn set_banner_character(&mut self, character: Option<BannerCharacter>) {
        self.banner_character = character;
    }

    #[must_use]
    pub fn banner_character_of(&self, window: WindowId) -> Option<BannerCharacter> {
        let nickname = self
            .windows
            .iter()
            .find_map(|(nickname, held)| (*held == window).then_some(nickname))?;
        let character = self.settings.roster.get(nickname)?;

        Some(BannerCharacter {
            nickname: character.nickname.clone(),
            class: character.class,
            gender: character.gender,
            color: character.color,
        })
    }

    #[must_use]
    pub fn wheel_diameter(&self) -> u32 {
        self.settings.wheel.diameter
    }

    pub fn set_wheel_diameter(&mut self, diameter: u32) {
        self.settings.wheel.set_diameter(diameter);

        self.save();
    }

    #[must_use]
    pub fn wheel_plan(&self, here: Option<WindowId>) -> WheelPlan {
        let mut slices = Vec::new();
        let mut windows = Vec::new();

        for character in self.settings.roster.characters() {
            let Some(window) = self.windows.get(&character.nickname).copied() else {
                continue;
            };

            slices.push(WheelSlice {
                nickname: character.nickname.clone(),
                class: character.class,
                gender: character.gender,
                color: character.color,
                main: character.main,
                here: Some(window) == here,
            });
            windows.push(window);
        }

        WheelPlan { slices, windows }
    }

    #[must_use]
    pub fn rune_table_width(&self) -> u32 {
        self.settings.rune_table.width
    }

    pub fn set_rune_table_width(&mut self, width: u32) {
        self.settings.rune_table.set_width(width);
    }

    #[must_use]
    pub fn rune_table_transparency(&self) -> u32 {
        self.settings.rune_table.transparency
    }

    pub fn set_rune_table_transparency(&mut self, transparency: u32) {
        self.settings.rune_table.set_transparency(transparency);
    }

    #[must_use]
    pub fn rune_table_everywhere(&self) -> bool {
        self.settings.rune_table.everywhere
    }

    pub fn set_rune_table_everywhere(&mut self, everywhere: bool) {
        self.settings.rune_table.everywhere = everywhere;
    }

    #[must_use]
    pub fn rune_table_offset(&self) -> Option<RuneOffset> {
        self.settings.rune_table.offset
    }

    pub fn set_rune_table_offset(&mut self, offset: RuneOffset) {
        self.settings.rune_table.offset = Some(offset);
    }

    pub fn clear_rune_table_offset(&mut self) {
        self.settings.rune_table.offset = None;
    }

    #[must_use]
    pub fn is_rune_table_open(&self) -> bool {
        self.rune_table_open
    }

    pub fn set_rune_table_shown(&mut self, open: bool, previewing: bool) {
        self.rune_table_open = open;
        self.rune_table_previewing = previewing;
    }

    #[must_use]
    pub fn walk_plan(&self) -> WalkPlan {
        let watched = self.windows.values().copied().collect();

        let next = self
            .windows
            .iter()
            .filter_map(|(nickname, window)| {
                let after = self.settings.roster.next_in_cycle(nickname)?;

                Some((*window, *self.windows.get(&after.nickname)?))
            })
            .collect();

        WalkPlan { watched, next }
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

    pub fn set_main(&mut self, nickname: &str, main: bool) {
        if !self.settings.roster.set_main(nickname, main) {
            return;
        }

        self.log(JournalEvent::Roster {
            change: RosterChange::Main {
                nickname: nickname.to_owned(),
                main,
            },
        });
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

        for (nickname, window) in &self.windows {
            self.windows_seen.insert(nickname.clone(), *window);
        }

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
    pub fn watches_clients(&self) -> bool {
        self.client_watchers > 0
    }

    pub fn watch_clients(&mut self, watching: bool) {
        self.client_watchers = if watching {
            self.client_watchers.saturating_add(1)
        } else {
            self.client_watchers.saturating_sub(1)
        };

        self.watched_clients = None;
    }

    pub fn take_changed_clients(&mut self, counted: ClientsView) -> Option<ClientsView> {
        if !self.watches_clients() || self.watched_clients == Some(counted) {
            return None;
        }

        self.watched_clients = Some(counted);

        Some(counted)
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

    pub fn note_heard(&mut self) -> bool {
        if self.heard {
            return false;
        }

        self.heard = true;

        true
    }

    pub fn finish_onboarding(&mut self) {
        self.settings.onboarding_done = true;
        self.save();
    }

    pub fn restart_onboarding(&mut self) {
        self.settings.onboarding_done = false;
        self.save();
    }

    #[must_use]
    fn onboarding(&self) -> OnboardingView {
        OnboardingView {
            done: self.settings.onboarding_done,
            steps: Step::ALL
                .into_iter()
                .map(|step| StepView {
                    step,
                    check: self.check_of(step),
                })
                .collect(),
        }
    }

    #[must_use]
    fn check_of(&self, step: Step) -> Check {
        match step {
            Step::Authorization => match self.granted {
                Some(true) => Check::Ready,
                Some(false) => Check::Blocked,
                None => Check::Unknown,
            },
            Step::Proof | Step::Notifications | Step::Focus | Step::GameSetting => {
                if self.heard {
                    Check::Ready
                } else {
                    Check::Unknown
                }
            }
        }
    }

    #[must_use]
    pub fn decide(&self, nickname: &str, kind: Option<NotificationKind>) -> Decision {
        let Some(kind) = kind else {
            return Decision::Ignored(Outcome::KindUnknown);
        };

        if !self.settings.auto_focus.is_enabled(kind) {
            return Decision::Ignored(Outcome::KindDisabled);
        }

        if self.settings.roster.is_excluded(nickname) {
            return Decision::Ignored(Outcome::Excluded);
        }

        match self.windows.get(nickname) {
            Some(window) if self.settings.auto_focus.wakes_minimized => Decision::Focus(*window),
            Some(window) => Decision::FocusUnlessMinimized(*window),
            None => Decision::Ignored(Outcome::NoWindow),
        }
    }

    pub fn decide_shortcut(
        &mut self,
        action: ShortcutAction,
        current: &str,
    ) -> Option<ShortcutEffect> {
        match action {
            ShortcutAction::Next => {
                let target = nickname_of(self.settings.roster.next_in_cycle(current));

                Some(self.aim_at(target))
            }
            ShortcutAction::Previous => {
                let target = nickname_of(self.settings.roster.previous_in_cycle(current));

                Some(self.aim_at(target))
            }
            ShortcutAction::Main => Some(self.aim_at_main(current)),
            ShortcutAction::ToggleExcluded => Some(self.toggle_foreground(current)),
            ShortcutAction::Walk
            | ShortcutAction::MaximizeAll
            | ShortcutAction::Wheel
            | ShortcutAction::RuneTable => None,
        }
    }

    pub fn decide_character_shortcut(&self, nickname: &str, current: &str) -> CharacterAim {
        if self.settings.roster.get(nickname).is_none() {
            return CharacterAim::Settled(CharacterShortcutOutcome::NotInRoster);
        }

        if nickname == current {
            return CharacterAim::Settled(CharacterShortcutOutcome::AlreadyThere);
        }

        match self.windows.get(nickname) {
            Some(window) => CharacterAim::Focus { window: *window },
            None => CharacterAim::Settled(CharacterShortcutOutcome::NoWindow),
        }
    }

    fn aim_at_main(&self, current: &str) -> ShortcutEffect {
        let Some(nickname) = self
            .settings
            .roster
            .main()
            .map(|main| main.nickname.clone())
        else {
            return ShortcutEffect::Settled(ShortcutOutcome::NoMain);
        };

        if nickname == current {
            return ShortcutEffect::Settled(ShortcutOutcome::AlreadyThere { nickname });
        }

        self.aim_at(Some(nickname))
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

        let outcome = match self.settings.roster.toggle_excluded(current) {
            Some(true) => ShortcutOutcome::Excluded { nickname },
            Some(false) => ShortcutOutcome::Included { nickname },
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

fn shortcut_in(shortcuts: &Shortcuts, action: ShortcutAction) -> Option<&Shortcut> {
    match action {
        ShortcutAction::Next => shortcuts.next.as_ref(),
        ShortcutAction::Previous => shortcuts.previous.as_ref(),
        ShortcutAction::Main => shortcuts.main.as_ref(),
        ShortcutAction::ToggleExcluded => shortcuts.toggle_excluded.as_ref(),
        ShortcutAction::Walk => shortcuts.walk.as_ref(),
        ShortcutAction::MaximizeAll => shortcuts.maximize_all.as_ref(),
        ShortcutAction::Wheel => shortcuts.wheel.as_ref(),
        ShortcutAction::RuneTable => shortcuts.rune_table.as_ref(),
    }
}

fn nickname_of(character: Option<&Character>) -> Option<String> {
    character.map(|character| character.nickname.clone())
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct WindowLook {
    pub portrait: Option<Portrait>,
    pub color: Option<Color>,
    pub ungrouped: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Painting {
    pub nickname: String,
    pub window: WindowId,
    pub look: WindowLook,
}

pub type TracedWindow = (String, WindowId);

fn trace_nickname(traced: &mut HashSet<String>, nickname: &str, posed: bool) -> bool {
    if posed {
        return traced.insert(nickname.to_owned());
    }

    traced.remove(nickname)
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CharacterAim {
    Focus { window: WindowId },
    Settled(CharacterShortcutOutcome),
}

pub fn lock(app: &AppHandle) -> MutexGuard<'_, Multifus> {
    hold(app.state::<AppState>().inner())
}

pub fn hold(state: &AppState) -> MutexGuard<'_, Multifus> {
    state.lock().unwrap_or_else(PoisonError::into_inner)
}

#[must_use]
pub fn windows(app: &AppHandle) -> &dyn WindowManager {
    app.state::<WindowState>().inner().as_ref()
}

#[must_use]
pub fn paste_sender(app: &AppHandle) -> &dyn PasteSender {
    app.state::<PasteState>().inner().as_ref()
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::io;

    use tempfile::TempDir;

    use crate::app::journal::RelayFailure;
    use crate::test_doubles;

    use super::*;

    fn multifus(directory: &TempDir) -> Multifus {
        test_doubles::multifus(directory, test_doubles::intact(Settings::default()))
    }

    fn multifus_reloaded(directory: &TempDir) -> Multifus {
        let loaded = ConfigStore::in_directory(directory.path()).load();

        test_doubles::multifus(directory, loaded)
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

    fn decided(state: &mut Multifus, action: ShortcutAction, current: &str) -> ShortcutEffect {
        state
            .decide_shortcut(action, current)
            .expect("this action decides something of the window in front")
    }

    fn raw(window: WindowId) -> u64 {
        window.raw()
    }

    fn painting(nickname: &str, pid: u64, look: WindowLook) -> Painting {
        Painting {
            nickname: nickname.to_owned(),
            window: WindowId::from_raw(pid),
            look,
        }
    }

    #[test]
    fn a_click_hands_the_walk_the_window_of_the_next_character() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo"), window(3, "Charlie")]);

        let plan = state.walk_plan();

        assert_eq!(plan.watched.len(), 3);
        assert_eq!(
            plan.next.get(&WindowId::from_raw(1)).copied().map(raw),
            Some(2)
        );
        assert_eq!(
            plan.next.get(&WindowId::from_raw(3)).copied().map(raw),
            Some(1)
        );
    }

    #[test]
    fn a_character_set_aside_is_stepped_over_and_still_answers_a_click() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo"), window(3, "Charlie")]);
        state.toggle_excluded("Bravo");

        let plan = state.walk_plan();

        assert_eq!(plan.watched.len(), 3);
        assert_eq!(
            plan.next.get(&WindowId::from_raw(1)).copied().map(raw),
            Some(3)
        );
        assert_eq!(
            plan.next.get(&WindowId::from_raw(2)).copied().map(raw),
            Some(3)
        );
    }

    #[test]
    fn the_banner_names_the_character_behind_the_window_it_landed_on() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.set_class("Bravo", Some(Class::Iop));
        state.set_gender("Bravo", Some(Gender::Female));

        let shown = state
            .banner_character_of(WindowId::from_raw(2))
            .expect("a character behind the window");

        assert_eq!(shown.nickname, "Bravo");
        assert_eq!(shown.class, Some(Class::Iop));
        assert_eq!(shown.gender, Some(Gender::Female));
        assert_eq!(state.banner_character_of(WindowId::from_raw(9)), None);
    }

    #[test]
    fn the_wheel_shows_the_connected_in_the_order_of_the_cycle_and_marks_where_one_is() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo"), window(3, "Charlie")]);
        state.set_main("Charlie", true);
        state.toggle_excluded("Bravo");

        let plan = state.wheel_plan(Some(WindowId::from_raw(2)));

        assert_eq!(
            plan.slices
                .iter()
                .map(|slice| slice.nickname.clone())
                .collect::<Vec<_>>(),
            vec!["Alpha", "Bravo", "Charlie"],
            "a character set aside is picked by hand like any other"
        );
        assert_eq!(
            plan.windows,
            vec![
                WindowId::from_raw(1),
                WindowId::from_raw(2),
                WindowId::from_raw(3),
            ]
        );
        assert_eq!(
            plan.slices
                .iter()
                .map(|slice| (slice.here, slice.main))
                .collect::<Vec<_>>(),
            vec![(false, false), (true, false), (false, true)]
        );
    }

    #[test]
    fn a_character_who_is_not_connected_takes_no_slice_of_the_wheel() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.apply_windows(&[window(1, "Alpha")]);

        let plan = state.wheel_plan(None);

        assert_eq!(plan.slices.len(), 1);
        assert_eq!(plan.slices[0].nickname, "Alpha");
        assert!(!plan.slices[0].here, "nobody is in front of the player");
    }

    #[test]
    fn a_slice_carries_the_class_head_the_character_wears_everywhere_else() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_class("Alpha", Some(Class::Sram));
        state.set_gender("Alpha", Some(Gender::Male));

        let plan = state.wheel_plan(None);

        assert_eq!(plan.slices[0].class, Some(Class::Sram));
        assert_eq!(plan.slices[0].gender, Some(Gender::Male));
    }

    #[test]
    fn the_gauge_of_the_wheel_outlives_a_restart() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert_eq!(state.wheel_diameter(), 320);

        state.set_wheel_diameter(300);

        assert_eq!(state.wheel_diameter(), 300);
        assert_eq!(multifus_reloaded(&directory).wheel_diameter(), 300);
    }

    #[test]
    fn the_gauge_and_the_switch_of_the_rune_table_outlive_a_restart() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert_eq!(state.rune_table_width(), 420);
        assert!(!state.rune_table_everywhere());
        assert_eq!(state.rune_table_offset(), None);

        state.set_rune_table_width(540);
        state.set_rune_table_everywhere(true);
        state.save();

        let reloaded = multifus_reloaded(&directory);

        assert_eq!(reloaded.rune_table_width(), 540);
        assert!(reloaded.rune_table_everywhere());
    }

    #[test]
    fn the_place_of_the_rune_table_is_only_written_down_once_the_hand_lets_go() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.set_rune_table_offset(RuneOffset { x: 24.0, y: 40.0 });

        assert_eq!(
            multifus_reloaded(&directory).rune_table_offset(),
            None,
            "the table is still under the hand, and nothing is kept yet"
        );

        state.save();

        assert_eq!(
            multifus_reloaded(&directory).rune_table_offset(),
            Some(RuneOffset { x: 24.0, y: 40.0 })
        );
    }

    #[test]
    fn a_rune_table_called_back_forgets_the_place_it_was_pushed_to() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.set_rune_table_offset(RuneOffset { x: 4000.0, y: 40.0 });
        state.save();

        state.clear_rune_table_offset();
        state.save();

        assert_eq!(
            multifus_reloaded(&directory).rune_table_offset(),
            None,
            "with nothing kept, the table is laid at the corner of the window again"
        );
    }

    #[test]
    fn a_width_kept_from_a_version_before_the_gauge_comes_back_inside_it() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.set_rune_table_width(u32::MAX);
        state.save();

        assert_eq!(state.rune_table_width(), 560);
        assert_eq!(multifus_reloaded(&directory).rune_table_width(), 560);
    }

    #[test]
    fn the_size_of_the_rune_table_is_only_written_down_once_the_gauge_is_let_go() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.set_rune_table_width(540);

        assert_eq!(
            multifus_reloaded(&directory).rune_table_width(),
            420,
            "the gauge is still under the hand, and the file is not written every step"
        );

        state.save();

        assert_eq!(multifus_reloaded(&directory).rune_table_width(), 540);
    }

    #[test]
    fn the_rune_table_says_whether_it_is_posed_and_forgets_it_at_the_next_launch() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert!(!state.is_rune_table_open());

        state.set_rune_table_shown(true, false);

        assert!(state.is_rune_table_open());
        assert!(!state.snapshot().rune_table.previewing);

        state.set_rune_table_shown(true, true);

        assert!(state.snapshot().rune_table.previewing);
        assert!(!multifus_reloaded(&directory).is_rune_table_open());
    }

    #[test]
    fn the_banner_forgets_its_character_and_keeps_its_corner() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.set_banner_corner(BannerCorner::TopLeft);
        state.set_banner_character(Some(BannerCharacter {
            nickname: "Alpha".to_owned(),
            class: None,
            gender: None,
            color: None,
        }));
        state.set_banner_character(None);

        let step = state.banner_step();

        assert_eq!(step.character, None);
        assert_eq!(step.corner, BannerCorner::TopLeft);
    }

    #[test]
    fn a_click_walks_the_cycle_the_next_shortcut_walks() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo"), window(3, "Charlie")]);
        state.toggle_excluded("Bravo");

        let plan = state.walk_plan();

        for (nickname, window) in [("Alpha", 1_u64), ("Bravo", 2), ("Charlie", 3)] {
            let shortcut = decided(&mut state, ShortcutAction::Next, nickname);
            let ShortcutEffect::Focus { window: aimed, .. } = shortcut else {
                panic!("the next shortcut aims at a window");
            };

            assert_eq!(
                plan.next.get(&WindowId::from_raw(window)).copied(),
                Some(aimed)
            );
        }
    }

    #[test]
    fn a_click_on_the_only_character_left_asks_for_no_switch_at_all() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        assert_eq!(
            state.walk_plan().next.get(&WindowId::from_raw(1)).copied(),
            Some(WindowId::from_raw(1))
        );
    }

    #[test]
    fn nobody_in_the_cycle_leaves_every_click_without_a_window_to_go_to() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.toggle_excluded("Alpha");
        state.toggle_excluded("Bravo");

        let plan = state.walk_plan();

        assert_eq!(plan.watched.len(), 2);
        assert!(plan.next.is_empty());
    }

    #[test]
    fn the_walk_never_survives_a_restart() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert!(!state.is_walk_enabled());

        state.set_walk_enabled(true, WalkFrom::Shortcut);

        assert!(state.is_walk_enabled());
        assert_eq!(
            journalled(&state),
            vec![JournalEvent::WalkEnabled {
                enabled: true,
                from: WalkFrom::Shortcut
            }]
        );

        assert!(!multifus(&directory).is_walk_enabled());
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
    fn an_excluded_character_is_left_where_he_is() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        state.toggle_excluded("Alpha");

        assert_eq!(
            state.decide("Alpha", Some(NotificationKind::Combat)),
            Decision::Ignored(Outcome::Excluded)
        );

        state.toggle_excluded("Alpha");

        assert_eq!(
            state.decide("Alpha", Some(NotificationKind::Combat)),
            Decision::Focus(WindowId::from_raw(1))
        );
    }

    #[test]
    fn the_cycle_shortcuts_hand_back_the_window_of_the_next_character() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);

        assert_eq!(
            decided(&mut state, ShortcutAction::Next, "Alpha"),
            ShortcutEffect::Focus {
                nickname: "Bravo".to_owned(),
                window: WindowId::from_raw(2),
            }
        );
        assert_eq!(
            decided(&mut state, ShortcutAction::Previous, "Alpha"),
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
            decided(&mut state, ShortcutAction::ToggleExcluded, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::Excluded {
                nickname: "Alpha".to_owned()
            })
        );

        assert_eq!(
            decided(&mut state, ShortcutAction::Next, "Bravo"),
            ShortcutEffect::Focus {
                nickname: "Bravo".to_owned(),
                window: WindowId::from_raw(2),
            }
        );

        assert_eq!(
            decided(&mut state, ShortcutAction::ToggleExcluded, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::Included {
                nickname: "Alpha".to_owned()
            })
        );
    }

    #[test]
    fn a_shortcut_fired_from_a_client_opened_a_moment_ago_says_so() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert_eq!(
            decided(&mut state, ShortcutAction::ToggleExcluded, "Echo"),
            ShortcutEffect::Settled(ShortcutOutcome::NotInRoster {
                nickname: "Echo".to_owned()
            })
        );
    }

    #[test]
    fn nobody_watching_the_clients_is_told_nothing_of_them() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert!(!state.watches_clients());
        assert_eq!(
            state.take_changed_clients(ClientsView {
                open: 2,
                small: 1,
                readable: true
            }),
            None
        );
    }

    #[test]
    fn a_watched_count_is_told_once_and_again_only_when_it_moves() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        let counted = ClientsView {
            open: 2,
            small: 1,
            readable: true,
        };

        state.watch_clients(true);

        assert!(state.watches_clients());
        assert_eq!(state.take_changed_clients(counted), Some(counted));
        assert_eq!(
            state.take_changed_clients(counted),
            None,
            "the same count twice is not worth waking the window for"
        );

        let filled = ClientsView {
            open: 2,
            small: 0,
            readable: true,
        };

        assert_eq!(state.take_changed_clients(filled), Some(filled));
    }

    #[test]
    fn an_screen_that_opens_twice_and_closes_once_is_still_watching() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.watch_clients(true);
        state.watch_clients(true);
        state.watch_clients(false);

        assert!(
            state.watches_clients(),
            "React mounts twice and cleans up once between the two, and the order of the three is not ours to choose"
        );

        state.watch_clients(false);

        assert!(!state.watches_clients());
    }

    #[test]
    fn a_closing_nobody_opened_leaves_the_count_alone() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.watch_clients(false);
        state.watch_clients(true);

        assert!(state.watches_clients());
    }

    #[test]
    fn coming_back_to_the_screen_is_told_the_count_again() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        let counted = ClientsView {
            open: 2,
            small: 1,
            readable: true,
        };

        state.watch_clients(true);
        state.take_changed_clients(counted);
        state.watch_clients(false);

        assert!(!state.watches_clients());

        state.watch_clients(true);

        assert_eq!(state.take_changed_clients(counted), Some(counted));
    }

    #[test]
    fn an_action_that_moves_no_window_by_itself_decides_nothing_of_the_one_in_front() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        let deciding_nothing = ShortcutAction::ALL
            .into_iter()
            .filter(|action| state.decide_shortcut(*action, "Alpha").is_none())
            .collect::<Vec<_>>();

        assert_eq!(
            deciding_nothing,
            vec![
                ShortcutAction::Walk,
                ShortcutAction::MaximizeAll,
                ShortcutAction::Wheel,
                ShortcutAction::RuneTable,
            ],
            "these four set a mechanism going, and no window moves for them"
        );
    }

    #[test]
    fn the_main_shortcut_brings_the_main_character_in_front() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.set_main("Bravo", true);

        assert_eq!(
            decided(&mut state, ShortcutAction::Main, "Alpha"),
            ShortcutEffect::Focus {
                nickname: "Bravo".to_owned(),
                window: WindowId::from_raw(2),
            }
        );
    }

    #[test]
    fn the_main_shortcut_brings_back_a_character_the_cycle_steps_over() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.set_main("Bravo", true);
        state.toggle_excluded("Bravo");

        assert_eq!(
            decided(&mut state, ShortcutAction::Main, "Alpha"),
            ShortcutEffect::Focus {
                nickname: "Bravo".to_owned(),
                window: WindowId::from_raw(2),
            }
        );
        assert_eq!(
            decided(&mut state, ShortcutAction::Next, "Alpha"),
            ShortcutEffect::Focus {
                nickname: "Alpha".to_owned(),
                window: WindowId::from_raw(1),
            },
            "the cycle keeps stepping over him"
        );
    }

    #[test]
    fn the_main_shortcut_says_when_no_main_is_chosen() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        assert_eq!(
            decided(&mut state, ShortcutAction::Main, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::NoMain)
        );
    }

    #[test]
    fn the_main_shortcut_says_when_you_are_already_there() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_main("Alpha", true);

        assert_eq!(
            decided(&mut state, ShortcutAction::Main, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::AlreadyThere {
                nickname: "Alpha".to_owned()
            })
        );
    }

    #[test]
    fn the_main_shortcut_says_when_the_main_is_disconnected() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.set_main("Bravo", true);
        state.apply_windows(&[window(1, "Alpha")]);

        assert_eq!(
            decided(&mut state, ShortcutAction::Main, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::NoWindow {
                nickname: "Bravo".to_owned()
            })
        );
    }

    #[test]
    fn the_star_is_written_down_and_survives_a_restart() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.set_main("Bravo", true);

        assert!(journalled(&state).contains(&JournalEvent::Roster {
            change: RosterChange::Main {
                nickname: "Bravo".to_owned(),
                main: true,
            }
        }));

        let reloaded = multifus_reloaded(&directory);

        assert_eq!(
            reloaded
                .snapshot()
                .characters
                .into_iter()
                .filter(|character| character.main)
                .map(|character| character.nickname)
                .collect::<Vec<_>>(),
            vec!["Bravo".to_owned()]
        );
    }

    #[test]
    fn a_main_that_moves_nobody_writes_nothing() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.set_main("Alpha", true);

        state.set_main("Nobody", true);
        state.set_main("Bravo", false);
        state.set_main("Alpha", true);

        let changes = journalled(&state)
            .into_iter()
            .filter(|event| {
                matches!(
                    event,
                    JournalEvent::Roster {
                        change: RosterChange::Main { .. }
                    }
                )
            })
            .count();

        assert_eq!(
            changes, 1,
            "only the gesture that moved the main is written"
        );
    }

    #[test]
    fn a_veille_moved_from_a_row_is_written_down() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        state.toggle_excluded("Alpha");
        state.toggle_excluded("Alpha");

        let written = journalled(&state);

        assert!(
            written.contains(&JournalEvent::Roster {
                change: RosterChange::Excluded {
                    nickname: "Alpha".to_owned()
                }
            }),
            "{written:?}"
        );
        assert!(
            written.contains(&JournalEvent::Roster {
                change: RosterChange::Included {
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

        state.toggle_excluded("Nobody");

        assert_eq!(journalled(&state), Vec::new());
    }

    #[test]
    fn a_grouped_action_on_nobody_writes_nothing() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        state.set_gender_excluded(Gender::Female, true);

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

        assert!(
            !state.is_relay_ready(),
            "a paired bot with nobody ticked has nothing to relay"
        );
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
    fn an_excluded_character_is_still_relayed_and_an_unticked_one_is_not() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.set_paired(42);
        state.set_relayed("Bravo", false);
        state.toggle_excluded("Alpha");

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
    fn a_quick_reply_nobody_has_given_keys_to_reads_as_unbound() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        let id = state.add_quick_reply();

        let quick_reply = state
            .snapshot()
            .quick_replies
            .into_iter()
            .find(|quick_reply| quick_reply.id == id)
            .expect("the quick reply that was just added");

        assert_eq!(quick_reply.accelerator, None);
        assert_eq!(quick_reply.status, ShortcutStatus::Unbound);
    }

    #[test]
    fn handing_the_combinations_back_to_the_system_leaves_the_screen_what_it_shows() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        let binding = Binding::Action {
            action: ShortcutAction::Next,
        };
        let bound = vec![BindingView {
            binding: binding.clone(),
            accelerator: Some("F5".to_owned()),
            status: ShortcutStatus::Registered,
        }];

        assert!(
            state.remember_bound(&bound),
            "the first answer of the system is always news"
        );
        assert!(
            !state.remember_bound(&bound),
            "the same answer twice is not worth a line of the journal"
        );

        state.arm_shortcuts(false);

        assert_eq!(state.status_of(&binding), ShortcutStatus::Registered);
        assert_eq!(state.held().get(&binding), Some(&"F5".to_owned()));
        assert!(!state.shortcuts_armed());
    }

    #[test]
    fn the_eight_actions_come_before_the_characters_and_the_quick_replies() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_character_shortcut("Alpha", Some("F1".to_owned()));

        let id = state.add_quick_reply();
        state.set_quick_reply_shortcut(id, Some("Alt+P".to_owned()));

        let bindings = state.bindings();

        assert_eq!(bindings.len(), 11);
        assert_eq!(
            bindings.first().map(|(binding, _)| binding.clone()),
            Some(Binding::Action {
                action: ShortcutAction::Next
            })
        );
        assert_eq!(
            bindings.get(ShortcutAction::ALL.len()).cloned(),
            Some((
                Binding::Character {
                    nickname: "Alpha".to_owned()
                },
                Some("F1".to_owned())
            ))
        );
        assert_eq!(
            bindings.last().cloned(),
            Some((Binding::QuickReply { id }, Some("Alt+P".to_owned())))
        );
    }

    #[test]
    fn a_character_keeps_his_keys_across_a_restart_and_loses_them_with_his_line() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.set_character_shortcut("Alpha", Some("F1".to_owned()));

        let mut reloaded = multifus_reloaded(&directory);

        assert_eq!(
            reloaded
                .snapshot()
                .characters
                .into_iter()
                .find(|character| character.nickname == "Alpha")
                .and_then(|character| character.shortcut),
            Some("F1".to_owned())
        );

        reloaded.remove("Alpha");

        assert!(reloaded.bindings().iter().all(|(binding, _)| {
            binding
                != &Binding::Character {
                    nickname: "Alpha".to_owned(),
                }
        }));
    }

    #[test]
    fn a_character_shortcut_aims_at_him_unless_the_player_is_already_there() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);

        assert_eq!(
            state.decide_character_shortcut("Bravo", "Alpha"),
            CharacterAim::Focus {
                window: WindowId::from_raw(2),
            }
        );
        assert_eq!(
            state.decide_character_shortcut("Alpha", "Alpha"),
            CharacterAim::Settled(CharacterShortcutOutcome::AlreadyThere)
        );
        assert_eq!(
            state.decide_character_shortcut("Charlie", "Alpha"),
            CharacterAim::Settled(CharacterShortcutOutcome::NotInRoster)
        );

        state.apply_windows(&[window(1, "Alpha")]);

        assert_eq!(
            state.decide_character_shortcut("Bravo", "Alpha"),
            CharacterAim::Settled(CharacterShortcutOutcome::NoWindow),
            "Bravo stays in the roster once his client is gone"
        );
    }

    #[test]
    fn the_five_actions_take_back_their_first_day_keys_and_leave_the_rest_alone() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        let id = state.add_quick_reply();
        state.set_quick_reply_shortcut(id, Some("Alt+P".to_owned()));
        state.set_shortcut(ShortcutAction::Next, Some("Alt+N".to_owned()));
        state.set_shortcut(ShortcutAction::ToggleExcluded, None);

        state.reset_shortcuts();

        assert_eq!(state.settings.shortcuts, Shortcuts::default());
        assert!(state.accelerator(ShortcutAction::ToggleExcluded).is_some());
        assert_eq!(
            state.bindings().last().cloned(),
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
        assert!(
            state
                .snapshot()
                .quick_replies
                .iter()
                .all(|quick_reply| quick_reply.id != id)
        );
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
    fn no_taskbar_is_ungrouped_until_somebody_asks_for_it() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert!(!state.ungroups_taskbar());

        state.set_ungroup_taskbar(true);

        assert!(state.ungroups_taskbar());
        assert!(state.snapshot().ungroup_taskbar);
        assert!(
            journalled(&state).contains(&JournalEvent::Setting {
                change: SettingChange::UngroupTaskbar { ungroup: true }
            }),
            "{:?}",
            journalled(&state)
        );
    }

    #[test]
    fn a_taskbar_that_stops_combining_reaches_the_settings_screen() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert!(state.snapshot().taskbar_combines);
        assert!(!state.set_taskbar_combines(true));

        assert!(state.set_taskbar_combines(false));
        assert!(!state.snapshot().taskbar_combines);
    }

    #[test]
    fn a_class_is_written_on_a_character_and_taken_back() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        state.set_class("Alpha", Some(Class::Iop));

        assert_eq!(state.snapshot().characters[0].class, Some(Class::Iop));

        state.set_class("Alpha", None);

        assert_eq!(state.snapshot().characters[0].class, None);
        assert!(
            journalled(&state).contains(&JournalEvent::Roster {
                change: RosterChange::ClassAssigned {
                    nickname: "Alpha".to_owned(),
                    class: Some(Class::Iop)
                }
            }),
            "{:?}",
            journalled(&state)
        );
    }

    #[test]
    fn a_colour_is_written_on_a_character_and_taken_back() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        state.set_color("Alpha", Some(Color::Sky));

        assert_eq!(state.snapshot().characters[0].color, Some(Color::Sky));

        state.set_color("Alpha", None);

        assert_eq!(state.snapshot().characters[0].color, None);
        assert!(
            journalled(&state).contains(&JournalEvent::Roster {
                change: RosterChange::ColorAssigned {
                    nickname: "Alpha".to_owned(),
                    color: Some(Color::Sky)
                }
            }),
            "{:?}",
            journalled(&state)
        );
    }

    #[test]
    fn a_colour_asked_of_a_nickname_the_roster_does_not_hold_changes_nothing() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        state.set_color("Echo", Some(Color::Sky));

        assert_eq!(state.snapshot().characters[0].color, None);
        assert!(!journalled(&state).iter().any(|event| {
            matches!(
                event,
                JournalEvent::Roster {
                    change: RosterChange::ColorAssigned { .. }
                }
            )
        }));
    }

    #[test]
    fn a_colour_reaches_the_window_only_behind_a_portrait() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        state.set_color("Alpha", Some(Color::Sky));

        assert_eq!(
            state.looks_to_paint()[0].look.color,
            None,
            "no class, no icon of ours, so nowhere to put the ring"
        );

        state.set_class("Alpha", Some(Class::Iop));
        state.set_gender("Alpha", Some(Gender::Male));

        assert_eq!(state.looks_to_paint()[0].look.color, Some(Color::Sky));
    }

    #[test]
    fn a_window_is_repainted_when_its_colour_changes() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_class("Alpha", Some(Class::Iop));
        state.set_gender("Alpha", Some(Gender::Male));

        let painting = state.looks_to_paint().remove(0);
        state.remember_painted(&painting);

        assert_eq!(state.looks_to_paint(), Vec::new());

        state.set_color("Alpha", Some(Color::Pink));

        assert_eq!(
            state
                .looks_to_paint()
                .first()
                .map(|next| { next.look.color }),
            Some(Some(Color::Pink))
        );
    }

    #[test]
    fn a_window_is_painted_once_and_repainted_when_its_portrait_changes() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        let bare = painting("Alpha", 1, WindowLook::default());

        assert_eq!(state.looks_to_paint(), vec![bare.clone()]);

        state.remember_painted(&bare);

        assert_eq!(state.looks_to_paint(), Vec::new());

        state.set_gender("Alpha", Some(Gender::Male));
        state.set_class("Alpha", Some(Class::Iop));

        assert_eq!(
            state.looks_to_paint(),
            vec![painting(
                "Alpha",
                1,
                WindowLook {
                    portrait: Some(Portrait {
                        class: Class::Iop,
                        gender: Gender::Male
                    }),
                    color: None,
                    ungrouped: false,
                }
            )]
        );
    }

    #[test]
    fn a_head_is_only_painted_while_somebody_wants_it_there() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_gender("Alpha", Some(Gender::Male));
        state.set_class("Alpha", Some(Class::Iop));

        assert!(state.paints_portraits());

        let painted = painting(
            "Alpha",
            1,
            WindowLook {
                portrait: Some(Portrait {
                    class: Class::Iop,
                    gender: Gender::Male,
                }),
                color: None,
                ungrouped: false,
            },
        );

        assert_eq!(state.looks_to_paint(), vec![painted.clone()]);

        state.remember_painted(&painted);
        state.set_paint_portraits(false);

        assert!(!state.paints_portraits());
        assert!(!state.snapshot().paint_portraits);
        assert_eq!(
            state.looks_to_paint(),
            vec![painting("Alpha", 1, WindowLook::default())],
            "a head nobody wants goes back to the Dofus Retro egg"
        );
        assert!(
            journalled(&state).contains(&JournalEvent::Setting {
                change: SettingChange::PaintPortraits { paint: false }
            }),
            "{:?}",
            journalled(&state)
        );
    }

    #[test]
    fn a_taskbar_that_never_combines_leaves_the_windows_in_their_group() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_ungroup_taskbar(true);

        assert_eq!(
            state.looks_to_paint(),
            vec![painting(
                "Alpha",
                1,
                WindowLook {
                    portrait: None,
                    color: None,
                    ungrouped: true,
                }
            )]
        );

        state.set_taskbar_combines(false);

        assert_eq!(
            state.looks_to_paint(),
            vec![painting("Alpha", 1, WindowLook::default())],
            "a taskbar that never combines has nothing to ungroup"
        );
    }

    #[test]
    fn a_client_that_closes_is_painted_again_when_it_comes_back() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        let bare = painting("Alpha", 1, WindowLook::default());

        state.remember_painted(&bare);
        state.apply_windows(&[]);
        state.forget_closed_windows();
        state.apply_windows(&[window(1, "Alpha")]);

        assert_eq!(state.looks_to_paint(), vec![bare]);
    }

    #[test]
    fn a_window_that_never_wore_a_portrait_is_left_with_the_icon_the_client_gave_it() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        let bare = painting("Alpha", 1, WindowLook::default());

        assert!(!state.wore_portrait("Alpha"));

        state.remember_painted(&bare);

        assert!(!state.wore_portrait("Alpha"));

        let worn = painting(
            "Alpha",
            1,
            WindowLook {
                portrait: Some(Portrait {
                    class: Class::Iop,
                    gender: Gender::Male,
                }),
                color: None,
                ungrouped: false,
            },
        );

        state.remember_painted(&worn);

        assert!(state.wore_portrait("Alpha"));
    }

    #[test]
    fn only_the_windows_multifus_took_out_of_their_group_are_given_back() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);

        state.remember_painted(&painting(
            "Alpha",
            1,
            WindowLook {
                portrait: None,
                color: None,
                ungrouped: true,
            },
        ));
        state.remember_painted(&painting("Bravo", 2, WindowLook::default()));

        assert_eq!(
            state.groups_to_give_back(),
            vec![("Alpha".to_owned(), WindowId::from_raw(1))]
        );
        assert!(state.was_ungrouped("Alpha"));
        assert!(!state.was_ungrouped("Bravo"));
    }

    #[test]
    fn a_portrait_posed_by_a_multifus_that_died_is_given_back_at_the_next_start() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut died = multifus(&directory);
        died.apply_windows(&[window(1, "Alpha")]);
        died.set_gender("Alpha", Some(Gender::Male));
        died.set_class("Alpha", Some(Class::Iop));
        died.remember_painted(&painting(
            "Alpha",
            1,
            WindowLook {
                portrait: Some(Portrait {
                    class: Class::Iop,
                    gender: Gender::Male,
                }),
                color: None,
                ungrouped: false,
            },
        ));

        let mut reborn = multifus_reloaded(&directory);
        reborn.set_class("Alpha", None);
        reborn.apply_windows(&[window(1, "Alpha")]);

        let bare = painting("Alpha", 1, WindowLook::default());

        assert_eq!(reborn.looks_to_paint(), vec![bare.clone()]);
        assert!(
            reborn.wore_portrait("Alpha"),
            "the trace outlives the run that posed the portrait"
        );

        reborn.remember_painted(&bare);

        assert!(
            !reborn.wore_portrait("Alpha"),
            "what is given back is no longer traced"
        );
    }

    #[test]
    fn a_window_of_a_character_left_out_of_the_roster_is_given_back_what_it_wore() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_gender("Alpha", Some(Gender::Male));
        state.set_class("Alpha", Some(Class::Iop));

        let worn = painting(
            "Alpha",
            1,
            WindowLook {
                portrait: Some(Portrait {
                    class: Class::Iop,
                    gender: Gender::Male,
                }),
                color: None,
                ungrouped: false,
            },
        );

        state.remember_painted(&worn);
        state.remove("Alpha");

        assert_eq!(
            state.portraits_to_give_back(),
            vec![("Alpha".to_owned(), WindowId::from_raw(1))],
            "a window left out of the roster is still owed its icon"
        );

        state.apply_windows(&[window(1, "Alpha")]);

        assert_eq!(
            state.looks_to_paint(),
            vec![painting("Alpha", 1, WindowLook::default())]
        );
    }

    #[test]
    fn a_character_the_game_logged_out_stops_wearing_his_face() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_gender("Alpha", Some(Gender::Male));
        state.set_class("Alpha", Some(Class::Iop));

        let worn = painting(
            "Alpha",
            1,
            WindowLook {
                portrait: Some(Portrait {
                    class: Class::Iop,
                    gender: Gender::Male,
                }),
                color: None,
                ungrouped: false,
            },
        );

        assert_eq!(state.looks_to_paint(), vec![worn.clone()]);

        state.remember_painted(&worn);
        state.apply_windows(&[]);

        assert_eq!(
            state.looks_to_paint(),
            vec![painting("Alpha", 1, WindowLook::default())],
            "a window back on the login screen is nobody's, and wears nobody's face"
        );
    }

    #[test]
    fn a_character_the_game_logged_out_is_still_owed_what_its_window_wears() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_gender("Alpha", Some(Gender::Male));
        state.set_class("Alpha", Some(Class::Iop));
        state.remember_painted(&painting(
            "Alpha",
            1,
            WindowLook {
                portrait: Some(Portrait {
                    class: Class::Iop,
                    gender: Gender::Male,
                }),
                color: None,
                ungrouped: false,
            },
        ));

        state.apply_windows(&[]);
        state.forget_closed_windows();

        assert_eq!(
            state.portraits_to_give_back(),
            vec![("Alpha".to_owned(), WindowId::from_raw(1))],
            "a window back on the login screen still wears its portrait"
        );
    }

    #[test]
    fn a_cycle_shortcut_with_everyone_excluded_settles_on_nothing() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.toggle_excluded("Alpha");

        assert_eq!(
            decided(&mut state, ShortcutAction::Next, "Alpha"),
            ShortcutEffect::Settled(ShortcutOutcome::NobodyInCycle)
        );
    }

    #[test]
    fn a_configuration_nobody_could_read_is_said_once_and_dismissed_for_good() {
        let directory = TempDir::new().expect("a temporary directory");
        let quarantined = directory.path().join("config.json.1");

        let mut state = test_doubles::multifus(
            &directory,
            Loaded {
                settings: Settings::default(),
                failure: Some(ConfigError::malformed(
                    directory.path().join("config.json"),
                    "unexpected character",
                )),
                quarantined: Some(quarantined.clone()),
                quarantine_failure: None,
            },
        );

        assert_eq!(
            state.quarantined_path(),
            Some(quarantined.display().to_string().as_str())
        );
        assert!(matches!(
            state.snapshot().config.problem,
            Some(ConfigProblem::Malformed { .. })
        ));
        let said = journalled(&state)
            .iter()
            .filter(|event| matches!(event, JournalEvent::ConfigLoadFailed { .. }))
            .count();

        assert_eq!(said, 1);

        state.dismiss_problem();

        assert_eq!(state.snapshot().config.problem, None);
        assert_eq!(state.quarantined_path(), None);
    }

    #[test]
    fn a_configuration_that_could_not_even_be_set_aside_says_that_instead() {
        let directory = TempDir::new().expect("a temporary directory");
        let path = directory.path().join("config.json");

        let state = test_doubles::multifus(
            &directory,
            Loaded {
                settings: Settings::default(),
                failure: Some(ConfigError::malformed(path.clone(), "unexpected character")),
                quarantined: None,
                quarantine_failure: Some(ConfigError::io(
                    "setting the configuration aside",
                    path,
                    &io::Error::from(io::ErrorKind::PermissionDenied),
                )),
            },
        );

        assert!(matches!(
            state.snapshot().config.problem,
            Some(ConfigProblem::NotSetAside { .. })
        ));
        assert_eq!(
            state.quarantined_path(),
            None,
            "nothing was moved, so nothing can be shown"
        );
    }

    #[test]
    fn a_configuration_that_cannot_be_written_says_so_until_it_can_be_written_again() {
        let directory = TempDir::new().expect("a temporary directory");
        let path = directory.path().join("config.json");
        fs::create_dir(&path).expect("a directory takes the file's place");

        let mut state = multifus(&directory);
        state.set_short_titles(true);

        assert!(matches!(
            state.snapshot().config.problem,
            Some(ConfigProblem::NotSaved { .. })
        ));
        assert!(
            journalled(&state)
                .iter()
                .any(|event| matches!(event, JournalEvent::SaveFailed { .. }))
        );

        fs::remove_dir(&path).expect("the file's place is given back");

        state.set_short_titles(false);

        assert_eq!(
            state.snapshot().config.problem,
            None,
            "a save that works takes the warning away"
        );
    }

    #[test]
    fn what_a_client_writes_after_a_nickname_is_learned_and_kept_across_a_restart() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert_eq!(state.client_title_suffix(), None);

        state.learn_title_suffix(" - Dofus Retro v1.48.21".to_owned());

        assert_eq!(
            multifus_reloaded(&directory)
                .client_title_suffix()
                .as_deref(),
            Some(" - Dofus Retro v1.48.21")
        );
    }

    #[test]
    fn a_client_that_writes_its_title_another_way_teaches_the_new_one() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.learn_title_suffix(" - Dofus Retro v1.48.21".to_owned());
        state.learn_title_suffix(" - Dofus Retro v1.48.22".to_owned());

        assert_eq!(
            state.client_title_suffix().as_deref(),
            Some(" - Dofus Retro v1.48.22")
        );
    }

    #[test]
    fn an_update_is_only_offered_while_there_is_one_to_install() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert_eq!(state.available_update(), None, "the check is still running");

        state.set_update(UpdateView::Available {
            version: "0.2.0".to_owned(),
        });

        assert_eq!(state.available_update().as_deref(), Some("0.2.0"));

        for update in [
            UpdateView::UpToDate,
            UpdateView::Installing,
            UpdateView::Failed {
                detail: "coupure".to_owned(),
            },
        ] {
            state.set_update(update);

            assert_eq!(state.available_update(), None);
        }
    }

    fn check_of_step(state: &Multifus, step: Step) -> Check {
        state
            .snapshot()
            .onboarding
            .steps
            .into_iter()
            .find(|carried| carried.step == step)
            .expect("every step travels in the snapshot")
            .check
    }

    #[test]
    fn a_first_launch_has_its_prise_en_main_to_do_and_nothing_read_yet() {
        let directory = TempDir::new().expect("a temporary directory");
        let state = multifus(&directory);

        assert!(!state.snapshot().onboarding.done);
        assert_eq!(check_of_step(&state, Step::Authorization), Check::Unknown);
    }

    #[test]
    fn the_authorization_read_and_refused_is_the_only_thing_shown_as_closed() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.set_granted(false);

        assert_eq!(check_of_step(&state, Step::Authorization), Check::Blocked);
    }

    #[test]
    fn the_feu_vert_given_leaves_unread_what_the_system_does_not_tell() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.set_granted(true);

        assert_eq!(check_of_step(&state, Step::Authorization), Check::Ready);

        for step in [Step::Notifications, Step::Focus, Step::GameSetting] {
            assert_eq!(
                check_of_step(&state, step),
                Check::Unknown,
                "{step:?} is not something this system tells"
            );
        }
    }

    #[test]
    fn the_game_heard_once_proves_every_door_it_had_to_go_through() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert_eq!(check_of_step(&state, Step::Proof), Check::Unknown);
        assert!(state.note_heard());
        assert!(!state.note_heard(), "nothing moved, nothing to tell");

        for step in [
            Step::Proof,
            Step::Notifications,
            Step::Focus,
            Step::GameSetting,
        ] {
            assert_eq!(
                check_of_step(&state, step),
                Check::Ready,
                "{step:?} was on the way of the notification multifus heard"
            );
        }
    }

    #[test]
    fn the_game_heard_says_nothing_of_the_feu_vert_multifus_reads_itself() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.set_granted(false);
        state.note_heard();

        assert_eq!(check_of_step(&state, Step::Authorization), Check::Blocked);
    }

    #[test]
    fn a_prise_en_main_finished_is_kept_for_the_next_launch() {
        let directory = TempDir::new().expect("a temporary directory");

        multifus(&directory).finish_onboarding();

        assert!(multifus_reloaded(&directory).snapshot().onboarding.done);
    }

    #[test]
    fn multifus_says_it_listens_the_turn_it_starts_and_not_at_every_turn_after() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert!(!state.is_listening());
        assert!(state.set_listening(true));
        assert!(!state.set_listening(true), "nothing moved, nothing to say");
        assert!(state.is_listening());
        assert!(state.snapshot().authorization.listening);

        assert!(state.set_listening(false));

        let said = journalled(&state)
            .into_iter()
            .filter(|event| matches!(event, JournalEvent::Listening))
            .count();

        assert_eq!(said, 1);
    }

    #[test]
    fn an_ecoute_that_dies_is_written_down_and_puts_multifus_back_in_line_to_listen() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.set_listening(true);

        state.log_unless_repeated(JournalEvent::ListeningLost {
            detail: "the notification centre of macOS restarted".to_owned(),
        });
        state.set_listening(false);

        assert!(
            !state.is_listening(),
            "the scan reads this to know it has an ecoute to start again"
        );
        assert!(!state.snapshot().authorization.listening);
        assert!(journalled(&state).contains(&JournalEvent::ListeningLost {
            detail: "the notification centre of macOS restarted".to_owned(),
        }));

        state.set_listening(true);

        let said = journalled(&state)
            .into_iter()
            .filter(|event| matches!(event, JournalEvent::Listening))
            .count();

        assert_eq!(
            said, 2,
            "the ecoute that comes back says so, as the first did"
        );
    }

    #[test]
    fn the_corner_and_the_screen_of_the_banner_outlive_the_run_that_chose_them() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.set_banner_corner(BannerCorner::TopLeft);
        state.set_banner_screen(Some("Écran interne".to_owned()));

        let reborn = multifus_reloaded(&directory);
        let banner = reborn.snapshot().walk.banner;

        assert_eq!(banner.corner, BannerCorner::TopLeft);
        assert_eq!(banner.screen.as_deref(), Some("Écran interne"));
        assert!(!reborn.is_walk_enabled(), "the walk starts off, every time");
    }

    #[test]
    fn the_menu_is_handed_the_connected_characters_and_nobody_else() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha"), window(2, "Bravo")]);
        state.toggle_excluded("Bravo");
        state.apply_windows(&[window(1, "Alpha")]);

        let listed = state
            .connected()
            .into_iter()
            .map(|character| (character.nickname, character.excluded))
            .collect::<Vec<_>>();

        assert_eq!(listed, vec![("Alpha".to_owned(), false)]);
        assert_eq!(
            state.snapshot().characters.len(),
            2,
            "the roster keeps both"
        );

        state.toggle_excluded("Alpha");

        assert_eq!(
            state
                .connected()
                .first()
                .map(|character| character.excluded),
            Some(true),
            "an excluded character is still on the menu, and says so"
        );
    }

    #[test]
    fn short_titles_left_on_screen_are_remembered_for_the_run_that_has_to_give_them_back() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        assert!(!multifus_reloaded(&directory).settings.traces.short_titles);

        state.remember_short_titles(true);

        assert!(
            multifus_reloaded(&directory).settings.traces.short_titles,
            "a multifus that is killed has to find its own renaming again"
        );

        state.remember_short_titles(false);

        assert!(
            !multifus_reloaded(&directory).settings.traces.short_titles,
            "what is given back is no longer traced"
        );
    }

    #[test]
    fn a_reset_takes_back_everything_the_user_ever_chose() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);
        state.set_class("Alpha", Some(Class::Iop));
        state.set_paired(42);
        state.set_short_titles(true);
        state.set_banner_corner(BannerCorner::TopLeft);

        state.reset();

        let snapshot = state.snapshot();

        assert_eq!(snapshot.characters, Vec::new());
        assert!(!snapshot.short_titles);
        assert!(!snapshot.relay.paired);
        assert_eq!(snapshot.walk.banner.corner, BannerCorner::BottomRight);
        assert!(journalled(&state).contains(&JournalEvent::Reset));
        assert_eq!(
            multifus_reloaded(&directory).snapshot().characters,
            Vec::new(),
            "the file was written too"
        );
    }
}
