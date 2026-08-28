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

pub const FILE_NAME: &str = "config.json";

const TEMPORARY_SUFFIX: &str = ".writing";

const QUARANTINE_ATTEMPTS: u32 = 100;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigStore {
    path: PathBuf,
}

impl ConfigStore {
    pub fn for_app<R: Runtime, M: Manager<R>>(app: &M) -> Result<Self> {
        let directory = app
            .path()
            .app_config_dir()
            .map_err(|error| ConfigError::NoDirectory {
                detail: error.to_string(),
            })?;

        Ok(Self::in_directory(directory))
    }

    #[must_use]
    pub fn in_directory(directory: impl AsRef<Path>) -> Self {
        Self::at(directory.as_ref().join(FILE_NAME))
    }

    #[must_use]
    pub fn at(path: impl Into<PathBuf>) -> Self {
        Self { path: path.into() }
    }

    #[must_use]
    pub fn path(&self) -> &Path {
        &self.path
    }

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

    fn temporary_path(&self) -> PathBuf {
        let mut name = self.path.as_os_str().to_owned();
        name.push(TEMPORARY_SUFFIX);

        PathBuf::from(name)
    }
}

fn write_whole_file(path: &Path, bytes: &[u8]) -> Result<()> {
    let mut file =
        fs::File::create(path).map_err(|error| ConfigError::io("opening", path, &error))?;

    file.write_all(bytes)
        .map_err(|error| ConfigError::io("writing", path, &error))?;

    file.sync_all()
        .map_err(|error| ConfigError::io("flushing", path, &error))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Loaded {
    pub settings: Settings,
    pub failure: Option<ConfigError>,
    pub quarantined: Option<PathBuf>,
    pub quarantine_failure: Option<ConfigError>,
}

impl Loaded {
    fn first_launch() -> Self {
        Self {
            settings: Settings::default(),
            failure: None,
            quarantined: None,
            quarantine_failure: None,
        }
    }

    fn read(settings: Settings) -> Self {
        Self {
            settings,
            failure: None,
            quarantined: None,
            quarantine_failure: None,
        }
    }

    fn failed(failure: ConfigError) -> Self {
        Self {
            settings: Settings::default(),
            failure: Some(failure),
            quarantined: None,
            quarantine_failure: None,
        }
    }

    #[must_use]
    pub fn is_intact(&self) -> bool {
        self.failure.is_none()
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use tempfile::TempDir;

    use super::*;
    use crate::config::settings::AutoFocus;
    use crate::config::settings::Banner;
    use crate::config::settings::BannerCorner;
    use crate::config::settings::QuickReply;
    use crate::config::settings::QuickReplyId;
    use crate::config::settings::Relay;
    use crate::config::settings::Shortcuts;
    use crate::config::settings::Traces;
    use crate::domain::Character;
    use crate::domain::Class;
    use crate::domain::Gender;
    use crate::domain::NotificationKind;
    use crate::domain::Roster;
    use crate::domain::Shortcut;

    fn store() -> (TempDir, ConfigStore) {
        let directory = TempDir::new().expect("a temporary directory");
        let store = ConfigStore::in_directory(directory.path());

        (directory, store)
    }

    fn a_settled_configuration() -> Settings {
        let mut auto_focus = AutoFocus::all(true);
        auto_focus.set(NotificationKind::PrivateMessage, false);
        auto_focus.set(NotificationKind::Craft, false);
        auto_focus.wakes_minimized = false;

        Settings {
            roster: Roster::from_characters(vec![
                Character::new("Alpha")
                    .with_gender(Gender::Male)
                    .with_class(Class::Iop),
                Character::new("Bravo")
                    .with_gender(Gender::Female)
                    .not_relayed()
                    .main(),
                Character::new("Charlie"),
            ]),
            shortcuts: Shortcuts {
                next: Shortcut::new("Alt+Right"),
                previous: Shortcut::new("Alt+Left"),
                main: Shortcut::new("Alt+Home"),
                toggle_excluded: None,
                walk: Shortcut::new("Alt+KeyD"),
            },
            maximize_on_launch: true,
            short_titles: true,
            paint_portraits: false,
            ungroup_taskbar: true,
            client_title_suffix: Some(" - Dofus Retro v1.48.21".to_owned()),
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
            banner: Banner {
                corner: BannerCorner::TopLeft,
                screen: Some("DISPLAY2".to_owned()),
            },
            start_at_login: true,
            traces: Traces {
                portraits: HashSet::from(["Alpha".to_owned()]),
                ungrouped: HashSet::new(),
                short_titles: true,
            },
        }
    }

    fn as_stored(settings: &Settings) -> Settings {
        let characters = settings
            .roster
            .characters()
            .iter()
            .map(|character| Character {
                excluded: false,
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
        let (_directory, store) = store();
        let settings = Settings {
            roster: Roster::from_characters(vec![
                Character::new("Alpha").with_gender(Gender::Male).excluded(),
                Character::new("Bravo")
                    .with_gender(Gender::Female)
                    .excluded(),
                Character::new("Charlie").excluded(),
            ]),
            ..Settings::default()
        };

        store.save(&settings).expect("the configuration is written");

        let written = fs::read_to_string(store.path()).expect("the file is readable");
        assert!(!written.contains(r#""excluded""#), "{written}");
        assert!(!written.contains(r#""online""#), "{written}");

        let roster = store.load().settings.roster;

        assert_eq!(roster.len(), 3);

        for character in roster.characters() {
            assert!(
                !character.excluded,
                "{} came back excluded",
                character.nickname
            );
            assert!(!character.online, "{} came back online", character.nickname);
        }

        assert_eq!(roster.get("Alpha").unwrap().gender, Some(Gender::Male));
        assert_eq!(roster.get("Bravo").unwrap().gender, Some(Gender::Female));
        assert_eq!(roster.get("Charlie").unwrap().gender, None);
    }

    #[test]
    fn a_file_written_before_the_relay_existed_comes_back_with_everybody_relayed() {
        let (_directory, store) = store();
        let written = r#"{
          "roster": {
            "characters": [
              { "nickname": "Alpha", "gender": "male" },
              { "nickname": "Bravo", "gender": null }
            ]
          },
          "shortcuts": { "next": "Alt+Right", "previous": null,
                         "toggle_excluded": null },
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

        store
            .save(&loaded.settings)
            .expect("the configuration is written after a recovery");
        assert_eq!(store.load().settings, Settings::default());
    }

    #[test]
    fn a_truncated_file_is_treated_the_same_way() {
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
        fs::write(store.path(), "[1, 2, 3]").expect("the foreign file is written");

        let loaded = store.load();

        assert!(matches!(
            loaded.failure,
            Some(ConfigError::Malformed { .. })
        ));
        assert!(loaded.quarantined.is_some());
    }

    #[cfg(unix)]
    #[test]
    fn a_file_that_cannot_be_set_aside_says_so_instead_of_looking_untouched() {
        use std::os::unix::fs::PermissionsExt;

        let (directory, store) = store();
        let garbage = "{ this is not json";
        fs::write(store.path(), garbage).expect("the corrupt file is written");

        let readable_only = fs::Permissions::from_mode(0o500);
        let writable_again = fs::Permissions::from_mode(0o700);

        fs::set_permissions(directory.path(), readable_only).expect("the directory is locked");

        let loaded = store.load();

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

        let temporary = store.temporary_path();
        fs::write(&temporary, "{ half a configu").expect("the leftover is written");

        assert_eq!(store.load().settings, as_stored(&settings));

        store.save(&settings).expect("a later save goes through");

        assert_eq!(store.load().settings, as_stored(&settings));
        assert!(!temporary.exists(), "the leftover is replaced, not kept");
    }

    #[test]
    fn saving_creates_the_configuration_directory_when_it_is_missing() {
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
