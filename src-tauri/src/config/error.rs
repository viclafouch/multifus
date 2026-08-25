use std::error::Error;
use std::fmt;
use std::io;
use std::path::PathBuf;

pub type Result<T> = core::result::Result<T, ConfigError>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConfigError {
    NoDirectory {
        detail: String,
    },

    Io {
        operation: &'static str,
        path: PathBuf,
        detail: String,
    },

    Malformed {
        path: PathBuf,
        detail: String,
    },

    Encoding {
        detail: String,
    },
}

impl ConfigError {
    #[must_use]
    pub fn io(operation: &'static str, path: impl Into<PathBuf>, error: &io::Error) -> Self {
        Self::Io {
            operation,
            path: path.into(),
            detail: error.to_string(),
        }
    }

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
                "{} is not a Multifus configuration: {detail}",
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
