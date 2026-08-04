//! The one error type of the boundary.
//!
//! Everything the system can refuse crosses back to the caller through here.
//! Nothing in this crate is allowed to `unwrap` a system call or to panic
//! because an authorization was denied: on both systems a user who has not yet
//! granted Accessibility, or notification access, is the normal first-launch
//! case and multifus has a screen to show them.

use std::error::Error;
use std::fmt;

/// Shorthand for every fallible call of the boundary.
pub type Result<T> = core::result::Result<T, PlatformError>;

/// Why a call into the system did not do what was asked.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PlatformError {
    /// The user has not granted the authorization this call needs: Accessibility
    /// on macOS, notification access on Windows.
    ///
    /// An expected outcome, not a failure. The caller shows the explanation
    /// screen and retries later, see step 4 of the plan.
    AuthorizationDenied,

    /// The window this [`WindowId`] designates does not exist any more.
    ///
    /// Unavoidable by construction: a client can be closed between the moment a
    /// window is enumerated and the moment the user fires a shortcut at it.
    ///
    /// [`WindowId`]: crate::platform::WindowId
    WindowGone,

    /// The platform implementation has no body yet. Only the empty
    /// implementations of step 3 return this, and each one disappears as its
    /// system gets implemented, macOS at step 4 and Windows at step 9.
    NotImplemented {
        /// The method that is still empty, for the log.
        method: &'static str,
    },

    /// The system call failed for a reason of its own.
    System {
        /// What was being attempted, in the boundary's own words.
        operation: &'static str,
        /// What the system said about it.
        detail: String,
    },
}

impl PlatformError {
    /// The error every method of an empty platform implementation returns.
    #[must_use]
    pub fn not_implemented(method: &'static str) -> Self {
        Self::NotImplemented { method }
    }

    /// A system call that failed on its own terms.
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
            Self::NotImplemented { method } => {
                write!(formatter, "{method} is not implemented on this system yet")
            }
            Self::System { operation, detail } => write!(formatter, "{operation} failed: {detail}"),
        }
    }
}

impl Error for PlatformError {}
