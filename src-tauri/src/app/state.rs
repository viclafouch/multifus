//! What Multifus knows while it runs, and the one lock that guards it.
//!
//! [`Multifus`] holds the settings as they are right now, veille and connected
//! state included, which the file deliberately does not hold; where every
//! connected character's window is; whether the system is letting Multifus work;
//! and the journal. Every command and the window scan go through the same mutex.
//!
//! One rule keeps that mutex safe: **never hold this lock while touching the
//! notification watcher or the global shortcut plugin**. The watcher's `stop`
//! joins its own thread, and that thread is the one running the sink, which
//! takes this lock. The plugin hops to the main thread and waits for it, and the
//! main thread is where every command takes this lock. Both are the same shape
//! of deadlock, and not holding the two at once is enough to make it impossible.

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

/// The state every command reaches for.
pub type AppState = Mutex<Multifus>;

/// The notification watcher, which needs `&mut self` to start and stop.
pub type WatcherState = Mutex<PlatformNotificationWatcher>;

/// Which click a relay start belongs to. An identity and not a flag: a start
/// that was cancelled must not pass on the claim a later click took out.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StartId(u64);

/// Everything Multifus knows while it runs.
#[derive(Debug)]
pub struct Multifus {
    store: ConfigStore,
    /// The version of the bundle, read once from the package information.
    ///
    /// It travels inside the snapshot rather than through an API of its own,
    /// because a constant the about screen prints is not worth a second channel
    /// and a second loading state on the interface side.
    version: String,
    /// The system, kept for the head of a copied journal. See
    /// [`crate::app::view::Snapshot::system`].
    system: String,
    /// The live configuration. Its roster carries the veille and the connected
    /// state, which never reach the file, see ADR 0004.
    settings: Settings,
    /// What the system answered for each combination, actions and quick replies alike.
    /// Filled in one piece by [`crate::app::shortcuts::apply`], so a binding
    /// missing from it is one nobody has tried to lay down yet.
    shortcut_statuses: HashMap<Binding, ShortcutStatus>,
    /// Where each connected character's window is. Refilled by every scan, since
    /// a [`WindowId`] means nothing once its window is gone.
    windows: HashMap<String, WindowId>,
    /// Every window of a Dofus client Multifus has already seen, which is what
    /// makes a new one new. `None` means it has not been looking, and the turn
    /// that follows finds nothing new.
    seen_client_windows: Option<HashSet<WindowId>>,
    /// The system lets Multifus read window titles and hear the banners.
    ///
    /// `None` until the first scan has asked. Three states and not two, so that
    /// the first answer reaches the journal even when it is the one the field
    /// would have started on anyway: a refusal at launch is the state to explain,
    /// and an empty journal explains nothing.
    granted: Option<bool>,
    /// The banner listening is running.
    listening: bool,
    /// Why the configuration on screen is not the one on disk, if it is not.
    problem: Option<ConfigProblem>,
    /// Where Multifus is with the version that is published, see
    /// [`crate::app::update`]. It starts as a question because the check starts
    /// with the process.
    update: UpdateView,
    /// Whether a pairing is in flight and how the last one ended, see
    /// [`crate::app::relay::pairing`]. Never persisted: it describes a click.
    pairing: PairingView,
    /// Where the last test message got to. Never persisted, for the same reason
    /// as `pairing`: it describes a click.
    test: TestView,
    /// When a test message last reached the telephone, which is what the delay
    /// between two of them is counted from. See [`crate::app::relay::run`].
    last_test: Option<Instant>,
    /// The relay is carrying messages. The twin of `listening`: what runs lives
    /// in [`crate::app::relay::run`], this is what the screens draw.
    relay_active: bool,
    /// The start in flight and the click that owns it, see [`StartId`].
    relay_start: Option<StartId>,
    /// What the switch has to say beyond on or off. Never persisted.
    switch: SwitchView,
    /// The last identity handed out, so no two starts ever share one.
    last_start: u64,
    /// What this machine's screen saver is set to, read once at startup.
    screen_saver: ScreenSaverView,
    journal: Journal,
}

/// Everything a [`Multifus`] starts from.
///
/// Three of these five are here for the journal alone. A transcript is read
/// against a release, on an operating system whose version is what ADR 0002
/// stands on, started in one of two ways that do not show the same thing. Asking
/// the user for any of the three is asking them to tell a story, which is exactly
/// what the journal is meant to replace.
#[derive(Debug)]
pub struct MultifusParams {
    pub store: ConfigStore,
    pub loaded: Loaded,
    /// The version of the bundle, read from the package information.
    pub version: String,
    /// The system, its version and its architecture. No hostname and no locale:
    /// the file this ends up in is meant to be shareable.
    pub system: String,
    /// Whether the session started Multifus or somebody opened it.
    pub launch: Launch,
    /// What the screen saver of this machine is set to. Asked once here rather
    /// than at each activation, see [`ScreenSaverView`].
    pub screen_saver: ScreenSaverView,
}

