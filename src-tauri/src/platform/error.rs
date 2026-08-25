use std::error::Error;
use std::fmt;

pub type Result<T> = core::result::Result<T, PlatformError>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PlatformError {
    AuthorizationDenied,

    WindowGone,

    System {
        operation: &'static str,
        detail: String,
    },
}

impl PlatformError {
    #[must_use]
    pub fn system(operation: &'static str, detail: impl Into<String>) -> Self {
        Self::System {
            operation,
            detail: detail.into(),
        }
    }
}

impl fmt::Display for PlatformError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::AuthorizationDenied => {
                write!(formatter, "the system authorization was not granted")
            }
            Self::WindowGone => write!(formatter, "the window does not exist any more"),
            Self::System { operation, detail } => write!(formatter, "{operation} failed: {detail}"),
        }
    }
}

impl Error for PlatformError {}
