//! The journal the interface unfolds on the day AutoFocus does not fire.
//!
//! Every entry is a structured event and never a sentence. Writing
//! `"Alpha est passé au premier plan"` here would put French in a module whose
//! language is English, and would scatter the interface strings across two
//! languages and two repositories' worth of files. The interface owns the
//! wording, this module owns the facts.
//!
//! **It goes to a file, and the file is what lasts.** What is in memory is the
//! last [`CAPACITY`] entries, which is what the drawer of the window draws and
//! what travels in every snapshot. What is on disk is weeks of it, because the
//! question this journal answers is rarely asked in the minute it is created:
//! Multifus is launched and forgotten, and a focus that did not happen is
//! reported hours later. The two are the same events; only the window they cover
//! differs. See ADR 0006 for the retention, the disk cost and the privacy.
//!
//! **No notification body ever reaches this module, in any form.** Not the text,
//! not a truncated version, not a masked one. The seven kinds are recognised
//! from that body by [`crate::domain::classify`] and only the kind travels here.
//! A private message is a real person writing to the user, and this journal is a
//! file that lives for weeks and gets pasted into a bug report. The rule is
//! narrow enough to hold: nothing on the notification path may add a field
//! carrying words the game wrote, and the test named
//! `the_journal_never_carries_the_words_of_a_notification` fails if anything
//! does. See ADR 0006 for what that costs.

use std::collections::VecDeque;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

use serde::Serialize;

use crate::app::journal_file;
use crate::app::view::BindingView;
use crate::app::view::ShortcutAction;
use crate::domain::Gender;
use crate::domain::NotificationKind;

/// How many entries stay in memory.
///
/// Not the retention: the file holds weeks, this holds what the drawer shows and
/// what every snapshot carries to the window. Past this the oldest goes, which is
/// the right end to lose on screen, since what is being looked at just happened.
const CAPACITY: usize = 200;

/// One of the three things Multifus does on a thread of its own.
///
/// What [`JournalEvent::Panicked`] names. An enum and not a sentence, for the
/// reason the whole module exists: `catch_unwind` hands back an opaque payload,
/// so there is nothing to quote from the system, and a sentence written here
/// would be English shown to a French reader through a `detail` field meant for
/// the words of the system.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Work {
    /// Asking which game windows exist, every few seconds.
    Scan,
    /// Answering a combination that fired.
    Shortcuts,
    /// Answering a character clicked in the system tray.
    Tray,
}