impl Multifus {
    /// Starts from what the store just read.
    ///
    /// [`Loaded`] always carries a usable configuration and, when there is one,
    /// the reason the stored one was not used. That reason is kept here rather
    /// than dropped, so that the interface can say the file was unreadable
    /// instead of leaving the user with an empty roster and no explanation.
    ///
    /// **It also reaches the journal, and that is not the same channel.** The
    /// snapshot carries the problem until the user dismisses it, and
    /// [`Multifus::dismiss_problem`] then erases the only trace there was that a
    /// roster went missing. The journal keeps it.
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

        // First line of every run, and the head of every transcript.
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

    /// Everything the five screens draw, in one piece.
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
            // Each row draws its own switch and not the outcome of the two, so
            // that a suspended AutoFocus still shows what it will come back to.
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
                // The configuration answers this, never the keychain: it goes
                // out several times a minute and ADR 0009 reads the token once.
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

    /// The connected characters, in cycle order.
    ///
    /// What the system tray lists. It is the roster minus everyone whose client is
    /// closed, which is the whole of what that menu can act on.
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

    // -- The journal ------------------------------------------------------

    pub fn log(&mut self, event: JournalEvent) {
        self.journal.push(event);
    }

    /// Writes an event unless it repeats the last one, and says whether it wrote.
    ///
    /// The answer is only for a caller whose one reason to emit a snapshot was
    /// this line. Everything else ignores it, and nothing may read it as « the
    /// state did not change ».
    pub fn log_unless_repeated(&mut self, event: JournalEvent) -> bool {
        self.journal.push_unless_repeated(event)
    }

    // -- The file ---------------------------------------------------------

