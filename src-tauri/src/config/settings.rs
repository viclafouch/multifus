//! What the configuration file holds, and what it holds for someone who has
//! never opened multifus.
//!
//! Every type here is plain data with a `Default`. Nothing reads a file, nothing
//! registers a shortcut, nothing starts at login: this module describes the
//! shape, steps 7 and 8 give it an effect.

use std::fmt;

use serde::Deserialize;
use serde::Serialize;

use crate::domain::NotificationKind;
use crate::domain::Roster;

/// Everything that survives a restart.
///
/// The veille is not in here, and cannot be: ADR 0004 keeps it for the session
/// only, and [`crate::domain::Character`] marks it `#[serde(skip)]` so the roster
/// below reaches the file without it. What comes back from a file is therefore a
/// roster where everyone is awake and, until the first window scan, offline.
///
/// A field missing from the file takes its default rather than failing the whole
/// load, and a field the file has and this version does not is ignored. So a
/// configuration written by a later multifus still opens in an earlier one, and
/// a new setting can be added here without invalidating everyone's file.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    /// The characters, in cycle order. Their position in the cycle is their
    /// position in this list, which is what the drag and drop of step 6
    /// rearranges.
    pub roster: Roster,
    /// The four key combinations of perimetre.md.
    pub shortcuts: Shortcuts,
    /// The seven AutoFocus switches.
    pub auto_focus: AutoFocus,
    /// Whether multifus starts with the session. Unchecked by default,
    /// perimetre.md is explicit about it. Step 8 wires it to the plugin.
    pub start_at_login: bool,
}

/// The four shortcuts of perimetre.md.
///
/// `None` is a shortcut the user has cleared, and it means the action has no key
/// combination at all. It is a normal state, not a missing value: step 7
/// registers what is here and leaves the rest alone.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct Shortcuts {
    /// Next character in the cycle, asleep ones skipped.
    pub next: Option<Shortcut>,
    /// Previous character in the cycle.
    pub previous: Option<Shortcut>,
    /// Puts the character in the foreground to sleep, or wakes it up.
    pub toggle_asleep: Option<Shortcut>,
    /// Sleeps one gender and wakes the other.
    pub swap: Option<Shortcut>,
}

/// The combinations multifus proposes on a first launch.
///
/// `Control+Shift+arrow` rather than `Control+arrow`: macOS binds the latter to
/// Mission Control and to moving between Spaces, so the four would be taken
/// before multifus ever saw them. They stay a proposal, the user changes them at
/// step 6, and step 7 is the one that finds out whether the system accepts them.
const DEFAULT_NEXT: &str = "Control+Shift+Right";
const DEFAULT_PREVIOUS: &str = "Control+Shift+Left";
const DEFAULT_TOGGLE_ASLEEP: &str = "Control+Shift+Down";
const DEFAULT_SWAP: &str = "Control+Shift+Up";

impl Default for Shortcuts {
    fn default() -> Self {
        Self {
            next: Shortcut::new(DEFAULT_NEXT),
            previous: Shortcut::new(DEFAULT_PREVIOUS),
            toggle_asleep: Shortcut::new(DEFAULT_TOGGLE_ASLEEP),
            swap: Shortcut::new(DEFAULT_SWAP),
        }
    }
}

impl Shortcuts {
    /// The four of them, in the order of the table of perimetre.md. Handy for a
    /// caller that has the same thing to do with each, registering them for
    /// instance.
    #[must_use]
    pub fn all(&self) -> [Option<&Shortcut>; 4] {
        [
            self.next.as_ref(),
            self.previous.as_ref(),
            self.toggle_asleep.as_ref(),
            self.swap.as_ref(),
        ]
    }
}

/// A key combination, written the way the global shortcut plugin of step 7
/// reads it, `Control+Shift+Right` and the like.
///
/// It is stored as text and never interpreted here. Deciding whether a
/// combination exists on this system is the plugin's job, at the moment it is
/// registered, and the failure has to reach the screen then, see the trap noted
/// at step 7 of the plan. The only thing this type refuses is a blank string,
/// which is not a shortcut but an absence, and an absence is spelled `None`.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Shortcut(String);

impl Shortcut {
    /// Reads a combination. Trims it, and returns `None` when nothing is left.
    #[must_use]
    pub fn new(accelerator: impl Into<String>) -> Option<Self> {
        let accelerator = accelerator.into().trim().to_owned();

        if accelerator.is_empty() {
            None
        } else {
            Some(Self(accelerator))
        }
    }

