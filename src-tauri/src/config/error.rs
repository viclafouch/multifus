//! The one error type of the configuration.
//!
//! Every way reading or writing the file can go wrong crosses back to the caller
//! through here. Nothing in this module panics or unwraps: a configuration that
//! cannot be read is an ordinary state, multifus starts on its defaults and the
//! interface has something to say about it, see [`crate::config::Loaded`].

use std::error::Error;
use std::fmt;
use std::io;
use std::path::PathBuf;

/// Shorthand for every fallible call of this module.
pub type Result<T> = core::result::Result<T, ConfigError>;

/// Why the configuration could not be read or written.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConfigError {
    /// The system did not give a configuration directory to write into.
    ///
    /// Comes from Tauri's own path resolution, which is the only way multifus
    /// asks for that directory. Never a hard-coded path, see perimetre.md.
    NoDirectory {
        /// What Tauri said about it.
        detail: String,
    },

    /// A file operation failed on its own terms: no permission, disk full, a
    /// directory where a file was expected.
    Io {
        /// What was being attempted, in this module's own words.
        operation: &'static str,
        /// The file it was attempted on.
        path: PathBuf,
        /// What the system said about it.
        detail: String,
    },

    /// The bytes were read but are not a configuration multifus understands:
    /// truncated by an old crash, hand-edited into invalid JSON, or written by
    /// something else entirely.
    ///
    /// The file is set aside rather than overwritten, see
    /// [`ConfigStore::load`].
    ///
    /// [`ConfigStore::load`]: crate::config::ConfigStore::load
    Malformed {
        /// The file that could not be understood.
        path: PathBuf,
        /// Where the parser gave up.
        detail: String,
    },

    /// The settings could not be turned into JSON, which only a bug in this
    /// crate can cause. It is an error rather than a panic because nothing here
    /// is allowed to take the application down.
    Encoding {
        /// What the serializer said about it.
        detail: String,
    },
}

impl ConfigError {
    /// A file operation that failed on its own terms.
    #[must_use]
    pub fn io(operation: &'static str, path: impl Into<PathBuf>, error: &io::Error) -> Self {
        Self::Io {
            operation,
            path: path.into(),
            detail: error.to_string(),
        }
    }

    /// Bytes that are not a configuration.
    #[must_use]
    pub fn malformed(path: impl Into<PathBuf>, detail: impl Into<String>) -> Self {
        Self::Malformed {
            path: path.into(),
            detail: detail.into(),
        }
    }
}

impl fmt::Display for ConfigError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NoDirectory { detail } => {
                write!(
                    formatter,
                    "the system has no configuration directory to offer: {detail}"
                )
            }
            Self::Io {
                operation,
                path,
                detail,
            } => write!(
                formatter,
                "{operation} failed on {}: {detail}",
                path.display()
            ),
            Self::Malformed { path, detail } => write!(
                formatter,
                "{} is not a multifus configuration: {detail}",
                path.display()
            ),
            Self::Encoding { detail } => {
                write!(
                    formatter,
                    "the configuration could not be written: {detail}"
                )
            }
        }
    }
}

impl Error for ConfigError {}
