//! The journal the interface unfolds on the day AutoFocus does not fire.
//!
//! It is in memory only and dies with the process. What it records is not meant
//! to be kept, it is meant to answer one question on the spot: multifus did not
//! bring that window to the front, at which step did it stop.
//!
//! Every entry is a structured event and never a sentence. Writing
//! `"Alpha est passé au premier plan"` here would put French in a module whose
//! language is English, and would scatter the interface strings across two
//! languages and two repositories' worth of files. The interface owns the
//! wording, this module owns the facts.

use std::collections::VecDeque;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

use serde::Serialize;

use crate::domain::NotificationKind;

/// How many entries are kept. Past this the oldest goes, which is the right end
/// to lose: what is being diagnosed just happened.
const CAPACITY: usize = 200;

/// One line of the journal.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntry {
    /// Strictly increasing for the life of the process, so the interface has a
    /// key that never repeats even after the oldest entries have been dropped.
    pub id: u64,
    /// Milliseconds since the epoch. The interface formats it, since a date
    /// reads in the user's language and that language is not this module's.
    pub at: u64,
    pub event: JournalEvent,
}

/// Something worth knowing about when nothing comes to the front.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum JournalEvent {
    /// multifus started and read its configuration.
    Started,

    /// The system authorization was granted or taken away. On macOS it can be
    /// revoked from the settings at any time, so this is not a one-off.
    Authorization { granted: bool },

    /// The notification listening is running.
    Listening,

    /// It is not, and this is why. The most common reason by far is the
    /// authorization, which has its own event; anything else lands here.
    ListeningFailed { detail: String },

    /// A window bearing this nickname appeared.
    CharacterOnline { nickname: String },

    /// Its window is gone. The character stays in the roster, greyed out.
    CharacterOffline { nickname: String },

    /// A game notification arrived, and this is what multifus did with it. The
    /// one event this whole journal exists for.
    Notification {
        nickname: String,
        /// `None` when no pattern of the table matched the body.
        notification_kind: Option<NotificationKind>,
        outcome: Outcome,
    },

    /// Enumerating the game windows failed for a reason of the system's own.
    ScanFailed { detail: String },

    /// The configuration could not be written. What is on screen is right, what
    /// is on disk is not.
    SaveFailed { detail: String },

    /// Something multifus handed to the system to open did not open: the
    /// settings pane of the authorization, the file that was set aside.
    OpenFailed { detail: String },

    /// Everything went back to its defaults, roster included.
    Reset,
}

/// What became of a game notification.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "outcome", rename_all = "camelCase")]
pub enum Outcome {
    /// The window was asked to come to the front.
    Focused,

    /// The switch for that kind is off, so nothing was meant to happen.
    KindDisabled,

    /// No pattern matched the body. multifus has no idea what the event is and
    /// focuses nothing, which is the honest answer.
    KindUnknown,

    /// The nickname belongs to nobody in the roster, or to a character whose
    /// window multifus cannot see. A notification can outlive its window.
    NoWindow,

    /// The focus was asked for and the system refused it.
    FocusFailed { detail: String },
}

/// The last [`CAPACITY`] events, oldest first.
#[derive(Debug, Default)]
pub struct Journal {
    entries: VecDeque<JournalEntry>,
    next_id: u64,
}

impl Journal {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Appends an event, dropping the oldest entry when the journal is full.
    pub fn push(&mut self, event: JournalEvent) {
        if self.entries.len() == CAPACITY {
            self.entries.pop_front();
        }

        self.entries.push_back(JournalEntry {
            id: self.next_id,
            at: now_in_milliseconds(),
            event,
        });

        self.next_id = self.next_id.wrapping_add(1);
    }

    /// Appends an event unless the exact same one is already at the end.
    ///
    /// The window scan runs every few seconds and a failure it hits tends to
    /// hold: a revoked authorization, a system call that keeps refusing. Written
    /// every time, one such failure would push everything that led to it out of
    /// the journal within a couple of minutes, which is the one thing this
    /// journal must not do.
    pub fn push_unless_repeated(&mut self, event: JournalEvent) {
        if self.entries.back().map(|entry| &entry.event) == Some(&event) {
            return;
        }

        self.push(event);
    }

    /// The entries, oldest first.
    #[must_use]
    pub fn entries(&self) -> Vec<JournalEntry> {
        self.entries.iter().cloned().collect()
    }
}

/// The wall clock, in milliseconds. Falls back to zero on a system clock set
/// before 1970, which the interface will show as an odd time and nothing worse.
fn now_in_milliseconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|elapsed| u64::try_from(elapsed.as_millis()).unwrap_or(u64::MAX))
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_journal_keeps_the_most_recent_entries() {
        let mut journal = Journal::new();

        for index in 0..CAPACITY + 10 {
            journal.push(JournalEvent::CharacterOnline {
                nickname: format!("Character{index}"),
            });
        }

        let entries = journal.entries();

        assert_eq!(entries.len(), CAPACITY);
        assert_eq!(entries.first().unwrap().id, 10);
        assert_eq!(
            entries.last().unwrap().id,
            u64::try_from(CAPACITY).unwrap() + 9
        );
    }

    #[test]
    fn an_identifier_is_never_reused() {
        let mut journal = Journal::new();

        journal.push(JournalEvent::Started);
        journal.push(JournalEvent::Listening);

        let identifiers = journal
            .entries()
            .iter()
            .map(|entry| entry.id)
            .collect::<Vec<_>>();

        assert_eq!(identifiers, vec![0, 1]);
    }

    #[test]
    fn a_failure_that_holds_is_written_once() {
        // The scan runs every few seconds. Written every time, a lasting failure
        // would flush the journal of everything that explains it.
        let mut journal = Journal::new();
        let failure = || JournalEvent::ScanFailed {
            detail: "the system said no".to_owned(),
        };

        journal.push_unless_repeated(failure());
        journal.push_unless_repeated(failure());
        journal.push_unless_repeated(failure());

        assert_eq!(journal.entries().len(), 1);

        // And it is written again once something else has happened.
        journal.push(JournalEvent::Listening);
        journal.push_unless_repeated(failure());

        assert_eq!(journal.entries().len(), 3);
    }
}
