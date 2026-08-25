//! Reading and writing the configuration file.
//!
//! The store knows one path and does two things with it, [`ConfigStore::load`]
//! and [`ConfigStore::save`]. It is built either from a directory, which is what
//! the tests do, or from the application, which is what Multifus does: the path
//! comes from Tauri's own resolver and never from a string assembled here, so no
//! machine of anyone's ends up in the source.

use std::fs;
use std::io;
use std::io::Write;
use std::path::Path;
use std::path::PathBuf;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

use tauri::Manager;
use tauri::Runtime;

use crate::config::error::ConfigError;
use crate::config::error::Result;
use crate::config::settings::Settings;

/// The name of the file inside the system's configuration directory.
pub const FILE_NAME: &str = "config.json";

/// The file a half-written configuration goes to. It is renamed over the real
/// one once it is complete, see [`ConfigStore::save`].
const TEMPORARY_SUFFIX: &str = ".writing";

/// How many names a quarantine tries before giving up, in the improbable case
/// where several configurations turn out to be unreadable within one second.
const QUARANTINE_ATTEMPTS: u32 = 100;

/// The configuration file, wherever it lives.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigStore {
    path: PathBuf,
}

impl ConfigStore {
    /// The store of a running Multifus: `config.json` in the configuration
    /// directory the system gives this application.
    ///
    /// The directory is `app_config_dir`, which Tauri builds from the bundle
    /// identifier, and it does not necessarily exist yet. [`ConfigStore::save`]
    /// creates it, [`ConfigStore::load`] does not need it.
    pub fn for_app<R: Runtime, M: Manager<R>>(app: &M) -> Result<Self> {
        let directory = app
            .path()
            .app_config_dir()
            .map_err(|error| ConfigError::NoDirectory {
                detail: error.to_string(),
            })?;

        Ok(Self::in_directory(directory))
    }

    /// The store for `config.json` inside this directory.
    #[must_use]
    pub fn in_directory(directory: impl AsRef<Path>) -> Self {
        Self::at(directory.as_ref().join(FILE_NAME))
    }

    /// The store for one exact file.
    #[must_use]
    pub fn at(path: impl Into<PathBuf>) -> Self {
        Self { path: path.into() }
    }

    /// Where the configuration is read from and written to.
    #[must_use]
    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Reads the configuration, and always comes back with a usable one.
    ///
    /// There is no `Result` here because Multifus starts either way. What can be
    /// read is read, what cannot be read is replaced by the defaults, and
    /// [`Loaded::failure`] carries the reason so the interface can say it out
    /// loud one day rather than have it swallowed.
    ///
    /// Three outcomes:
    ///
    /// - no file at all, the first launch of someone who has never opened
    ///   Multifus: the defaults, and no failure, since nothing failed;
    /// - a file that is not a configuration, truncated by an old crash or
    ///   hand-edited into invalid JSON: the defaults, the failure, and the file
    ///   is renamed out of the way rather than overwritten by the first save,
    ///   see [`Loaded::quarantined`]. Rewriting it in silence would erase a
    ///   roster the user typed by hand;
    /// - a file that cannot be read at all, no permission for instance: the
    ///   defaults and the failure, and nothing is moved. The bytes are still
    ///   there and may well be perfectly good, so they are left alone.
    #[must_use]
    pub fn load(&self) -> Loaded {
        let bytes = match fs::read(&self.path) {
            Ok(bytes) => bytes,
            Err(error) if error.kind() == io::ErrorKind::NotFound => return Loaded::first_launch(),
            Err(error) => {
                return Loaded::failed(ConfigError::io(
                    "reading the configuration",
                    &self.path,
                    &error,
                ))
            }
        };

        match serde_json::from_slice::<Settings>(&bytes) {
            Ok(settings) => Loaded::read(settings),
            Err(error) => {
                let failure = ConfigError::malformed(&self.path, error.to_string());
                let (quarantined, quarantine_failure) = match self.quarantine() {
                    Ok(target) => (Some(target), None),
                    Err(error) => (None, Some(error)),
                };

                Loaded {
                    settings: Settings::default(),
                    failure: Some(failure),
                    quarantined,
                    quarantine_failure,
                }
            }
        }
    }

