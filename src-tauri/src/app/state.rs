//! What multifus knows while it runs, and the one lock that guards it.
//!
//! [`Multifus`] holds the settings as they are right now, veille and connected
//! state included, which the file deliberately does not hold; where every
//! connected character's window is; whether the system is letting multifus work;
//! and the journal. Every command and the window scan go through the same mutex.
//!
//! One rule keeps that mutex safe: **never hold this lock while touching the
//! notification watcher or the global shortcut plugin**. The watcher's `stop`
//! joins its own thread, and that thread is the one running the sink, which
//! takes this lock. The plugin hops to the main thread and waits for it, and the
//! main thread is where every command takes this lock. Both are the same shape
//! of deadlock, and not holding the two at once is enough to make it impossible.

use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;

use tauri::AppHandle;
use tauri::Manager;

use crate::app::journal::Journal;
use crate::app::journal::JournalEvent;
use crate::app::journal::Outcome;
use crate::app::journal::ShortcutOutcome;
use crate::app::view::AuthorizationView;
use crate::app::view::AutoFocusView;
use crate::app::view::CharacterView;
use crate::app::view::ConfigProblem;
use crate::app::view::ConfigView;
use crate::app::view::ShortcutAction;
use crate::app::view::ShortcutStatus;
use crate::app::view::ShortcutView;
use crate::app::view::Snapshot;
use crate::app::view::UpdateView;
use crate::config::ConfigError;
use crate::config::ConfigStore;
use crate::config::Loaded;
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

/// Everything multifus knows while it runs.
#[derive(Debug)]
pub struct Multifus {
    store: ConfigStore,
    /// The version of the bundle, read once from the package information.
    ///
    /// It travels inside the snapshot rather than through an API of its own,
    /// because a constant the about screen prints is not worth a second channel
    /// and a second loading state on the interface side.
    version: String,
    /// The live configuration. Its roster carries the veille and the connected
    /// state, which never reach the file, see ADR 0004.
    settings: Settings,
    /// What the system answered for each of the four combinations. Filled in one
    /// piece by [`crate::app::shortcuts::apply`], so an action missing from it
    /// is one nobody has tried to lay down yet.
    shortcut_statuses: HashMap<ShortcutAction, ShortcutStatus>,
    /// Where each connected character's window is. Refilled by every scan, since
    /// a [`WindowId`] means nothing once its window is gone.
    windows: HashMap<String, WindowId>,
    /// The system lets multifus read window titles and hear the banners.
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
    /// Where multifus is with the version that is published, see
    /// [`crate::app::update`]. It starts as a question because the check starts
    /// with the process.
    update: UpdateView,
    journal: Journal,
}

impl Multifus {
    /// Starts from what the store just read.
    ///
    /// [`Loaded`] always carries a usable configuration and, when there is one,
    /// the reason the stored one was not used. That reason is kept here rather
    /// than dropped, so that the interface can say the file was unreadable
    /// instead of leaving the user with an empty roster and no explanation.
    #[must_use]
    pub fn new(store: ConfigStore, version: impl Into<String>, loaded: Loaded) -> Self {
        let Loaded {
            settings,
            failure,
            quarantined,
        } = loaded;

        let problem = failure.map(|failure| {
            let detail = failure.to_string();

            match failure {
                ConfigError::Malformed { .. } => ConfigProblem::Malformed {
                    detail,
                    quarantined: quarantined.map(|path| path.display().to_string()),
                },
                _ => ConfigProblem::Unreadable { detail },
            }
        });

        let mut journal = Journal::new();
        journal.push(JournalEvent::Started);

        Self {
            store,
            version: version.into(),
            settings,
            shortcut_statuses: HashMap::new(),
            windows: HashMap::new(),
            granted: None,
            listening: false,
            problem,
            update: UpdateView::Checking,
            journal,
        }
    }