    /// Writes the settings, and remembers it if that did not work.
    ///
    /// A failed save clears nothing and stops nothing: what is on screen stays
    /// right, the reason reaches the interface and the journal, and the next
    /// change tries again.
    pub fn save(&mut self) {
        match self.store.save(&self.settings) {
            Ok(()) => {
                // Only the write failure is cleared. A file that was unreadable
                // at startup stays worth telling the user about even once a good
                // one has been written over it, since their old roster is what
                // went missing.
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

    /// Drops the warning the user has read and acknowledged.
    pub fn dismiss_problem(&mut self) {
        self.problem = None;
    }

    /// Where an unreadable configuration was set aside, if one was.
    #[must_use]
    pub fn quarantined_path(&self) -> Option<&str> {
        match &self.problem {
            Some(ConfigProblem::Malformed { quarantined, .. }) => quarantined.as_deref(),
            _ => None,
        }
    }

    // -- The roster -------------------------------------------------------

    /// Assigns a gender, or takes it away.
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

    /// Puts an awake character to sleep, or wakes an asleep one up. Does nothing
    /// for an offline character, which is not sleepable.
    ///
    /// Nothing is saved: the veille never reaches the file, see ADR 0004. It is
    /// written to the journal, which is a different question: the file is what
    /// Multifus starts from tomorrow, the journal is what explains today. A
    /// défilement that reports « personne dans le défilement » is only ever
    /// explained by the rows somebody put to sleep a minute earlier.
    pub fn toggle_asleep(&mut self, nickname: &str) {
        let change = match self.settings.roster.toggle_asleep(nickname) {
            Some(true) => RosterChange::Slept {
                nickname: nickname.to_owned(),
            },
            Some(false) => RosterChange::Woke {
                nickname: nickname.to_owned(),
            },
            // Not a character Multifus knows, so nothing moved and there is
            // nothing to report.
            None => return,
        };

        self.log(JournalEvent::Roster { change });
    }

    /// One of the two grouped actions: pushes the same veille on every online
    /// character of a gender, exactly as if each line had been clicked.
    ///
    /// Nothing is written when nobody moved, the same way
    /// [`Multifus::toggle_asleep`] writes nothing for a nickname it does not hold:
    /// a button pressed on a gender nobody connected carries is not a roster
    /// change, and a journal that says it is would send the reader looking for
    /// one.
    pub fn set_gender_asleep(&mut self, gender: Gender, asleep: bool) {
        let moved = self.settings.roster.set_asleep_for_gender(gender, asleep);

        if moved == 0 {
            return;
        }

        self.log(JournalEvent::Roster {
            change: RosterChange::GenderAsleep { gender, asleep },
        });
    }

    /// Rewrites the cycle order, which is what the drag and drop produces.
    ///
    /// Written only when the order actually came out different. A drag that ends
    /// where it started reaches this method like any other, and the file is
    /// rewritten either way, but the journal has nothing to report.
    pub fn reorder(&mut self, order: &[String]) {
        let before = self.nicknames();

        self.settings.roster.reorder(order);

        // The order that came out, not the one that was asked for: a stale list
        // moves what was dragged and loses nobody, so the two can differ.
        let after = self.nicknames();

        if after != before {
            self.log(JournalEvent::Roster {
                change: RosterChange::Reordered { order: after },
            });
        }

        self.save();
    }

    /// Takes a character out of the roster for good.
    ///
    /// Only ever an explicit action, and the interface only offers it on an
    /// offline character: removing a connected one would see it come straight
    /// back on the next scan, minus the gender the user had assigned.
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

    /// The roster in cycle order, by pseudo.
    #[must_use]
    fn nicknames(&self) -> Vec<String> {
        self.settings
            .roster
            .characters()
            .iter()
            .map(|character| character.nickname.clone())
            .collect()
    }

    // -- The settings -----------------------------------------------------

    /// The combination bound to an action.
    #[must_use]
    fn shortcut(&self, action: ShortcutAction) -> Option<&Shortcut> {
        match action {
            ShortcutAction::Next => self.settings.shortcuts.next.as_ref(),
            ShortcutAction::Previous => self.settings.shortcuts.previous.as_ref(),
            ShortcutAction::ToggleAsleep => self.settings.shortcuts.toggle_asleep.as_ref(),
            ShortcutAction::Swap => self.settings.shortcuts.swap.as_ref(),
        }
    }

    /// The combination bound to an action, as the plugin reads it.
    #[must_use]
    fn accelerator(&self, action: ShortcutAction) -> Option<String> {
        accelerator_of(self.shortcut(action))
    }

    /// What the system answered about one combination, or that nobody has tried
    /// to lay it down yet.
    #[must_use]
    fn status_of(&self, binding: Binding) -> ShortcutStatus {
        self.shortcut_statuses
            .get(&binding)
            .cloned()
            .unwrap_or(ShortcutStatus::Pending)
    }

    /// Every combination to lay on the system, with what it fires.
    ///
    /// **The four actions come first, and that order is the whole point**: the
    /// first to claim a combination holds it, so a duplicate names the action.
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

    /// Takes in what the system answered for every combination.
    pub fn set_shortcut_statuses(&mut self, statuses: HashMap<Binding, ShortcutStatus>) {
        self.shortcut_statuses = statuses;
    }

    /// Binds a combination to an action, or clears it.
    ///
    /// The text is stored as it comes and never interpreted here. Whether the
    /// system accepts it is the plugin's answer, and
    /// [`crate::app::shortcuts::apply`] is what asks for it right after this.
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

    // -- The quick replies ------------------------------------------------------

    /// The line a quick reply would paste, `None` for one that has been removed.
    ///
    /// Read at the moment the key fires and never carried on the queue: a quick reply
    /// rewritten while Multifus runs would otherwise paste its old version.
    #[must_use]
    pub fn quick_reply_text(&self, id: QuickReplyId) -> Option<String> {
        self.settings
            .quick_replies
            .iter()
            .find(|quick_reply| quick_reply.id == id)
            .map(|quick_reply| quick_reply.text.clone())
    }

    /// Adds an empty quick reply at the end of the list and hands back its identifier.
    ///
    /// The largest one plus one, so nothing has to be persisted to allocate it.
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

    /// Rewrites the text of a quick reply, on one line. See [`QuickReply::set_text`].
    pub fn set_quick_reply_text(&mut self, id: QuickReplyId, text: &str) {
        let Some(quick_reply) = self.quick_reply_mut(id) else {
            return;
        };

        quick_reply.set_text(text);
        self.save();
    }

    /// Binds a combination to a quick reply, or clears it. Stored as it comes and
    /// never interpreted here, exactly as [`Multifus::set_shortcut`] does.
    pub fn set_quick_reply_shortcut(&mut self, id: QuickReplyId, accelerator: Option<String>) {
        let shortcut = accelerator.and_then(Shortcut::new);

        let Some(quick_reply) = self.quick_reply_mut(id) else {
            return;
        };

        quick_reply.shortcut = shortcut;
        self.save();
    }

    /// Takes a quick reply away for good. No confirmation is asked for, the same as
    /// taking a character out of the roster.
    pub fn remove_quick_reply(&mut self, id: QuickReplyId) {
        self.settings
            .quick_replies
            .retain(|quick_reply| quick_reply.id != id);
        self.save();
    }

    /// The quick reply this identifier designates, for the two setters that change it.
    #[must_use]
    fn quick_reply_mut(&mut self, id: QuickReplyId) -> Option<&mut QuickReply> {
        self.settings
            .quick_replies
            .iter_mut()
            .find(|quick_reply| quick_reply.id == id)
    }

    /// Whether the user asked Multifus to start with the session.
    ///
    /// The file is what says so, never the system: the registration on disk can
    /// be taken away from under Multifus, and only this can be read as an
    /// intent. See [`crate::app::autostart`].
    #[must_use]
    pub fn starts_at_login(&self) -> bool {
        self.settings.start_at_login
    }

    /// Records that intent. Making the system match it is the caller's next move.
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

    /// What a client was last seen writing after a nickname, and what a short
    /// title is put back from.
    #[must_use]
    pub fn client_title_suffix(&self) -> Option<String> {
        self.settings.client_title_suffix.clone()
    }

    /// Takes in what the boundary just saw a client write. Written to disk only
    /// when it is news, this running every turn the réglage is ticked.
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

    /// Flips one of the seven switches. Global, never per character.
    ///
    /// The window only, so no surface travels with it: the menu has no room for
    /// seven lines, and perimetre.md refuses them per character.
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

    /// Suspends the AutoFocus as a whole, or brings it back.
    ///
    /// The seven are left exactly where they were: this is the switch the system
    /// tray offers, and it has to be undoable without the user having to
    /// remember which kinds they had turned off.
    ///
    /// `from` reaches the journal because it is part of the fact. This switch has
    /// two doors, and which one was used says whether the window had to be
    /// opened, which is the measure of the whole principle of the project.
    pub fn set_auto_focus_enabled(&mut self, enabled: bool, from: Surface) {
        self.settings.auto_focus.enabled = enabled;

        self.log(JournalEvent::Setting {
            change: SettingChange::AutoFocusEnabled { enabled, from },
        });
        self.save();
    }

    /// Whether the AutoFocus is running at all.
    #[must_use]
    pub fn is_auto_focus_enabled(&self) -> bool {
        self.settings.auto_focus.enabled
    }

    /// Says whether a notification takes a window out of the Dock.
    pub fn set_wakes_minimized(&mut self, wakes: bool, from: Surface) {
        self.settings.auto_focus.wakes_minimized = wakes;

        self.log(JournalEvent::Setting {
            change: SettingChange::WakesMinimized { wakes, from },
        });
        self.save();
    }

    /// Suspends the AutoFocus if it was running, brings it back if it was not.
    ///
    /// What the system tray asks for, since a tick carries no state of its own:
    /// reading and writing in one hold, rather than two, leaves no moment where
    /// a command could slip between the question and the answer.
    pub fn toggle_auto_focus(&mut self) {
        self.set_auto_focus_enabled(!self.settings.auto_focus.enabled, Surface::Tray);
    }

    /// Whether a notification takes a window out of the Dock.
    #[must_use]
    pub fn wakes_minimized(&self) -> bool {
        self.settings.auto_focus.wakes_minimized
    }

    /// Wakes the minimized windows if it was not doing so, stops if it was. The
    /// system tray's other switch, and the same reason for one hold.
    pub fn toggle_wakes_minimized(&mut self) {
        self.set_wakes_minimized(!self.settings.auto_focus.wakes_minimized, Surface::Tray);
    }

    /// Everything back to what someone who has never opened Multifus gets,
    /// roster included.
    ///
    /// The connected characters come back on the next scan, without the genders
    /// that were assigned to them. The interface says so before asking.
    pub fn reset(&mut self) {
        self.settings = Settings::default();
        self.windows.clear();
        // The chat goes with the settings, so what the test said about it and
        // the delay it started go too. Same reason as [`Multifus::set_unpaired`].
        self.test = TestView::Idle;
        self.last_test = None;
        self.log(JournalEvent::Reset);
        self.save();
    }

    // -- The relay --------------------------------------------------------

    /// Puts a character in or out of the relay.
    ///
    /// Saved, unlike the veille: which character is the principal does not change
    /// from one session to the next, and retyping it every evening would be a
    /// setting one visits, see ADR 0011. No online guard either, since ticking a
    /// character whose client is closed is exactly what one does before leaving.
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

    /// Says whether the text of a private message leaves the machine with it.
    ///
    /// The one place a notification body is allowed out, ADR 0008, and it is off
    /// until somebody asks for it.
    pub fn set_send_body(&mut self, send_body: bool) {
        self.settings.relay.send_body = send_body;

        self.log(JournalEvent::Setting {
            change: SettingChange::RelayBody { send_body },
        });
        self.save();
    }

    /// Whether a click on the relay item can switch anything on: a chat is known
    /// and somebody is ticked. Neither question is the keychain, ADR 0009.
    #[must_use]
    pub fn is_relay_ready(&self) -> bool {
        self.settings.relay.chat_id.is_some() && self.settings.roster.has_relayed()
    }

    /// Where the relay writes, once it has been switched on.
    #[must_use]
    pub fn chat_id(&self) -> Option<i64> {
        self.settings.relay.chat_id
    }

    /// Whether the text of a private message goes out with it, ADR 0008.
    #[must_use]
    pub fn sends_body(&self) -> bool {
        self.settings.relay.send_body
    }

    /// Whether this character's private messages are carried right now. The
    /// veille is deliberately not looked at, see ADR 0011.
    #[must_use]
    pub fn relays(&self, nickname: &str) -> bool {
        self.relay_active
            && self
                .settings
                .roster
                .get(nickname)
                .is_some_and(|character| character.relayed)
    }

    /// The relay is carrying messages right now.
    #[must_use]
    pub fn is_relay_active(&self) -> bool {
        self.relay_active
    }

    /// Whether the relay still has something to hear: a relayed character with a
    /// window. What the display held awake follows, see CONTEXT.md.
    #[must_use]
    pub fn has_relayed_online(&self) -> bool {
        self.settings.roster.has_relayed_online()
    }

    /// Claims the start, `None` when the relay is already on or already
    /// starting. The one place that decides a second click does nothing.
    pub fn begin_relay_start(&mut self) -> Option<StartId> {
        if self.relay_active || self.relay_start.is_some() {
            return None;
        }

        self.last_start += 1;
        self.relay_start = Some(StartId(self.last_start));
        self.switch = SwitchView::Starting;

        self.relay_start
    }

    /// Whether this start, and not a later one, is the one still wanted. `false`
    /// once a stop has come in, which is how a switch moved off mid-dialog wins.
    pub fn is_relay_starting(&self, start: StartId) -> bool {
        self.relay_start == Some(start)
    }

    /// Whether any start is in flight, for the rules that have to see one coming.
    #[must_use]
    pub fn has_relay_start(&self) -> bool {
        self.relay_start.is_some()
    }

    /// Lets go of this start and leaves what it has to say on screen. Does
    /// nothing when a later start has taken the claim since.
    pub fn end_relay_start(&mut self, start: StartId, outcome: SwitchView) {
        if self.relay_start != Some(start) {
            return;
        }

        self.relay_start = None;
        self.switch = outcome;
    }

    /// The relay is on. Two methods and not one taking a boolean, since the two
    /// do not carry the same thing: a door here, a reason there.
    pub fn enable_relay(&mut self, surface: Surface) -> bool {
        if self.relay_active {
            return false;
        }

        self.relay_active = true;
        self.log(JournalEvent::RelayEnabled { surface });

        true
    }

    /// The relay is off, and this is what stopped it.
    pub fn disable_relay(&mut self, reason: RelayStop) -> bool {
        if !self.relay_active {
            return false;
        }

        self.relay_active = false;
        self.log(JournalEvent::RelayDisabled { reason });

        true
    }

    /// A stop arrived, so a start still reading the keychain is no longer
    /// wanted. Called on every stop, including one that finds nothing running.
    pub fn cancel_relay_start(&mut self) {
        self.relay_start = None;
        // A stop wipes what a start had to say: the card is about to draw « à
        // l'arrêt », and a failure nobody is waiting on would sit under it.
        self.switch = SwitchView::Idle;
    }

    /// Takes in where the pairing got to. See [`crate::app::relay::pairing`].
    pub fn set_pairing(&mut self, pairing: PairingView) {
        self.pairing = pairing;
    }

    /// Takes in where the test message got to. See [`crate::app::relay::run`].
    pub fn set_test(&mut self, test: TestView) {
        self.test = test;
    }

    /// Where the test message got to, for the one caller that has to know
    /// whether another may be asked for.
    pub fn test_view(&self) -> &TestView {
        &self.test
    }

    /// A test message just reached the telephone, which starts the delay.
    pub fn mark_test_sent(&mut self) {
        self.last_test = Some(Instant::now());
    }

    /// How long ago a test last reached the telephone, `None` when none ever
    /// did. Counted from the arrival and not from the click, so a test that
    /// failed can be tried again straight away: nothing was sent to spam.
    pub fn since_last_test(&self) -> Option<Duration> {
        self.last_test.map(|at| at.elapsed())
    }

    /// The pairing went through: the chat is known and the token is put away.
    ///
    /// The chat reaches the file and never the journal, which names no
    /// conversation of anybody's, see [`JournalEvent::RelayPaired`].
    pub fn set_paired(&mut self, chat_id: i64) {
        self.settings.relay.chat_id = Some(chat_id);
        self.pairing = PairingView::Idle;
        // Cleared here too, and not only on the unlinking: an essai still in
        // flight when the last bot was forgotten lands after it.
        self.test = TestView::Idle;
        self.last_test = None;

        self.log(JournalEvent::RelayPaired);
        self.save();
    }

    /// The bot is forgotten. Erasing the keychain entry is the caller's half.
    pub fn set_unpaired(&mut self) {
        self.settings.relay.chat_id = None;
        self.pairing = PairingView::Idle;
        // The test and its delay belonged to the bot being forgotten. Kept, they
        // would greet the next one with « Message d'essai parti », or refuse its
        // first essai for a message it never received.
        self.test = TestView::Idle;
        self.last_test = None;

        self.log(JournalEvent::RelayUnpaired);
        self.save();
    }

    // -- The update -------------------------------------------------------

    /// Takes in where the check got to. See [`crate::app::update`].
    pub fn set_update(&mut self, update: UpdateView) {
        self.update = update;
    }

    /// The version waiting to be installed, if a check found one.
    ///
    /// What the system tray offers, and the reason this is a question and not
    /// the whole state: a menu has one line to give an update, so it either has
    /// a version to name or it has nothing to say.
    #[must_use]
    pub fn available_update(&self) -> Option<String> {
        // Written out rather than caught by a wildcard, so that a sixth state
        // has to be answered for here instead of quietly meaning « nothing to
        // offer ».
        match &self.update {
            UpdateView::Available { version } => Some(version.clone()),
            UpdateView::Checking
            | UpdateView::UpToDate
            | UpdateView::Installing
            | UpdateView::Failed { .. } => None,
        }
    }

    // -- The windows ------------------------------------------------------

    /// Takes in what the scan saw and returns whether anything changed.
    ///
    /// A window whose nickname is unknown enters the roster at the end of the
    /// cycle, which is the only way a character is ever born. A character whose
    /// window is gone stays in the roster, offline.
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
                // A character is born, and that birth is what the file keeps.
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
            // The veille is left exactly as the user set it. ADR 0004 resets it
            // at each launch and says nothing about a reconnection, and clearing
            // it here would be silent: a single scan that misses a window, a
            // client restarting, a title in flux, and a mule put aside on purpose
            // walks back into the cycle without anyone touching it. The row says
            // « En veille » in plain words either way, so nothing is hidden.
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

    /// The client windows this turn sees and that have not been filled yet, in
    /// the order the system gave them. Empty on a first turn, when everything is
    /// unknown and nothing has just been launched.
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

    /// Remembers a window that was filled, so that it is never filled twice.
    pub fn remember_client_window(&mut self, window: WindowId) {
        if let Some(seen) = self.seen_client_windows.as_mut() {
            seen.insert(window);
        }
    }

    /// Stops knowing which client windows are open, so that the next turn is a
    /// first one.
    pub fn forget_client_windows(&mut self) {
        self.seen_client_windows = None;
    }

    /// Where a character's window is, if Multifus can still see one.
    ///
    /// What the system tray aims at, the same way [`Multifus::aim_at`] does for the
    /// cycle: reading happens under this lock, focusing does not.
    #[must_use]
    pub fn window_of(&self, nickname: &str) -> Option<WindowId> {
        self.windows.get(nickname).copied()
    }

    /// What the scan reports when the system will not let Multifus look.
    ///
    /// Everyone goes offline: Multifus has no idea who is connected, and saying
    /// nobody is closer to the truth than leaving stale lamps lit.
    ///
    /// Each departure is written down, exactly as [`Multifus::apply_windows`]
    /// writes it. The authorization line above says why they all left at once,
    /// and it used to be the only line: a roster emptying itself with no
    /// `CharacterOffline` anywhere read as a scan that had stopped running.
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

    /// What one turn leaves the relay to say, once the roster has taken the scan
    /// in. See [`ScanChange`].
    fn scan_change(&self, changed: bool, relayed_gone: Vec<String>) -> ScanChange {
        ScanChange {
            changed,
            relayed_gone,
            none_relayed_left: !self.settings.roster.has_relayed_online(),
        }
    }

    /// Records the answer of the system, and journals only the changes.
    pub fn set_granted(&mut self, granted: bool) -> bool {
        if self.granted == Some(granted) {
            return false;
        }

        self.granted = Some(granted);
        self.log(JournalEvent::Authorization { granted });

        true
    }

    /// Whether the system is letting Multifus work. An authorization nobody has
    /// asked about yet reads as a refusal, which is what the screens should draw
    /// in that half second.
    #[must_use]
    pub fn is_granted(&self) -> bool {
        self.granted == Some(true)
    }

    /// Records that the banner listening started or stopped.
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

    // -- AutoFocus --------------------------------------------------------

    /// What to do with a game notification, decided without touching the system.
    ///
    /// Reading the roster and the switches happens under the lock, focusing does
    /// not. The two are split for that reason: a focus is a system call, and no
    /// system call is made while every command of the application is waiting on
    /// this mutex.
    #[must_use]
    pub fn decide(&self, nickname: &str, kind: Option<NotificationKind>) -> Decision {
        let Some(kind) = kind else {
            return Decision::Ignored(Outcome::KindUnknown);
        };

        if !self.settings.auto_focus.is_enabled(kind) {
            return Decision::Ignored(Outcome::KindDisabled);
        }

        // The veille is deliberately not looked at. An asleep character is out
        // of the cycle, not out of AutoFocus: a trade offered to a mule has to
        // bring it up. See CONTEXT.md.
        match self.windows.get(nickname) {
            Some(window) if self.settings.auto_focus.wakes_minimized => Decision::Focus(*window),
            Some(window) => Decision::FocusUnlessMinimized(*window),
            None => Decision::Ignored(Outcome::NoWindow),
        }
    }

    // -- The shortcuts firing ---------------------------------------------

    /// What a shortcut should do, decided without touching the system.
    ///
    /// `current` is the character whose window is in the foreground, which the
    /// caller has already established: outside the game the four combinations
    /// never get this far. The split is the same as [`Multifus::decide`]'s and
    /// exists for the same reason, no system call under this lock.
    ///
    /// The veille the two toggling actions move is not written to the file, the
    /// file has no room for it, see ADR 0004.
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

    /// Turns the character the cycle chose into the window to bring forward.
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

    /// Puts the character in front to sleep, or wakes it up.
    ///
    /// A refusal here means the roster does not hold that nickname yet, since a
    /// window is in the foreground and the character is therefore online. That
    /// is a client opened less than one scan ago, and it is worth saying so
    /// rather than reporting that nothing had to be done.
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

/// What a load cost, written to the journal and turned into what the band shows.
///
/// Two channels out of one set of facts, and they do not have the same lifetime:
/// the band is dismissed by [`Multifus::dismiss_problem`] and gone for good, the
/// journal keeps it. A roster that opens empty with nothing to explain it is the
/// worst failure this application has.
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

    // A file that could not be read and could not be moved is the one state where
    // the next save writes over somebody's roster. It outranks the reason the file
    // was unreadable, which is why it takes the band.
    let Some(failure) = quarantine_failure else {
        return problem;
    };

    let detail = failure.to_string();

    journal.push(JournalEvent::ConfigNotSetAside {
        detail: detail.clone(),
    });

    Some(ConfigProblem::NotSetAside { detail })
}

/// A combination as the global shortcut plugin reads it, `None` for a binding
/// nothing fires.
#[must_use]
fn accelerator_of(shortcut: Option<&Shortcut>) -> Option<String> {
    shortcut.map(|shortcut| shortcut.as_str().to_owned())
}

/// The nickname of the character the cycle chose, if it chose one.
fn nickname_of(character: Option<&Character>) -> Option<String> {
    character.map(|character| character.nickname.clone())
}

/// One character, as the screens and the system tray both read it.
fn view_of(character: &Character) -> CharacterView {
    CharacterView {
        nickname: character.nickname.clone(),
        gender: character.gender,
        asleep: character.asleep,
        online: character.online,
        relayed: character.relayed,
    }
}

/// What one turn of the scan changed, beyond « something moved ».
///
/// The avis of ADR 0010 hang on this: the transitions are computed under the
/// lock, and the fact travels out as data so the sending happens outside it.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct ScanChange {
    /// Anything at all moved, which is what decides whether a snapshot goes out.
    pub changed: bool,
    /// The relayed characters whose window has just gone, in roster order. The
    /// front and never the state, see ADR 0010.
    pub relayed_gone: Vec<String>,
    /// And no relayed character is connected any more.
    pub none_relayed_left: bool,
}

/// What [`Multifus::decide`] concluded about a game notification.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Decision {
    /// Bring this window to the front.
    Focus(WindowId),
    /// Bring this window to the front, unless the user has put it in the Dock.
    ///
    /// Two variants rather than a flag on one, because the question costs a call
    /// to the system and the ordinary answer is not to ask it. Whether a window
    /// is minimized cannot be decided here anyway: this is the pure side, and
    /// only the boundary knows.
    FocusUnlessMinimized(WindowId),
    /// Do nothing, and this is why.
    Ignored(Outcome),
}

/// What [`Multifus::decide_shortcut`] concluded about a shortcut that fired.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ShortcutEffect {
    /// Bring this window to the front. The only outcome left to the system.
    Focus { nickname: String, window: WindowId },
    /// Everything is done, and this is what happened.
    Settled(ShortcutOutcome),
}