    /// Writes the configuration, without ever leaving less than a whole one
    /// behind.
    ///
    /// The bytes go to a neighbouring file, get flushed to the disk, and only
    /// then does a rename put them in place. A rename within a directory is the
    /// one step the two systems perform atomically, so an interruption leaves
    /// either the previous configuration or the new one, never the empty file
    /// that a truncate-then-write would leave. The leftover of an interrupted
    /// save is a stray temporary file, which the next save overwrites.
    ///
    /// Multifus is the only writer of this file, so no two saves race for the
    /// temporary name.
    pub fn save(&self, settings: &Settings) -> Result<()> {
        if let Some(directory) = self.path.parent() {
            fs::create_dir_all(directory).map_err(|error| {
                ConfigError::io("creating the configuration directory", directory, &error)
            })?;
        }

        let mut json =
            serde_json::to_string_pretty(settings).map_err(|error| ConfigError::Encoding {
                detail: error.to_string(),
            })?;
        // The file is meant to be readable, and openable in an editor that
        // expects a last line like any other.
        json.push('\n');

        let temporary = self.temporary_path();

        if let Err(error) = write_whole_file(&temporary, json.as_bytes()) {
            let _ = fs::remove_file(&temporary);

            return Err(error);
        }

        if let Err(error) = fs::rename(&temporary, &self.path) {
            let _ = fs::remove_file(&temporary);

            return Err(ConfigError::io(
                "replacing the configuration",
                &self.path,
                &error,
            ));
        }

        Ok(())
    }

    /// Moves an unreadable configuration aside and returns where it went.
    ///
    /// Renaming rather than copying, so that the file is gone from the path the
    /// next save writes to, and so that nothing is read twice.
    ///
    /// **A failure here is reported on its own**, in [`Loaded::quarantine_failure`],
    /// and it used to be swallowed by an `.ok()`. Two different facts hide behind
    /// one `None`: nothing needed moving, and the move was refused. The second one
    /// leaves the unreadable file exactly where the next save writes, which is the
    /// one thing this whole mechanism exists to prevent, and it costs a roster
    /// somebody typed by hand.
    fn quarantine(&self) -> Result<PathBuf> {
        let target = self.quarantine_path().ok_or_else(|| ConfigError::Encoding {
            detail: format!(
                "no free name for the configuration to be set aside to, after {QUARANTINE_ATTEMPTS} attempts"
            ),
        })?;

        fs::rename(&self.path, &target)
            .map_err(|error| ConfigError::io("setting the configuration aside", &target, &error))?;

        Ok(target)
    }

    /// A free name next to the configuration, `config.invalid-1754300000.json`
    /// and so on. Never one that exists, so a quarantine never erases an older
    /// one.
    ///
    /// `None` when every candidate is taken, which the caller turns into a
    /// failure. It used to fall back to the first candidate instead, which exists
    /// by definition at that point: the rename then overwrote an older
    /// quarantine, doing exactly what this method's own promise forbids.
    fn quarantine_path(&self) -> Option<PathBuf> {
        let stem = self
            .path
            .file_stem()
            .unwrap_or_else(|| "config".as_ref())
            .to_string_lossy()
            .into_owned();

        let seconds = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|elapsed| elapsed.as_secs())
            .unwrap_or_default();

        let first = self
            .path
            .with_file_name(format!("{stem}.invalid-{seconds}.json"));

        if !first.exists() {
            return Some(first);
        }