/// One line of the journal.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntry {
    /// Strictly increasing for the life of the process, so the interface has a
    /// key that never repeats even after the oldest entries have been dropped.
    ///
    /// It starts again at zero at each launch, which the file makes harmless:
    /// every launch opens with a [`JournalEvent::Started`] naming its version,
    /// and that line is what tells one run from the next.
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
    /// Multifus started, and everything needed to read the rest of the journal
    /// without asking the user a single question.
    ///
    /// The three fields are the ones that turn a transcript into a diagnosis.
    /// The version, because a journal is read against a release. The system,
    /// because the macOS banner tree is what ADR 0002 stands on and it belongs
    /// to an operating system version. The launch, because a session start and a
    /// double click do not show the same thing, and `docs/macos.md` records that
    /// macOS reopens applications by itself and fakes the difference.
    Started {
        version: String,
        /// The system, its version and its architecture, as
        /// `tauri-plugin-os` reports them. No hostname, no locale: the file is
        /// meant to be shareable.
        system: String,
        launch: Launch,
    },

    /// The stored configuration was not the one Multifus started on.
    ///
    /// A roster that opens empty is the worst failure this application has, and
    /// until now it lived only in the snapshot, where
    /// [`crate::app::commands::dismiss_config_problem`] could erase it for good.
    ConfigLoadFailed {
        detail: String,
        /// Where the file was moved to, `None` when nothing was moved: an
        /// unreadable file is left exactly where it is.
        quarantined: Option<String>,
    },

    /// The configuration could not be read **and** could not be moved aside, so
    /// it is still sitting where the next save will write over it.
    ///
    /// Two events and not one, because these are two facts and the second is the
    /// one that costs a roster somebody typed by hand.
    ConfigNotSetAside { detail: String },

    /// The system authorization was granted or taken away. On macOS it can be
    /// revoked from the settings at any time, so this is not a one-off.
    Authorization { granted: bool },

    /// The user asked for the authorization, and this is what came back.
    ///
    /// Written even when the answer is the refusal it almost always is: macOS
    /// grants nothing in the second that follows the dialog, so the button
    /// having been pressed at all is the fact worth keeping.
    AuthorizationRequested {
        granted: bool,
        /// What the system said when it would not even answer the question.
        /// `None` when it answered.
        failure: Option<String>,
    },

    /// The notification listening is running.
    Listening,

    /// It is not, and this is why. The most common reason by far is the
    /// authorization, which has its own event; anything else lands here.
    ListeningFailed { detail: String },

    /// Something was drawn on screen and the system would not let Multifus read
    /// it.
    ///
    /// The one hole this journal used to have on the path it exists for: a
    /// banner that cannot be walked produces no notification, so nothing reached
    /// the journal at all and an empty journal meant two opposite things, no
    /// banner drawn or a banner unreadable. Only written when the walk hit a
    /// refusal, never for the ordinary elements the notification centre builds
    /// all day long.
    NotificationUnreadable { detail: String },

    /// A window bearing this nickname appeared.
    CharacterOnline { nickname: String },

    /// Its window is gone. The character stays in the roster, greyed out.
    CharacterOffline { nickname: String },

    /// A game notification arrived, and this is what Multifus did with it. The
    /// one event this whole journal exists for.
    ///
    /// **It carries no word of the notification and never will**, see the note
    /// at the top of this module.
    Notification {
        nickname: String,
        /// `None` when no pattern of the table matched the body.
        notification_kind: Option<NotificationKind>,
        outcome: Outcome,
    },

    /// The user changed the roster from the window.
    ///
    /// The veille moved by a shortcut is a [`JournalEvent::Shortcut`] and the
    /// veille moved by a click is this. Both exist because the journal has to be
    /// readable on its own: a `Suivant` that reports « personne dans le
    /// défilement » is only explained by the six rows somebody put to sleep a
    /// minute earlier.
    Roster { change: RosterChange },

    /// The user changed a setting, from the window or from the system tray.
    ///
    /// Which surface it came from is part of the fact for the two settings the
    /// menu carries: it says whether the window had to be opened, which is the
    /// measure of the whole principle of this project.
    Setting { change: SettingChange },

    /// Every combination was laid on the system, the four actions and the
    /// quick replies, and this is what each of them answered.
    ///
    /// One line for the set rather than one per binding, because the question is
    /// always about the set: which keys were bound at that moment. It is also
    /// the only place a [`crate::app::view::ShortcutStatus::Duplicate`] is ever
    /// said out loud, and a duplicate is a combination that never fires and
    /// never writes a line of its own.
    ShortcutsBound { bindings: Vec<BindingView> },

    /// The shortcuts as a whole are in trouble: the thread that runs them could
    /// not start, could not be reached, or died; or the previous combinations
    /// could not be taken down.
    ShortcutsFailed { detail: String },

    /// A shortcut fired, and this is what Multifus did with it.
    Shortcut {
        action: ShortcutAction,
        outcome: ShortcutOutcome,
    },

    /// A quick reply was pasted into the game.
    ///
    /// **The first forty characters of the text**, and the one place this file
    /// holds words somebody typed. What that costs is in ADR 0012.
    QuickReplyPasted { excerpt: String },

    /// A quick reply was fired and something turned it down, and this says where it
    /// is repaired. Never the text.
    QuickReplyFailed { reason: QuickReplyFailure },

    /// A client had just opened and its window was filled to the screen.
    WindowMaximized { nickname: String },

    /// A client had just opened and its window would not be filled.
    WindowMaximizeFailed { nickname: String, detail: String },

    /// A character was clicked in the system tray, and this is what came of it.
    TrayFocus {
        nickname: String,
        outcome: TrayOutcome,
    },

    /// The system tray icon could not be put up, could not be kept in step with
    /// the roster, or its worker died. Multifus works without it; what goes
    /// missing is the way to quit and the roster at a glance.
    TrayFailed { detail: String },

    /// The window would not come back, or would not go away. Nothing else stops:
    /// the roster is still watched and the shortcuts still answer, only the board
    /// is out of reach.
    WindowFailed { detail: String },

    /// The dashboard could not be handed to the window.
    ///
    /// The one failure that cannot be diagnosed from the window, since the
    /// journal travels inside the very payload that did not arrive: what is on
    /// screen then stays frozen on an older roster and nothing says so. It is
    /// readable in the file, and that is the plainest argument for the file.
    SnapshotFailed { detail: String },

    /// The start with the session now matches what the configuration asks for.
    ///
    /// Written at every launch, because `tauri-plugin-autostart` records a path
    /// and never checks it: the registration is rewritten each time and this is
    /// the only proof it was.
    StartAtLoginReconciled { enabled: bool },

    /// It could not be made to match. The switch on screen is then ahead of the
    /// system.
    StartAtLoginFailed { detail: String },

    /// One of the three threads hit a panic and carried on.
    ///
    /// Each of them going quiet used to look exactly like a user who had stopped
    /// touching anything: no character ever came online again, no combination ever
    /// answered, no item of the menu ever did anything. There is nothing to quote
    /// from the system here, so the event names the work and nothing else.
    Panicked { work: Work },

    /// Enumerating the game windows failed for a reason of the system's own, or
    /// the thread that does it could not be started.
    ScanFailed { detail: String },

    /// The configuration could not be written. What is on screen is right, what
    /// is on disk is not.
    SaveFailed { detail: String },

    /// A newer version is published.
    UpdateAvailable { version: String },

    /// The check reached the endpoint and this version is the published one.
    ///
    /// Written so that a check which has never once succeeded stops looking
    /// exactly like a Multifus that is up to date.
    UpdateUpToDate,

    /// The update could not be looked for, or could not be put in place. The
    /// one failure of Multifus that is usually the network's and not the
    /// system's.
    UpdateFailed { detail: String },

    /// Something Multifus handed to the system to open did not open: the
    /// settings pane of the authorization, a file that was set aside, the
    /// journal itself.
    OpenFailed { detail: String },

    /// The relay is paired: a chat is known and the token is in the keychain.
    ///
    /// **It carries no chat identifier, on purpose.** That is not a notification
    /// body, so the rule of ADR 0006 does not reach it, but it names a real
    /// conversation of a real person, and this file lives for weeks and gets
    /// pasted into a bug report. Same reason the hostname stays out of
    /// [`JournalEvent::Started`].
    RelayPaired,

    /// The bot was forgotten: the token left the keychain and the chat left the
    /// configuration.
    RelayUnpaired,

    /// The relay could not do what was asked, and this says where it is
    /// repaired. Never a notification body, in any form.
    RelayFailed { reason: RelayFailure },

    /// The relay is on, and this says which of the two switches did it. It used
    /// to carry nothing, back when the tray was the only door.
    RelayEnabled { surface: Surface },

    /// The relay is off, and this says what stopped it.
    RelayDisabled { reason: RelayStop },

    /// A private message went out. No kind, for the reason above: the private
    /// message is the only one relayed, hardcoded. And no body, ever.
    RelaySent { nickname: String },

    /// The relay said something about itself rather than about the game, ADR
    /// 0010. One message per scan, so one line per message.
    RelayNoticeSent { case: NoticeCase },

    /// The user asked the relay to prove itself, and the message landed. No
    /// surface: the button is on the Relais screen and nowhere else.
    RelayTestSent,

    /// The display is held awake, or let go. Written on the change and never on
    /// the state, which at one scan every three seconds would flush this journal.
    DisplayAwake { held: bool },

    /// The hold could not be raised or released. Not a relay failure: messages
    /// still go out, right up until the session locks.
    DisplayAwakeFailed { detail: String },

    /// Everything went back to its defaults, roster included.
    Reset,

    /// Multifus was asked to quit from the system tray.
    ///
    /// The last line of a run that ended on purpose. Its absence at the end of a
    /// run is therefore a fact of its own, and only a file can hold that
    /// difference.
    Quit,
}