/// Takes the lock, and takes it even when a previous holder panicked.
///
/// A poisoned mutex here means some earlier call died holding it. The data
/// behind it is a roster and a handful of booleans, not an invariant that a
/// panic can half-break, and Multifus refusing to work for the rest of the
/// session would be a worse answer than carrying on.
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

    /// A Multifus with nothing on disk, writing into a directory that dies with
    /// the test rather than into a path written in the source.
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

    /// The events the journal holds, newest last, without the [`Launch`] line
    /// every run opens on.
    fn journalled(state: &Multifus) -> Vec<JournalEvent> {
        state
            .journal
            .entries()
            .into_iter()
            .map(|entry| entry.event)
            .filter(|event| !matches!(event, JournalEvent::Started { .. }))
            .collect()
    }

    /// A window with the title a real client carries, which is the only door
    /// into [`GameWindow`].
    fn window(pid: u64, nickname: &str) -> GameWindow {
        let title = format!("{nickname} - Dofus Retro v1.48.21");

        GameWindow::from_title(WindowId::from_raw(pid), &title).expect("a game window")
    }

    #[test]
    fn a_window_in_the_dock_is_only_spared_once_the_switch_is_off() {
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        // By default nothing is spared: whether the window is in the Dock is a
        // question the boundary is never even asked.
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

        // And the cycle now walks past it.
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
        // The scan runs every few seconds, so a window can be in front before
        // its character has entered the roster. Reporting that nothing had to be
        // done would send the user looking in the wrong place.
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
        // The gap this closes: a shortcut that reports « personne dans le
        // défilement » is only ever explained by the rows somebody clicked a
        // minute earlier, and those clicks used to leave no trace at all.
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
        // Nothing moved, so there is nothing to report. A line here would put a
        // roster change in the journal that never happened.
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);

        state.toggle_asleep("Nobody");

        assert_eq!(journalled(&state), Vec::new());
    }

    #[test]
    fn a_grouped_action_on_nobody_writes_nothing() {
        // The button is never disabled, by the rule of the interface, so it is
        // pressed on a gender nobody connected carries. That is not a roster
        // change, and a line saying it is would send the reader looking for one.
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

        // And it does write when the order really moves.
        state.reorder(&["Bravo".to_owned(), "Alpha".to_owned()]);

        assert!(journalled(&state).contains(&JournalEvent::Roster {
            change: RosterChange::Reordered {
                order: vec!["Bravo".to_owned(), "Alpha".to_owned()]
            }
        }));
    }

    #[test]
    fn a_setting_says_which_surface_it_came_from() {
        // The two settings the menu carries are the two that get switched while
        // playing. Which door was used says whether the window had to be opened,
        // which is the measure of the whole principle of the project.
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
        // It used to say only that the authorization was gone, and a roster
        // emptying itself with no `CharacterOffline` anywhere read as a scan that
        // had stopped running.
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
        // Version, system and launch. Asking the user for any of the three is
        // asking them to tell a story, which is what this journal replaces.
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
        // The avis of ADR 0010 hang on this. The front and never the state: a
        // second scan with nobody back says nothing, since nobody just left.
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
        // The second of the four cases of ADR 0010, and the one that used to
        // leave the telephone silent with nothing to explain it.
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.apply_windows(&[window(1, "Alpha")]);

        let denied = state.apply_denied();

        assert_eq!(denied.relayed_gone, vec!["Alpha".to_owned()]);
        assert!(denied.none_relayed_left);
    }

    #[test]
    fn the_relay_is_ready_only_once_a_bot_and_somebody_are_there() {
        // The two questions the menu item asks, and neither is the keychain.
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
        // Kept, it would greet the next bot with « Message d'essai parti », which
        // is the false reassurance the panel exists to remove.
        let directory = TempDir::new().expect("a temporary directory");
        let mut state = multifus(&directory);
        state.set_paired(42);
        state.set_test(TestView::Sent);

        state.set_unpaired();

        assert_eq!(state.snapshot().relay.test, TestView::Idle);

        // The essai that was in flight when the bot was forgotten, landing late.
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

        // The cancelled start finishing must leave nothing behind on the claim
        // of the click that replaced it, its screen state included.
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
        // The largest plus one, so nothing has to be persisted to allocate one.
        // It is only ever unique among the quick replies that exist: the one taken by
        // the last row removed comes back, and nothing holds a stale one, its
        // combination having come off the system with it.
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
        // The system keys a shortcut by the keys alone, so whoever is laid down
        // first holds them, and a duplicate then names the action.
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
        // The queue carries the identifier alone, so a quick reply removed between
        // the key press and the answer has to be an absence and not a panic.
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

    /// The tokens the boundary hands out for the windows that are open.
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
        // A client still loading turns the write down. Burning it there would
        // leave that window small for the whole evening.
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