        (1..QUARANTINE_ATTEMPTS)
            .map(|attempt| {
                self.path
                    .with_file_name(format!("{stem}.invalid-{seconds}-{attempt}.json"))
            })
            .find(|candidate| !candidate.exists())
    }

    /// The neighbouring file a save writes to before renaming it into place. In
    /// the same directory, since a rename is only atomic within one filesystem.
    fn temporary_path(&self) -> PathBuf {
        let mut name = self.path.as_os_str().to_owned();
        name.push(TEMPORARY_SUFFIX);

        PathBuf::from(name)
    }
}

/// Writes the whole content and waits for the disk to have it, so that the
/// rename that follows swaps in bytes that are really there.
fn write_whole_file(path: &Path, bytes: &[u8]) -> Result<()> {
    let mut file =
        fs::File::create(path).map_err(|error| ConfigError::io("opening", path, &error))?;

    file.write_all(bytes)
        .map_err(|error| ConfigError::io("writing", path, &error))?;

    file.sync_all()
        .map_err(|error| ConfigError::io("flushing", path, &error))
}

/// The outcome of a load: a configuration to run on, and what it cost to get it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Loaded {
    /// Always usable. The defaults when there was nothing to read, or nothing
    /// readable.
    pub settings: Settings,
    /// Why the stored configuration was not used. `None` on a first launch too:
    /// having no file yet is not a failure.
    pub failure: Option<ConfigError>,
    /// Where an unreadable file was set aside, so the interface can point at it
    /// instead of leaving the user to wonder what became of their roster.
    pub quarantined: Option<PathBuf>,
    /// Why it could not be set aside, when that is what happened.
    ///
    /// A field of its own rather than an absent `quarantined`, because the two
    /// mean opposite things to the user: nothing was moved because nothing had to
    /// be, or the unreadable file is still sitting where the next save will write
    /// over it. Only the second one is worth interrupting somebody for.
    pub quarantine_failure: Option<ConfigError>,
}

impl Loaded {
    /// Nothing on disk yet.
    fn first_launch() -> Self {
        Self {
            settings: Settings::default(),
            failure: None,
            quarantined: None,
            quarantine_failure: None,
        }
    }

    /// A configuration read as it was written.
    fn read(settings: Settings) -> Self {
        Self {
            settings,
            failure: None,
            quarantined: None,
            quarantine_failure: None,
        }
    }

    /// The defaults, and the reason the file was not used.
    fn failed(failure: ConfigError) -> Self {
        Self {
            settings: Settings::default(),
            failure: Some(failure),
            quarantined: None,
            quarantine_failure: None,
        }
    }

    /// Whether the configuration on screen is the one that was stored.
    #[must_use]
    pub fn is_intact(&self) -> bool {
        self.failure.is_none()
    }
}

#[cfg(test)]
mod tests {
    use tempfile::TempDir;

    use super::*;
    use crate::config::settings::AutoFocus;
    use crate::config::settings::QuickReply;
    use crate::config::settings::QuickReplyId;
    use crate::config::settings::Relay;
    use crate::config::settings::Shortcut;
    use crate::config::settings::Shortcuts;
    use crate::domain::Character;
    use crate::domain::Gender;
    use crate::domain::NotificationKind;
    use crate::domain::Roster;

    /// A store on a directory that disappears with the test.
    fn store() -> (TempDir, ConfigStore) {
        let directory = TempDir::new().expect("a temporary directory");
        let store = ConfigStore::in_directory(directory.path());

        (directory, store)
    }

    /// A configuration where every field has been moved away from its default,
    /// so that a round trip that drops one of them fails the test.
    fn a_settled_configuration() -> Settings {
        let mut auto_focus = AutoFocus::all(true);
        auto_focus.set(NotificationKind::PrivateMessage, false);
        auto_focus.set(NotificationKind::Craft, false);
        auto_focus.wakes_minimized = false;

        Settings {
            roster: Roster::from_characters(vec![
                Character::new("Alpha").with_gender(Gender::Male),
                Character::new("Bravo")
                    .with_gender(Gender::Female)
                    .not_relayed(),
                Character::new("Charlie"),
            ]),
            shortcuts: Shortcuts {
                next: Shortcut::new("Alt+Right"),
                previous: Shortcut::new("Alt+Left"),
                toggle_asleep: None,
                swap: Shortcut::new("Alt+Space"),
            },
            maximize_on_launch: true,
            short_titles: true,
            quick_replies: vec![QuickReply {
                id: QuickReplyId::default().next(),
                text: "prix libre".to_owned(),
                shortcut: Shortcut::new("Alt+P"),
            }],
            auto_focus,
            relay: Relay {
                chat_id: Some(-1_001_234_567_890),
                send_body: true,
            },
            start_at_login: true,
        }
    }

