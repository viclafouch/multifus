//! What multifus knows while it runs, and the one lock that guards it.
//!
//! [`Multifus`] holds the settings as they are right now, veille and connected
//! state included, which the file deliberately does not hold; where every
//! connected character's window is; whether the system is letting multifus work;
//! and the journal. Every command and the window scan go through the same mutex.
//!
//! One rule keeps that mutex safe: **never hold this lock while touching the
//! notification watcher**. The watcher's `stop` joins its own thread, and that
//! thread is the one running the sink, which takes this lock. Holding both in the
//! wrong order is the only deadlock this module can produce, and not holding them
//! at once is enough to make it impossible.

use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;

use tauri::AppHandle;
use tauri::Manager;

use crate::app::journal::Journal;
use crate::app::journal::JournalEvent;
use crate::app::journal::Outcome;
use crate::app::view::AuthorizationView;
use crate::app::view::AutoFocusView;
use crate::app::view::CharacterView;
use crate::app::view::ConfigProblem;
use crate::app::view::ConfigView;
use crate::app::view::ShortcutAction;
use crate::app::view::ShortcutView;
use crate::app::view::Snapshot;
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
            windows: HashMap::new(),
            granted: None,
            listening: false,
            problem,
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
                .map(|character| CharacterView {
                    nickname: character.nickname.clone(),
                    gender: character.gender,
                    asleep: character.asleep,
                    online: character.online,
                })
                .collect(),
            shortcuts: ShortcutAction::ALL
                .into_iter()
                .map(|action| ShortcutView {
                    action,
                    accelerator: self
                        .shortcut(action)
                        .map(|shortcut| shortcut.as_str().to_owned()),
                })
                .collect(),
            auto_focus: NotificationKind::ALL
                .into_iter()
                .map(|kind| AutoFocusView {
                    kind,
                    enabled: self.settings.auto_focus.is_enabled(kind),
                })
                .collect(),
            authorization: AuthorizationView {
                granted: self.is_granted(),
                listening: self.listening,
            },
            config: ConfigView {
                path: self.store.path().display().to_string(),
                problem: self.problem.clone(),
            },
            journal: self.journal.entries(),
        }
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

    /// Binds a combination to an action, or clears it.
    ///
    /// The text is stored as it comes and never interpreted here. Whether the
    /// system accepts it is the plugin's answer, at step 7, and it has to reach
    /// the screen then.
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

    /// Flips one of the seven switches. Global, never per character.
    pub fn set_auto_focus(&mut self, kind: NotificationKind, enabled: bool) {
        self.settings.auto_focus.set(kind, enabled);
        self.save();
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
}

/// What [`Multifus::decide`] concluded about a game notification.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Decision {
    /// Bring this window to the front.
    Focus(WindowId),
    /// Do nothing, and this is why.
    Ignored(Outcome),
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
