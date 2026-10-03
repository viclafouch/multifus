use std::fs;
use std::io;
use std::path::Path;
use std::path::PathBuf;

use serde_json::Value;
use tauri::Manager;
use tauri::Runtime;

use crate::config::error::ConfigError;
use crate::config::error::Result;
use crate::config::file;

pub const NOTE_FILE_NAME: &str = "note.json";

const DOCUMENT_TYPE: &str = "doc";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NoteStore {
    path: PathBuf,
}

#[derive(Debug, Clone, PartialEq)]
pub enum NoteLoaded {
    Blank,
    Read(Value),
    SetAside { detail: String, path: PathBuf },
    Stuck { detail: String },
}

impl NoteLoaded {
    #[must_use]
    pub fn matches_writable(&self) -> bool {
        !matches!(self, Self::Stuck { .. })
    }
}

impl NoteStore {
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
        Self {
            path: directory.as_ref().join(NOTE_FILE_NAME),
        }
    }

    #[must_use]
    pub fn path(&self) -> &Path {
        &self.path
    }

    #[must_use]
    pub fn load(&self) -> NoteLoaded {
        let bytes = match fs::read(&self.path) {
            Ok(bytes) => bytes,
            Err(error) if error.kind() == io::ErrorKind::NotFound => return NoteLoaded::Blank,
            Err(error) => {
                return NoteLoaded::Stuck {
                    detail: ConfigError::io("reading the note", &self.path, &error).to_string(),
                };
            }
        };

        let detail = match serde_json::from_slice::<Value>(&bytes) {
            Ok(note) if matches_a_note(&note) => return NoteLoaded::Read(note),
            Ok(_) => format!("{} holds no note", self.path.display()),
            Err(error) => format!("{} is not a note: {error}", self.path.display()),
        };

        match file::set_aside(&self.path) {
            Ok(path) => NoteLoaded::SetAside { detail, path },
            Err(error) => NoteLoaded::Stuck {
                detail: format!("{detail}, and {error}"),
            },
        }
    }

    pub fn save(&self, note: &Value) -> Result<()> {
        let mut json =
            serde_json::to_string_pretty(note).map_err(|error| ConfigError::Encoding {
                detail: error.to_string(),
            })?;
        json.push('\n');

        file::write_whole(&self.path, json.as_bytes())
    }
}

#[must_use]
pub fn matches_a_note(note: &Value) -> bool {
    note.get("type").and_then(Value::as_str) == Some(DOCUMENT_TYPE)
}

#[cfg(test)]
mod tests {
    use serde_json::json;
    use tempfile::TempDir;

    use super::*;

    fn store() -> (TempDir, NoteStore) {
        let directory = TempDir::new().expect("a temporary directory");
        let store = NoteStore::in_directory(directory.path());

        (directory, store)
    }

    fn a_note() -> Value {
        json!({
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        { "type": "text", "marks": [{ "type": "bold" }], "text": "Hdv" },
                        { "type": "text", "text": " : 12 000 k la Gelano, à revoir." }
                    ]
                },
                {
                    "type": "bulletList",
                    "content": [
                        {
                            "type": "listItem",
                            "content": [
                                { "type": "paragraph", "content": [{ "type": "text", "text": "3 Bave de Tofu" }] }
                            ]
                        }
                    ]
                }
            ]
        })
    }

    #[test]
    fn a_note_comes_back_as_it_was_written_down_to_the_last_accent() {
        let (_directory, store) = store();

        assert_eq!(store.load(), NoteLoaded::Blank, "nothing was ever written");

        store.save(&a_note()).expect("the note is written");

        assert_eq!(store.load(), NoteLoaded::Read(a_note()));
    }

    #[test]
    fn a_note_nobody_can_read_is_set_aside_rather_than_overwritten() {
        let (_directory, store) = store();
        let garbage = "{ \"type\": \"doc\", \"content\": [";

        fs::write(store.path(), garbage).expect("the broken note is written");

        let NoteLoaded::SetAside { path, .. } = store.load() else {
            panic!("a broken note is set aside");
        };

        assert_eq!(
            fs::read_to_string(&path).expect("the set aside note is readable"),
            garbage,
            "what the player wrote survives untouched"
        );
        assert!(!store.path().exists(), "the broken note is moved, not left");

        fs::write(store.path(), "[1, 2, 3]").expect("a file that is no note is written");

        assert!(
            matches!(store.load(), NoteLoaded::SetAside { .. }),
            "a file of JSON that holds no note is no note either"
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_note_that_cannot_be_set_aside_is_never_written_over() {
        use std::os::unix::fs::PermissionsExt;

        let (directory, store) = store();
        let garbage = "{ this is no note";

        fs::write(store.path(), garbage).expect("the broken note is written");
        fs::set_permissions(directory.path(), fs::Permissions::from_mode(0o500))
            .expect("the directory is locked");

        let loaded = store.load();

        fs::set_permissions(directory.path(), fs::Permissions::from_mode(0o700))
            .expect("the directory is unlocked");

        assert!(matches!(loaded, NoteLoaded::Stuck { .. }));
        assert!(
            !loaded.matches_writable(),
            "the next save would write over the only copy of the note"
        );
        assert_eq!(
            fs::read_to_string(store.path()).expect("the note is still there"),
            garbage
        );
    }
}