    /// The same configuration as it comes back from a file: everyone awake and,
    /// until the first window scan, nobody connected. Anything else in it that
    /// changes on the way through is a bug this helper does not hide.
    fn as_stored(settings: &Settings) -> Settings {
        let characters = settings
            .roster
            .characters()
            .iter()
            .map(|character| Character {
                asleep: false,
                online: false,
                ..character.clone()
            })
            .collect();

        Settings {
            roster: Roster::from_characters(characters),
            ..settings.clone()
        }
    }

    #[test]
    fn what_is_written_is_what_comes_back() {
        let (_directory, store) = store();
        let settings = a_settled_configuration();

        store.save(&settings).expect("the configuration is written");

        let loaded = store.load();

        assert_eq!(loaded.settings, as_stored(&settings));
        assert_eq!(loaded.failure, None);
        assert_eq!(loaded.quarantined, None);
        assert!(loaded.is_intact());
    }

    #[test]
    fn the_cycle_order_is_the_order_of_the_file() {
        let (_directory, store) = store();
        let settings = Settings {
            roster: Roster::from_characters(vec![
                Character::new("Charlie"),
                Character::new("Alpha"),
                Character::new("Bravo"),
            ]),
            ..Settings::default()
        };

        store.save(&settings).expect("the configuration is written");

        let read = store.load().settings.roster;
        let order = read
            .characters()
            .iter()
            .map(|character| character.nickname.as_str())
            .collect::<Vec<_>>();

        assert_eq!(order, vec!["Charlie", "Alpha", "Bravo"]);
    }

    #[test]
    fn a_first_launch_has_no_file_and_starts_on_the_defaults() {
        let (_directory, store) = store();

        let loaded = store.load();

        assert_eq!(loaded.settings, Settings::default());
        assert_eq!(loaded.failure, None);
        assert_eq!(loaded.quarantined, None);
        assert!(
            !store.path().exists(),
            "loading must not create anything on its own"
        );
    }