/// How Multifus was started.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Launch {
    /// Somebody opened it, which is a request to see the window.
    ByHand,
    /// The session launcher did, which is not. See
    /// [`crate::app::main_window`].
    Session,
}

/// What the user did to the roster from the window.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum RosterChange {
    /// Taken out of the cycle. AutoFocus still applies to it, see CONTEXT.md.
    Slept { nickname: String },

    /// Put back into the cycle.
    Woke { nickname: String },

    /// One of the two grouped actions: the same veille pushed onto every
    /// connected character of a gender.
    GenderAsleep { gender: Gender, asleep: bool },

    /// A gender was assigned, or taken away with `None`.
    GenderAssigned {
        nickname: String,
        gender: Option<Gender>,
    },

    /// The cycle order was rewritten by the drag and drop. The order recorded is
    /// the one that came out, not the one that was asked for: a stale list moves
    /// what was dragged and loses nobody, so the two can differ.
    Reordered { order: Vec<String> },

    /// Taken out of the roster for good.
    Removed { nickname: String },

    /// Put in or out of the relay. Kept indefinitely like the gender, which is
    /// what makes this line worth writing: a principal unticked six weeks ago is
    /// otherwise a private message lost in silence. See ADR 0011.
    Relayed { nickname: String, relayed: bool },
}