    /// The combination as the plugin expects to read it.
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

/// The seven AutoFocus switches, one per [`NotificationKind`].
///
/// Global and never per character. Dracoon offers the grid of seven icons on
/// every line, which is forty-two buttons for six characters and the global to
/// local synchronisation that comes with it; perimetre.md drops it. There is
/// therefore no room here for a per-character override, and that is the point.
///
/// All seven are on by default: AutoFocus is what multifus is for, and it has to
/// work on a first launch without a visit to the settings.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default)]
pub struct AutoFocus {
    /// It is this character's turn to play.
    pub combat: bool,
    /// Somebody offers a trade.
    pub trade: bool,
    /// Invitation to a group or to a guild.
    pub group: bool,
    /// A private message.
    pub private_message: bool,
    /// Somebody challenges this character to a duel.
    pub challenge: bool,
    /// Workshop invitation, call for a craftsman, items ready.
    pub craft: bool,
    /// The perceptor is under attack.
    pub perceptor: bool,
}

impl Default for AutoFocus {
    fn default() -> Self {
        Self::all(true)
    }
}

impl AutoFocus {
    /// The same state for the seven of them.
    #[must_use]
    pub const fn all(enabled: bool) -> Self {
        Self {
            combat: enabled,
            trade: enabled,
            group: enabled,
            private_message: enabled,
            challenge: enabled,
            craft: enabled,
            perceptor: enabled,
        }
    }

    /// Whether a notification of this kind brings its character to the front.
    #[must_use]
    pub fn is_enabled(&self, kind: NotificationKind) -> bool {
        match kind {
            NotificationKind::Combat => self.combat,
            NotificationKind::Trade => self.trade,
            NotificationKind::Group => self.group,
            NotificationKind::PrivateMessage => self.private_message,
            NotificationKind::Challenge => self.challenge,
            NotificationKind::Craft => self.craft,
            NotificationKind::Perceptor => self.perceptor,
        }
    }

    /// Flips one switch, the way the interface of step 6 does.
    pub fn set(&mut self, kind: NotificationKind, enabled: bool) {
        let switch = match kind {
            NotificationKind::Combat => &mut self.combat,
            NotificationKind::Trade => &mut self.trade,
            NotificationKind::Group => &mut self.group,
            NotificationKind::PrivateMessage => &mut self.private_message,
            NotificationKind::Challenge => &mut self.challenge,
            NotificationKind::Craft => &mut self.craft,
            NotificationKind::Perceptor => &mut self.perceptor,
        };

        *switch = enabled;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_first_launch_starts_on_an_empty_roster_and_nothing_personal() {
        let settings = Settings::default();

        assert!(settings.roster.is_empty());
        assert!(!settings.start_at_login);
    }

    #[test]
    fn the_seven_switches_are_on_by_default() {
        let auto_focus = AutoFocus::default();

        for kind in NotificationKind::ALL {
            assert!(auto_focus.is_enabled(kind), "{kind:?} should be on");
        }
    }

    #[test]
    fn every_switch_is_reachable_and_independent() {
        for kind in NotificationKind::ALL {
            let mut auto_focus = AutoFocus::all(true);
            auto_focus.set(kind, false);

            let off = NotificationKind::ALL
                .into_iter()
                .filter(|other| !auto_focus.is_enabled(*other))
                .collect::<Vec<_>>();

            assert_eq!(off, vec![kind]);
        }
    }

    #[test]
    fn the_four_shortcuts_are_bound_by_default_and_all_differ() {
        let shortcuts = Shortcuts::default();
        let bound = shortcuts
            .all()
            .into_iter()
            .flatten()
            .map(Shortcut::as_str)
            .collect::<Vec<_>>();

        assert_eq!(bound.len(), 4);

        let mut unique = bound.clone();
        unique.sort_unstable();
        unique.dedup();
        assert_eq!(
            unique.len(),
            4,
            "two actions share a combination: {bound:?}"
        );
    }

    #[test]
    fn a_blank_combination_is_an_absence_not_a_shortcut() {
        assert_eq!(Shortcut::new(""), None);
        assert_eq!(Shortcut::new("   "), None);
        assert_eq!(
            Shortcut::new("  Control+Shift+Right  ").map(String::from),
            Some("Control+Shift+Right".to_owned())
        );
    }

    #[test]
    fn a_shortcut_is_stored_as_the_plain_text_the_plugin_reads() {
        let shortcuts = Shortcuts {
            next: Shortcut::new("Alt+Tab"),
            previous: None,
            toggle_asleep: None,
            swap: None,
        };

        let json = serde_json::to_string(&shortcuts).expect("shortcuts serialise");
        assert!(json.contains(r#""next":"Alt+Tab""#), "{json}");
        assert!(json.contains(r#""previous":null"#), "{json}");

        let read: Shortcuts = serde_json::from_str(&json).expect("shortcuts read back");
        assert_eq!(read, shortcuts);
    }

    #[test]
    fn a_blank_shortcut_in_the_file_is_rejected_rather_than_kept() {
        // It would otherwise reach the plugin at step 7, which has nothing to
        // register and no way to say so.
        let error = serde_json::from_str::<Shortcuts>(r#"{"next":""}"#)
            .expect_err("a blank combination is not a shortcut");

        assert!(error.to_string().contains("blank"), "{error}");
    }

    #[test]
    fn a_missing_field_takes_its_default_and_an_unknown_one_is_ignored() {
        let settings: Settings =
            serde_json::from_str(r#"{"start_at_login":true,"from_a_later_version":42}"#)
                .expect("a partial configuration still loads");

        assert!(settings.start_at_login);
        assert_eq!(settings.shortcuts, Shortcuts::default());
        assert_eq!(settings.auto_focus, AutoFocus::default());
        assert!(settings.roster.is_empty());
    }
}