    #[test]
    fn the_veille_never_reaches_the_file() {
        // ADR 0004. The sexes are kept, the veille is not, so a character put
        // aside weeks ago cannot silently vanish from the cycle today.
        let (_directory, store) = store();
        let settings = Settings {
            roster: Roster::from_characters(vec![
                Character::new("Alpha").with_gender(Gender::Male).asleep(),
                Character::new("Bravo").with_gender(Gender::Female).asleep(),
                Character::new("Charlie").asleep(),
            ]),
            ..Settings::default()
        };

        store.save(&settings).expect("the configuration is written");

        let written = fs::read_to_string(store.path()).expect("the file is readable");
        assert!(!written.contains(r#""asleep""#), "{written}");
        assert!(!written.contains(r#""online""#), "{written}");

        let roster = store.load().settings.roster;

        assert_eq!(roster.len(), 3);

        for character in roster.characters() {
            assert!(!character.asleep, "{} came back asleep", character.nickname);
            // Nobody is connected until the first window scan says so.
            assert!(!character.online, "{} came back online", character.nickname);
        }

        assert_eq!(roster.get("Alpha").unwrap().gender, Some(Gender::Male));
        assert_eq!(roster.get("Bravo").unwrap().gender, Some(Gender::Female));
        assert_eq!(roster.get("Charlie").unwrap().gender, None);
    }

    #[test]
    fn a_file_written_before_the_relay_existed_comes_back_with_everybody_relayed() {
        // Written as bytes on purpose: built from `Settings` it would carry
        // today's fields and prove nothing about yesterday's file.
        let (_directory, store) = store();
        let written = r#"{
          "roster": {
            "characters": [
              { "nickname": "Alpha", "gender": "male" },
              { "nickname": "Bravo", "gender": null }
            ]
          },
          "shortcuts": { "next": "Alt+Right", "previous": null,
                         "toggle_asleep": null, "swap": null },
          "auto_focus": { "enabled": true, "combat": false },
          "start_at_login": true
        }"#;
        fs::write(store.path(), written).expect("the earlier configuration is written");

        let loaded = store.load();

        assert_eq!(loaded.failure, None, "an earlier file is not a corrupt one");
        assert_eq!(loaded.quarantined, None);

        let roster = loaded.settings.roster;

        assert_eq!(roster.len(), 2);
        assert!(roster.get("Alpha").unwrap().relayed);
        assert!(roster.get("Bravo").unwrap().relayed);
        assert!(roster.has_relayed());

        assert_eq!(roster.get("Alpha").unwrap().gender, Some(Gender::Male));
        assert!(loaded.settings.start_at_login);
        assert!(!loaded.settings.auto_focus.combat);
        assert_eq!(loaded.settings.relay, Relay::default());
    }

    #[test]
    fn a_corrupt_file_is_set_aside_rather_than_overwritten() {
        let (_directory, store) = store();
        let garbage = "{ this is not json";
        fs::write(store.path(), garbage).expect("the corrupt file is written");

        let loaded = store.load();

        assert_eq!(loaded.settings, Settings::default());
        assert!(!loaded.is_intact());
        assert!(
            matches!(loaded.failure, Some(ConfigError::Malformed { .. })),
            "{:?}",
            loaded.failure
        );

        let quarantined = loaded.quarantined.expect("the file is set aside");
        assert_eq!(
            fs::read_to_string(&quarantined).expect("the set aside file is readable"),
            garbage,
            "the user's file must survive untouched"
        );
        assert!(
            !store.path().exists(),
            "the corrupt file is moved, not left"
        );

        // And Multifus keeps working: the next save writes a clean file.
        store
            .save(&loaded.settings)
            .expect("the configuration is written after a recovery");
        assert_eq!(store.load().settings, Settings::default());
    }

    #[test]
    fn a_truncated_file_is_treated_the_same_way() {
        // What an interrupted write used to leave behind before the save became
        // a rename, and what a full disk still leaves behind elsewhere.
        let (_directory, store) = store();
        store
            .save(&a_settled_configuration())
            .expect("the configuration is written");

        let whole = fs::read_to_string(store.path()).expect("the file is readable");
        fs::write(store.path(), &whole[..whole.len() / 2]).expect("the file is truncated");

        let loaded = store.load();

        assert!(matches!(
            loaded.failure,
            Some(ConfigError::Malformed { .. })
        ));
        assert!(loaded.quarantined.is_some());
        assert_eq!(loaded.settings, Settings::default());
    }

    #[test]
    fn a_file_from_another_program_is_not_mistaken_for_a_configuration() {
        let (_directory, store) = store();
        // Valid JSON, no field in common. Nothing here says Multifus.
        fs::write(store.path(), "[1, 2, 3]").expect("the foreign file is written");

        let loaded = store.load();

        assert!(matches!(
            loaded.failure,
            Some(ConfigError::Malformed { .. })
        ));
        assert!(loaded.quarantined.is_some());
    }

    /// Unix only: `set_readonly` on a directory is what stops a rename inside it
    /// there, and does nothing of the sort on Windows. The behaviour under test
    /// is the store's and is the same on both, only the way to provoke it is not.
    #[cfg(unix)]
    #[test]
    fn a_file_that_cannot_be_set_aside_says_so_instead_of_looking_untouched() {
        use std::os::unix::fs::PermissionsExt;

        // The failure that used to hide behind an `.ok()`. What a read-only
        // volume, a synced folder or a tightened permission looks like: the file
        // is readable, unreadable as a configuration, and cannot be moved out of
        // the way of the next save.
        let (directory, store) = store();
        let garbage = "{ this is not json";
        fs::write(store.path(), garbage).expect("the corrupt file is written");

        // The modes are spelled out rather than set through `set_readonly`, which
        // hands out world write access on the way back.
        let readable_only = fs::Permissions::from_mode(0o500);
        let writable_again = fs::Permissions::from_mode(0o700);

        fs::set_permissions(directory.path(), readable_only).expect("the directory is locked");

        let loaded = store.load();

        // Put it back before asserting, so that a failure here still leaves a
        // directory the temporary one can delete.
        fs::set_permissions(directory.path(), writable_again).expect("the directory is unlocked");

        assert!(matches!(
            loaded.failure,
            Some(ConfigError::Malformed { .. })
        ));
        assert_eq!(loaded.quarantined, None);
        assert!(
            loaded.quarantine_failure.is_some(),
            "a refused rename must not read as a file nothing had to be done to"
        );
        assert_eq!(
            fs::read_to_string(store.path()).expect("the file is still there"),
            garbage,
            "the file the save is about to overwrite has to still be reported"
        );
    }

    #[test]
    fn two_corrupt_files_in_a_row_both_survive() {
        let (_directory, store) = store();

        fs::write(store.path(), "first").expect("the first corrupt file is written");
        let first = store.load().quarantined.expect("the first is set aside");

        fs::write(store.path(), "second").expect("the second corrupt file is written");
        let second = store.load().quarantined.expect("the second is set aside");

        assert_ne!(first, second);
        assert_eq!(fs::read_to_string(&first).unwrap(), "first");
        assert_eq!(fs::read_to_string(&second).unwrap(), "second");
    }

    #[test]
    fn a_save_leaves_no_temporary_file_behind() {
        let (directory, store) = store();

        store
            .save(&a_settled_configuration())
            .expect("the configuration is written");

        let leftovers = fs::read_dir(directory.path())
            .expect("the directory is readable")
            .filter_map(std::result::Result::ok)
            .map(|entry| entry.file_name().to_string_lossy().into_owned())
            .filter(|name| name != FILE_NAME)
            .collect::<Vec<_>>();

        assert!(leftovers.is_empty(), "{leftovers:?}");
    }

    #[test]
    fn the_leftover_of_an_interrupted_save_costs_nothing() {
        let (_directory, store) = store();
        let settings = a_settled_configuration();
        store.save(&settings).expect("the configuration is written");

        // What a save killed halfway through leaves: a partial temporary file,
        // and the previous configuration still whole at its own path.
        let temporary = store.temporary_path();
        fs::write(&temporary, "{ half a configu").expect("the leftover is written");

        assert_eq!(store.load().settings, as_stored(&settings));

        store.save(&settings).expect("a later save goes through");

        assert_eq!(store.load().settings, as_stored(&settings));
        assert!(!temporary.exists(), "the leftover is replaced, not kept");
    }

    #[test]
    fn saving_creates_the_configuration_directory_when_it_is_missing() {
        // `app_config_dir` names a directory, it does not create it, and on a
        // first launch it usually does not exist.
        let (directory, _) = store();
        let store = ConfigStore::in_directory(directory.path().join("multifus").join("nested"));

        store
            .save(&Settings::default())
            .expect("the directory is created on the way");

        assert!(store.path().exists());
    }

    #[test]
    fn a_directory_where_the_file_should_be_is_reported_not_panicked_on() {
        let (_directory, store) = store();
        fs::create_dir(store.path()).expect("a directory takes the file's place");

        let loaded = store.load();
        assert!(loaded.failure.is_some());
        assert_eq!(loaded.settings, Settings::default());
        assert_eq!(loaded.quarantined, None, "nothing readable was moved");

        assert!(store.save(&Settings::default()).is_err());
    }
}