/// What the user changed, and from where when there are two doors.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum SettingChange {
    /// The master switch, which suspends the seven kinds without forgetting
    /// them.
    AutoFocusEnabled { enabled: bool, from: Surface },

    /// One of the seven. The window only: the menu has no room for seven lines
    /// and perimetre.md refuses them per character.
    ///
    /// Named as it is in [`JournalEvent::Notification`], and not `kind`, which is
    /// the word this enum is already tagged by.
    AutoFocusKind {
        notification_kind: NotificationKind,
        enabled: bool,
    },

    /// Whether the AutoFocus reaches into the Dock.
    WakesMinimized { wakes: bool, from: Surface },

    /// Whether a game window is filled to the screen when it first appears.
    MaximizeOnLaunch { maximize: bool },

    /// Whether the text of a private message goes out with it, ADR 0008. The
    /// window only: one does not decide the privacy of a message in passing,
    /// which is why this one is not in the menu of the system tray.
    RelayBody { send_body: bool },
}

/// Why the relay could not do what was asked.
///
/// Three and not one, because they are repaired in three different places: the
/// keychain of the system, the bot at Telegram, and the network in between. One
/// `RelayFailed` with a single detail would send the reader to the wrong one two
/// times out of three.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "reason",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum RelayFailure {
    /// The keychain would not keep, hand back or erase the token.
    Keychain { detail: String },

    /// Telegram answered and turned the call down.
    Telegram { detail: String },

    /// The request never left, or never came back.
    ///
    /// `detail` never carries the URL of the call: the bot token is in that URL
    /// and `reqwest` puts it in its own `Display`, see
    /// [`crate::app::relay::telegram`].
    Network { detail: String },
}

/// Why a quick reply did not reach the chat, or did and cost the clipboard.
///
/// Six and not one, because they are repaired in six different places. The list
/// and its reasons are in `docs/plan.md`, temps 2.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "reason",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum QuickReplyFailure {
    /// The foreground window is not a game one, so the quick reply stayed inert,
    /// exactly as the four actions do.
    OutsideGame,

    /// The system would not say what is in the foreground, so the guard could
    /// not be checked and nothing was pasted.
    ForegroundUnknown { detail: String },

    /// The quick reply was removed between the key press and the answer.
    Gone,

    /// The text could not be put on the clipboard, so nothing was there to
    /// paste.
    ClipboardRefused { detail: String },

    /// The system turned down the paste combination.
    PasteRefused { detail: String },

    /// The quick reply went in and what the user had copied did not come back. The
    /// one reason here that follows a paste which worked.
    ClipboardNotGivenBack { detail: String },
}

/// What stopped the relay. A reason and not a [`Surface`], since two of these
/// five are not a door the user pressed.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum RelayStop {
    /// A combination fired with a game window in front, so somebody is back.
    Shortcut,

    /// The item of the system tray, one of the two switches.
    Tray,

    /// The switch of the Relais screen, the other one.
    Window,

    /// The last relayed character was unticked, see ADR 0011.
    NoRelayedCharacter,

    /// The bot was forgotten, or everything was reset. No chat is left.
    NoLongerPaired,
}

/// What an avis of ADR 0010 said. Five: the two ends of the switch, and the
/// three the scan produces, whose phrases travel together in one message.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum NoticeCase {
    /// The switch was moved on, and the telephone was told so.
    Enabled,

    /// The switch was moved off, whichever gesture did it.
    Disabled,

    /// Relayed characters went offline, and others are still connected.
    Disconnected,

    /// Both phrases, in one message. No nickname on this event: six characters
    /// falling in one scan make one message naming six.
    Both,
}