    /// Everything the four screens draw, in one piece.
    #[must_use]
    pub fn snapshot(&self) -> Snapshot {
        Snapshot {
            version: self.version.clone(),
            characters: self
                .settings
                .roster
                .characters()
                .iter()
                .map(view_of)
                .collect(),
            start_at_login: self.settings.start_at_login,
            shortcuts: ShortcutAction::ALL
                .into_iter()
                .map(|action| ShortcutView {
                    action,
                    accelerator: self.accelerator(action),
                    status: self
                        .shortcut_statuses
                        .get(&action)
                        .cloned()
                        .unwrap_or(ShortcutStatus::Pending),
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
            authorization: AuthorizationView {
                granted: self.is_granted(),
                listening: self.listening,
            },
            config: ConfigView {
                path: self.store.path().display().to_string(),
                problem: self.problem.clone(),
            },
            update: self.update.clone(),
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

    pub fn log_unless_repeated(&mut self, event: JournalEvent) {
        self.journal.push_unless_repeated(event);
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
        if let Some(character) = self.settings.roster.get_mut(nickname) {
            character.gender = gender;
            self.save();
        }
    }

    /// Puts an awake character to sleep, or wakes an asleep one up. Does nothing
    /// for an offline character, which is not sleepable.
    ///
    /// Nothing is saved: the veille never reaches the file, see ADR 0004.
    pub fn toggle_asleep(&mut self, nickname: &str) {
        self.settings.roster.toggle_asleep(nickname);
    }

    /// One of the two grouped actions: pushes the same veille on every online
    /// character of a gender, exactly as if each line had been clicked.
    pub fn set_gender_asleep(&mut self, gender: Gender, asleep: bool) {
        self.settings.roster.set_asleep_for_gender(gender, asleep);
    }

    /// Rewrites the cycle order, which is what the drag and drop produces.
    pub fn reorder(&mut self, order: &[String]) {
        self.settings.roster.reorder(order);
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
            self.save();
        }
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
    pub fn accelerator(&self, action: ShortcutAction) -> Option<String> {
        self.shortcut(action)
            .map(|shortcut| shortcut.as_str().to_owned())
    }

    /// Takes in what the system answered for the four combinations.
    pub fn set_shortcut_statuses(&mut self, statuses: HashMap<ShortcutAction, ShortcutStatus>) {
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

    /// Whether the user asked multifus to start with the session.
    ///
    /// The file is what says so, never the system: the registration on disk can
    /// be taken away from under multifus, and only this can be read as an
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

    /// Flips one of the seven switches. Global, never per character.
    pub fn set_auto_focus(&mut self, kind: NotificationKind, enabled: bool) {
        self.settings.auto_focus.set(kind, enabled);
        self.save();
    }

    /// Suspends the AutoFocus as a whole, or brings it back.
    ///
    /// The seven are left exactly where they were: this is the switch the system
    /// tray offers, and it has to be undoable without the user having to
    /// remember which kinds they had turned off.
    pub fn set_auto_focus_enabled(&mut self, enabled: bool) {
        self.settings.auto_focus.enabled = enabled;
        self.save();
    }

    /// Whether the AutoFocus is running at all.
    #[must_use]
    pub fn is_auto_focus_enabled(&self) -> bool {
        self.settings.auto_focus.enabled
    }

    /// Suspends the AutoFocus if it was running, brings it back if it was not.
    ///
    /// What the system tray asks for, since a tick carries no state of its own:
    /// reading and writing in one hold, rather than two, leaves no moment where
    /// a command could slip between the question and the answer.
    pub fn toggle_auto_focus(&mut self) {
        self.set_auto_focus_enabled(!self.settings.auto_focus.enabled);
    }

    /// Everything back to what someone who has never opened multifus gets,
    /// roster included.
    ///
    /// The connected characters come back on the next scan, without the genders
    /// that were assigned to them. The interface says so before asking.
    pub fn reset(&mut self) {
        self.settings = Settings::default();
        self.windows.clear();
        self.log(JournalEvent::Reset);
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
    pub fn apply_windows(&mut self, windows: &[GameWindow]) -> bool {
        let mut changed = self.set_granted(true);

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

                (character.online != online).then(|| (character.nickname.clone(), online))
            })
            .collect::<Vec<_>>();

        for (nickname, online) in transitions {
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
                self.log(JournalEvent::CharacterOffline { nickname });
            }

            changed = true;
        }

        changed
    }

    /// Where a character's window is, if multifus can still see one.
    ///
    /// What the system tray aims at, the same way [`Multifus::aim_at`] does for the
    /// cycle: reading happens under this lock, focusing does not.
    #[must_use]
    pub fn window_of(&self, nickname: &str) -> Option<WindowId> {
        self.windows.get(nickname).copied()
    }

    /// What the scan reports when the system will not let multifus look.
    ///
    /// Everyone goes offline: multifus has no idea who is connected, and saying
    /// nobody is closer to the truth than leaving stale lamps lit.
    pub fn apply_denied(&mut self) -> bool {
        let mut changed = self.set_granted(false);

        self.windows.clear();

        let still_online = self
            .settings
            .roster
            .characters()
            .iter()
            .filter(|character| character.online)
            .map(|character| character.nickname.clone())
            .collect::<Vec<_>>();

        for nickname in still_online {
            self.settings.roster.set_online(&nickname, false);
            changed = true;
        }

        changed
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

    /// Whether the system is letting multifus work. An authorization nobody has
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
            Some(window) => Decision::Focus(*window),
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
    }
}

/// What [`Multifus::decide`] concluded about a game notification.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Decision {
    /// Bring this window to the front.
    Focus(WindowId),
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
/// panic can half-break, and multifus refusing to work for the rest of the
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

    use super::*;

    /// A multifus with nothing on disk, writing into a directory that dies with
    /// the test rather than into a path written in the source.
    fn multifus(directory: &TempDir) -> Multifus {
        Multifus::new(
            ConfigStore::in_directory(directory.path()),
            "0.0.0",
            Loaded {
                settings: Settings::default(),
                failure: None,
                quarantined: None,
            },
        )
    }

    /// A window with the title a real client carries, which is the only door
    /// into [`GameWindow`].
    fn window(pid: u64, nickname: &str) -> GameWindow {
        let title = format!("{nickname} - Dofus Retro v1.48.21");

        GameWindow::from_title(WindowId::from_raw(pid), &title).expect("a game window")
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
