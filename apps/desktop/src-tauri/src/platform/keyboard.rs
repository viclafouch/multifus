use std::collections::BTreeMap;

pub type KeyLabels = BTreeMap<String, String>;

#[cfg(target_os = "macos")]
#[must_use]
pub fn key_labels() -> KeyLabels {
    crate::platform::macos::key_labels()
}

#[cfg(target_os = "windows")]
#[must_use]
pub fn key_labels() -> KeyLabels {
    KeyLabels::new()
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
#[must_use]
pub fn key_labels() -> KeyLabels {
    KeyLabels::new()
}