/// Which of the two surfaces the user acted on.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Surface {
    /// The window was open, and its screen carried the switch or the setting.
    Window,
    /// The menu of the system tray, the door that needs no window at all.
    Tray,
}

/// What became of a game notification.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "outcome", rename_all = "camelCase")]
pub enum Outcome {
    /// The window was asked to come to the front.
    Focused,

    /// The switch for that kind is off, so nothing was meant to happen.
    KindDisabled,

    /// No pattern matched the body. Multifus has no idea what the event is and
    /// focuses nothing, which is the honest answer.
    KindUnknown,

    /// There was no body to read.
    ///
    /// Told apart from [`Outcome::KindUnknown`] on purpose, and the two used to
    /// be one. A wording no pattern covers is repaired by adding a pattern to
    /// `NOTIF_TYPES`; a body Multifus never read is repaired in the walk of
    /// `platform::macos`. Reporting the first when it is the second sends the
    /// reader to the wrong file.
    BodyUnread,

    /// The nickname belongs to nobody in the roster, or to a character whose
    /// window Multifus cannot see. A notification can outlive its window.
    NoWindow,

    /// The window is in the Dock and the réveil des réduites is off, so it was
    /// left there. What the user asked for, said out loud rather than looking
    /// like an AutoFocus that missed.
    LeftMinimized,

    /// The focus was asked for and the system refused it.
    FocusFailed { detail: String },
}

/// What became of a character clicked in the system tray.
///
/// Three outcomes and not the six of a notification: a click carries no kind to
/// recognise and no switch to be turned off by, so the only questions left are
/// whether the window is still there and whether the system agreed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "outcome", rename_all = "camelCase")]
pub enum TrayOutcome {
    /// The window was asked to come to the front.
    Focused,

    /// The menu was built before this character's client closed.
    NoWindow,

    /// The focus was asked for and the system refused it.
    FocusFailed { detail: String },
}

/// What became of a shortcut that fired.
///
/// The question this answers is the one asked out loud the day a combination
/// seems dead: Multifus heard the keys, and then what. « Nothing happened »
/// has five different reasons here, and telling them apart is the whole point.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "outcome", rename_all = "camelCase")]
pub enum ShortcutOutcome {
    /// The window of this character was asked to come to the front.
    Focused { nickname: String },

    /// This character left the cycle.
    Slept { nickname: String },

    /// This character came back into the cycle.
    Woke { nickname: String },

    /// One gender went to sleep and the other woke up.
    Swapped { awake: Gender },

    /// The foreground window is not a game one, so the shortcut stayed inert.
    /// The guard of perimetre.md, and by far the most common outcome.
    OutsideGame,

    /// A game window is in front and its character is not in the roster yet.
    /// A client opened less than one scan ago looks like this.
    NotInRoster { nickname: String },

    /// The cycle had nowhere to go: everyone is asleep, or nobody is connected.
    NobodyInCycle,

    /// The swap had nothing to swap: no connected character has a gender.
    NoGender,

    /// The character to go to has no window Multifus can see any more.
    NoWindow { nickname: String },

    /// The focus was asked for and the system refused it.
    FocusFailed { nickname: String, detail: String },

    /// The system would not say what is in the foreground, so the guard could
    /// not be checked and nothing was done.
    ForegroundUnknown { detail: String },
}

