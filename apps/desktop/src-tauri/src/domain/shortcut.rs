use std::fmt;

use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Shortcut(String);

impl Shortcut {
    #[must_use]
    pub fn new(accelerator: impl Into<String>) -> Option<Self> {
        let accelerator = accelerator.into().trim().to_owned();

        if accelerator.is_empty() {
            None
        } else {
            Some(Self(accelerator))
        }
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for Shortcut {
    type Error = &'static str;

    fn try_from(accelerator: String) -> core::result::Result<Self, Self::Error> {
        Self::new(accelerator).ok_or("a shortcut cannot be blank, use null instead")
    }
}

impl From<Shortcut> for String {
    fn from(shortcut: Shortcut) -> Self {
        shortcut.0
    }
}

impl fmt::Display for Shortcut {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_blank_combination_is_an_absence_not_a_shortcut() {
        assert_eq!(Shortcut::new(""), None);
        assert_eq!(Shortcut::new("   "), None);
        assert_eq!(
            Shortcut::new("  Control+Shift+Right  ").map(String::from),
            Some("Control+Shift+Right".to_owned())
        );
    }
}