/// The last [`CAPACITY`] events in memory, oldest first, and all of them on
/// disk.
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

    /// Appends an event, dropping the oldest entry in memory when it is full.
    ///
    /// The file is written here and not by the caller, so that there is exactly
    /// one door into the journal and no path can reach the window without
    /// reaching the disk. The write is synchronous and happens under the lock of
    /// [`crate::app::state`], the same way saving the configuration already
    /// does; it is a file append, not one of the three things that rule forbids.
    pub fn push(&mut self, event: JournalEvent) {
        if self.entries.len() == CAPACITY {
            self.entries.pop_front();
        }

        let entry = JournalEntry {
            id: self.next_id,
            at: now_in_milliseconds(),
            event,
        };

        journal_file::append(&entry);

        self.entries.push_back(entry);
        self.next_id = self.next_id.wrapping_add(1);
    }

    /// Appends an event unless the exact same one is already at the end, and says
    /// whether it wrote.
    ///
    /// The window scan runs every few seconds and a failure it hits tends to
    /// hold: a revoked authorization, a system call that keeps refusing. Written
    /// every time, one such failure would push everything that led to it out of
    /// the journal within a couple of minutes, which is the one thing this
    /// journal must not do. A shortcut mashed outside the game says the same
    /// thing about the same key press, and costs the same.
    ///
    /// The answer is for callers whose only reason to send a snapshot was this
    /// line. It says nothing about whether anything else changed, and no caller
    /// should read it that way: two identical events in a row are two identical
    /// events, not a roster that stood still between them.
    pub fn push_unless_repeated(&mut self, event: JournalEvent) -> bool {
        if self.entries.back().map(|entry| &entry.event) == Some(&event) {
            return false;
        }

        self.push(event);

        true
    }

    /// The entries held in memory, oldest first.
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
    fn the_journal_keeps_the_most_recent_entries_in_memory() {
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

        journal.push(JournalEvent::Listening);
        journal.push(JournalEvent::Quit);

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

    #[test]
    fn the_journal_never_carries_the_words_of_a_notification() {
        // The one rule of this module that is not about diagnosis, and the one
        // somebody will ask about after reading the source on GitHub. A private
        // message is a real person writing to the user; the kind of event is all
        // Multifus needs and all it keeps.
        //
        // The fields are named here on purpose. Adding one to the event fails
        // this test, which is the point: the rule outlives whoever remembers it.
        let event = JournalEvent::Notification {
            nickname: "Alpha".to_owned(),
            notification_kind: Some(NotificationKind::PrivateMessage),
            outcome: Outcome::Focused,
        };

        assert_eq!(
            fields_of(&event),
            ["kind", "nickname", "notificationKind", "outcome"]
        );
    }

    /// The field names one event serialises to, which is what the two rules of
    /// this module are asserted on rather than on anybody's memory.
    fn fields_of(event: &JournalEvent) -> Vec<String> {
        serde_json::to_value(event)
            .expect("the event serialises")
            .as_object()
            .expect("an event is an object")
            .keys()
            .cloned()
            .collect()
    }

    #[test]
    fn no_relay_event_carries_a_body_or_a_chat() {
        // Two rules in one test, and both outlive whoever remembers them. No
        // notification body, which is ADR 0006 and ADR 0008. And no chat
        // identifier, which is not that rule but the same reason the hostname
        // stays out: this file is meant to be handed over.
        //
        // Adding a field to any of the three fails here, which is the point.
        assert_eq!(fields_of(&JournalEvent::RelayPaired), ["kind"]);
        assert_eq!(fields_of(&JournalEvent::RelayUnpaired), ["kind"]);

        let failed = JournalEvent::RelayFailed {
            reason: RelayFailure::Telegram {
                detail: "Unauthorized".to_owned(),
            },
        };

        assert_eq!(fields_of(&failed), ["kind", "reason"]);
        assert_eq!(
            serde_json::to_string(&failed).expect("the event serialises"),
            r#"{"kind":"relayFailed","reason":{"reason":"telegram","detail":"Unauthorized"}}"#
        );
    }

    #[test]
    fn nothing_the_running_relay_writes_carries_a_body_or_a_chat() {
        // The same two rules, on the events of step 11b-2. These are the ones
        // nearest a body, and adding a field to any of them fails here.
        let enabled = JournalEvent::RelayEnabled {
            surface: Surface::Window,
        };

        assert_eq!(fields_of(&enabled), ["kind", "surface"]);
        assert_eq!(fields_of(&JournalEvent::RelayTestSent), ["kind"]);

        let sent = JournalEvent::RelaySent {
            nickname: "Alpha".to_owned(),
        };

        assert_eq!(fields_of(&sent), ["kind", "nickname"]);
        assert_eq!(
            serde_json::to_string(&sent).expect("the event serialises"),
            r#"{"kind":"relaySent","nickname":"Alpha"}"#
        );

        let notice = JournalEvent::RelayNoticeSent {
            case: NoticeCase::Both,
        };

        assert_eq!(fields_of(&notice), ["case", "kind"]);
        assert_eq!(
            serde_json::to_string(&notice).expect("the event serialises"),
            r#"{"kind":"relayNoticeSent","case":"both"}"#
        );

        let disabled = JournalEvent::RelayDisabled {
            reason: RelayStop::Shortcut,
        };

        assert_eq!(fields_of(&disabled), ["kind", "reason"]);
        assert_eq!(
            fields_of(&JournalEvent::DisplayAwake { held: true }),
            ["held", "kind"]
        );
    }

    #[test]
    fn a_relay_that_stops_says_which_of_the_four_gestures_stopped_it() {
        // Two of the four are somebody coming back and two are not, and a
        // transcript of an absence is unreadable if they look alike.
        let stops = [
            RelayStop::Shortcut,
            RelayStop::Tray,
            RelayStop::NoRelayedCharacter,
            RelayStop::NoLongerPaired,
        ];

        let named = stops
            .iter()
            .map(|stop| {
                serde_json::to_value(stop)
                    .expect("a stop serialises")
                    .as_str()
                    .expect("a stop is a name")
                    .to_owned()
            })
            .collect::<Vec<_>>();

        assert_eq!(
            named,
            ["shortcut", "tray", "noRelayedCharacter", "noLongerPaired"]
        );
    }

    #[test]
    fn a_relay_failure_says_which_of_the_three_places_it_is_repaired_in() {
        // The keychain refusing, Telegram refusing and the network being absent
        // are three different repairs. Collapsing them into one detail would
        // send the reader looking in the wrong place two times out of three.
        let reasons = [
            RelayFailure::Keychain {
                detail: "denied".to_owned(),
            },
            RelayFailure::Telegram {
                detail: "Unauthorized".to_owned(),
            },
            RelayFailure::Network {
                detail: "error sending request".to_owned(),
            },
        ];

        let named = reasons
            .iter()
            .map(|reason| {
                serde_json::to_value(reason).expect("a reason serialises")["reason"]
                    .as_str()
                    .expect("a reason is tagged")
                    .to_owned()
            })
            .collect::<Vec<_>>();

        assert_eq!(named, ["keychain", "telegram", "network"]);
    }

    #[test]
    fn a_paste_carries_an_excerpt_of_the_user_s_own_line_and_nothing_more() {
        // The one place this file holds words somebody typed, ADR 0012. Adding a
        // field here fails, exactly as it does for the relay events.
        let pasted = JournalEvent::QuickReplyPasted {
            excerpt: "prix libre".to_owned(),
        };

        assert_eq!(fields_of(&pasted), ["excerpt", "kind"]);

        let failed = JournalEvent::QuickReplyFailed {
            reason: QuickReplyFailure::PasteRefused {
                detail: "refusé".to_owned(),
            },
        };

        assert_eq!(fields_of(&failed), ["kind", "reason"]);
        assert_eq!(
            serde_json::to_string(&failed).expect("the event serialises"),
            r#"{"kind":"quickReplyFailed","reason":{"reason":"pasteRefused","detail":"refusé"}}"#
        );
    }

    #[test]
    fn a_quick_reply_that_failed_says_which_of_the_six_places_it_is_repaired_in() {
        let reasons = [
            QuickReplyFailure::OutsideGame,
            QuickReplyFailure::ForegroundUnknown {
                detail: "denied".to_owned(),
            },
            QuickReplyFailure::Gone,
            QuickReplyFailure::ClipboardRefused {
                detail: "denied".to_owned(),
            },
            QuickReplyFailure::PasteRefused {
                detail: "denied".to_owned(),
            },
            QuickReplyFailure::ClipboardNotGivenBack {
                detail: "denied".to_owned(),
            },
        ];

        let named = reasons
            .iter()
            .map(|reason| {
                serde_json::to_value(reason).expect("a reason serialises")["reason"]
                    .as_str()
                    .expect("a reason is tagged")
                    .to_owned()
            })
            .collect::<Vec<_>>();

        assert_eq!(
            named,
            [
                "outsideGame",
                "foregroundUnknown",
                "gone",
                "clipboardRefused",
                "pasteRefused",
                "clipboardNotGivenBack"
            ]
        );
    }

    #[test]
    fn an_unreadable_body_is_not_an_unknown_kind() {
        // Two repairs in two different files, so two outcomes. See
        // [`Outcome::BodyUnread`].
        assert_ne!(Outcome::BodyUnread, Outcome::KindUnknown);
    }
}
