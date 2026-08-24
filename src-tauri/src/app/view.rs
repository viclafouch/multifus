//! What React is given, and what it is allowed to ask for.
//!
//! One shape crosses to the interface, [`Snapshot`], and every command returns
//! it. There is no query for one character, no query for the shortcuts alone:
//! the whole dashboard is a handful of characters and eleven settings, so
//! sending all of it costs nothing and removes an entire class of bug where two
//! parts of the screen disagree about what is on disk.
//!
//! The types here are views and not the stored ones. [`crate::config::AutoFocus`]
//! is seven named booleans, which is right for a file and wrong for a screen that
//! draws the same row seven times; here it becomes a list keyed by
//! [`NotificationKind`], and the interface iterates. The same goes for the four
//! shortcuts.
//!
//! No text for the user crosses here. A path does, and a system error detail
//! does, because those are not sentences Multifus writes but facts it passes on.

use serde::Deserialize;
use serde::Serialize;

use crate::app::journal::JournalEntry;
use crate::app::journal::RelayFailure;
use crate::config::QuickReplyId;
use crate::domain::Gender;
use crate::domain::NotificationKind;
use crate::platform::ScreenSaverDelay;

impl From<ScreenSaverDelay> for ScreenSaverView {
    /// The boundary speaks in [`std::time::Duration`], which does not cross to
    /// React; everything else is the same three answers.
    fn from(delay: ScreenSaverDelay) -> Self {
        match delay {
            ScreenSaverDelay::Never => Self::Never,
            ScreenSaverDelay::After(after) => Self::After {
                seconds: after.as_secs(),
            },
            ScreenSaverDelay::Unknown => Self::Unknown,
        }
    }
}

/// Everything the five screens draw, in one piece.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    /// The version of the bundle, the one the changelog talks about.
    pub version: String,
    /// The system, its version and its architecture.
    ///
    /// It crosses for one reader only, the head of a copied journal. The spec of
    /// this journal names it next to the version: a transcript is read against a
    /// release *and* against an operating system, the macOS banner tree of ADR
    /// 0002 belonging to a version of it. The `Started` event carries the same
    /// string and is the first line to be pushed out of a full journal, which is
    /// exactly when somebody copies one.
    pub system: String,
    /// The roster, in cycle order.
    pub characters: Vec<CharacterView>,
    /// The four combinations, in the order of the table of perimetre.md.
    pub shortcuts: Vec<ShortcutView>,
    /// The quick replies, in the order of the file. Empty on a first launch.
    pub quick_replies: Vec<QuickReplyView>,
    /// The seven switches, in the order of the notification table. Each one
    /// carries its own state, never the outcome of the master and itself.
    pub auto_focus: Vec<AutoFocusView>,
    /// The AutoFocus is running at all. Off, the seven above still say what
    /// they will come back to.
    pub auto_focus_enabled: bool,
    /// A notification takes a window out of the Dock. Off, minimizing a client
    /// puts it out of the AutoFocus's reach, and only the AutoFocus's.
    pub wakes_minimized: bool,
    /// Multifus is asked to start with the session. What the user wants, not
    /// what the system currently holds, see [`crate::app::autostart`].
    pub start_at_login: bool,
    pub authorization: AuthorizationView,
    pub config: ConfigView,
    /// Where Multifus is with the version that is out, see [`crate::app::update`].
    pub update: UpdateView,
    /// What the relay screen draws. Never the bot token, ADR 0009.
    pub relay: RelayView,
    pub journal: Vec<JournalEntry>,
}

/// What the relay screen draws, and the whole of what crosses about the relay.
///
/// **No bot token, and there could not be one**: a read hands back a
/// [`crate::app::relay::BotToken`], which is not `Serialize`. The screen shows a
/// state and a button that unlinks, ADR 0009.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RelayView {
    /// The pairing has run on this machine, so a chat is known.
    ///
    /// **Answered from the configuration and never from the keychain.** This
    /// travels in every snapshot, several times a minute, and ADR 0009 reads the
    /// token once, when the relay is switched on, because a read can raise a
    /// system dialog. The chat and the token are written and erased together, so
    /// the file is a faithful answer to « has this ever been set up », which is
    /// the question the screen and the menu ask. Whether the token is still
    /// readable is a different question, asked at the one moment it matters.
    pub paired: bool,
    /// Whether the text of a private message goes out with the nickname and the
    /// kind. Unchecked by default, ADR 0008.
    pub send_body: bool,
    /// The relay is carrying messages right now. Never persisted: a Multifus
    /// coming back from a crash relays nothing until asked, see `docs/macos.md`.
    pub active: bool,
    /// A click on the tray item could switch it on: a bot is paired and somebody
    /// is ticked. Answered here rather than worked out again in the window,
    /// which would be the rule of ADR 0011 written down twice.
    pub ready: bool,
    /// What this machine's screen saver is set to, since it locks the session
    /// and the hold on the display is not documented to cover it.
    pub screen_saver: ScreenSaverView,
    /// Where the pairing got to, since it is two network round trips.
    pub pairing: PairingView,
    /// Where the switch got to, since switching on reads the keychain.
    pub switch: SwitchView,
    /// Where the last test message got to, which is the one thing this screen
    /// can answer that no amount of wording can: it really arrived.
    pub test: TestView,
}

/// Where the switch got to, which [`RelayView::active`] cannot say on its own.
///
/// A refused keychain used to leave the switch springing back with the card
/// still reading « tout est prêt », which was a lie on the one panel this screen
/// has to be trusted on. Never persisted, like [`PairingView`].
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum SwitchView {
    /// Nothing in flight, so `active` is the whole state.
    Idle,

    /// Switching on: the keychain, then the client.
    Starting,

    /// The last start did not take, and this says where to repair it.
    Failed { reason: RelayFailure },
}

/// Where the message the user asked for got to. A state and not a journal line:
/// the doubt it answers is « est-ce que ça marche », and a drawer to read to
/// find out is that doubt again. Never persisted, like [`PairingView`].
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum TestView {
    /// Nothing has been asked in this session.
    Idle,

    /// The message is on its way: the keychain, then Telegram.
    Working,

    /// Telegram took it, so the whole chain works. The telephone is the proof.
    Sent,

    /// It did not go out, and this says which of the three places to repair.
    Failed { reason: RelayFailure },

    /// One went out a moment ago and another may not yet. Not a failure, nothing
    /// having been asked of Telegram.
    ///
    /// **It carries no countdown, and a first version did.** A snapshot only
    /// goes out when something moved, so the number froze on screen and a live
    /// region kept announcing a figure that was wrong a second later.
    TooSoon,
}

/// What the screen saver of this machine is set to. Read once at startup and not
/// at each activation, see `docs/macos.md`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ScreenSaverView {
    /// It never starts on its own, so there is nothing to warn about.
    Never,

    /// It starts after this long, and the session locks with it. The interface
    /// turns the seconds into words, as it does with every other duration.
    After { seconds: u64 },

    /// The system said nothing, which is what an untouched setting looks like.
    /// Not a failure, and not a promise either.
    Unknown,
}

/// Whether a pairing or an unlinking is in flight, and how the last one ended.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum PairingView {
    /// Nothing in flight. [`RelayView::paired`] is then the whole state.
    Idle,

    /// A pairing or an unlinking is running: the network, then the keychain.
    Working,

    /// The last attempt did not go through, and this says where it is repaired.
    Failed { problem: PairingProblem },
}

/// Why a pairing did not go through.
///
/// Five and not one, because they are repaired in five different places, and a
/// screen that said « la connexion a échoué » would send the user to the wrong
/// one every time.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum PairingProblem {
    /// Nothing was pasted in the field.
    TokenBlank,

    /// Telegram would not take the token. A wrong one answers 401 and one
    /// without a colon answers 404; both land here.
    TokenRefused { detail: String },

    /// The token works and nobody has written to the bot yet. Not a failure but
    /// the second half of the pairing, which only the user can do.
    NoChat,

    /// The keychain would not keep the token, so nothing durable was written.
    Keychain { detail: String },

    /// The request never left, or never came back.
    Network { detail: String },
}

/// What Multifus knows about the version that is published.
///
/// There is no idle state: the check starts with the process, so the first
/// snapshot the interface ever sees is already [`UpdateView::Checking`], and a
/// screen never has to draw « nobody has asked yet ».
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum UpdateView {
    /// The endpoint is being asked right now.
    Checking,

    /// This version is the published one.
    UpToDate,

    /// A newer version is out, and nothing has been downloaded yet.
    Available { version: String },

    /// It is being downloaded and put in place. Multifus restarts on its own
    /// when this succeeds, so this state only ever ends in a restart or in
    /// [`UpdateView::Failed`].
    Installing,

    /// The endpoint could not be read, or the download did not go through.
    Failed { detail: String },
}

/// One of the five screens the window can show.
///
/// It crosses the bridge for one reason: the system tray offers to open any of
/// them, and which screen is on show is React's state. Nothing on this side
/// reads it back.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Screen {
    Characters,
    Shortcuts,
    AutoFocus,
    Relay,
    About,
}

impl Screen {
    /// The five of them, in the order of the rail. The relay comes before the
    /// about screen, being about the game rather than about the installation.
    pub const ALL: [Self; 5] = [
        Self::Characters,
        Self::Shortcuts,
        Self::AutoFocus,
        Self::Relay,
        Self::About,
    ];
}

/// One line of the roster.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterView {
    pub nickname: String,
    /// `null` until the user assigns one, which is what the two grouped actions
    /// need before they can do anything.
    pub gender: Option<Gender>,
    pub asleep: bool,
    /// A window bears this nickname right now.
    pub online: bool,
    /// The relay carries this character's private messages. Unrelated to the
    /// veille, which only takes a character out of the cycle. See ADR 0011.
    pub relayed: bool,
}

/// One of the four actions a combination can be bound to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ShortcutAction {
    Next,
    Previous,
    ToggleAsleep,
    Swap,
}

impl ShortcutAction {
    /// The four of them, in the order of the table of perimetre.md.
    pub const ALL: [Self; 4] = [Self::Next, Self::Previous, Self::ToggleAsleep, Self::Swap];
}

/// What a key combination fires: one of the four actions, or one quick reply.
///
/// A type of its own and not a fifth action, so [`ShortcutAction`] keeps its four
/// values and its exhaustive tables. Its three callers are in `app::shortcuts`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum Binding {
    Action { action: ShortcutAction },
    QuickReply { id: QuickReplyId },
}

/// One row of the shortcuts screen.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutView {
    pub action: ShortcutAction,
    /// The combination as the global shortcut plugin reads it, `null` for an
    /// action the user has cleared. Nothing here interprets it.
    pub accelerator: Option<String>,
    /// What the system answered when Multifus laid this combination down.
    pub status: ShortcutStatus,
}

/// One row of the quick replies panel.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuickReplyView {
    pub id: QuickReplyId,
    /// The line the user wrote, whole. The journal only ever gets an excerpt of
    /// it, see [`crate::app::journal::JournalEvent::QuickReplyPasted`].
    pub text: String,
    /// The combination as the plugin reads it, `null` for a quick reply nothing
    /// fires yet.
    pub accelerator: Option<String>,
    pub status: ShortcutStatus,
}

/// One combination laid on the system, whichever family it belongs to.
///
/// What the journal writes when the whole set goes up, and it carries no text:
/// that file is meant to be handed over.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BindingView {
    pub binding: Binding,
    pub accelerator: Option<String>,
    pub status: ShortcutStatus,
}

/// What became of one combination when it was handed to the system.
///
/// This type exists to keep the trap of the plan shut. Dracoon drops all of its
/// shortcuts and puts them back inside a `try` whose exception is swallowed, so
/// one impossible combination leaves the user with nothing bound and nothing
/// said. Here every action carries its own answer: one failure costs that
/// action and no other, and the screen reads the answer instead of assuming one.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ShortcutStatus {
    /// Multifus has not tried yet. Only ever visible in the instant between the
    /// window opening and the first registration.
    Pending,

    /// No combination is bound to this action.
    Unbound,

    /// The system took it.
    ///
    /// It is not a promise that the combination will ever fire. A shortcut the
    /// desktop already owns registers cleanly on macOS and is simply never
    /// delivered, see the note on [`crate::app::shortcuts`], so the wording on
    /// screen says what was accepted and not what will work.
    Registered,

    /// The stored text is not a combination this system can express.
    Invalid { detail: String },

    /// Something else of Multifus already answers to it, an action or a quick reply.
    /// The system keys a shortcut by the combination alone, so it cannot hold
    /// the two. The four actions are laid down first, so this always names the
    /// one that holds the keys.
    Duplicate { binding: Binding },

    /// The system turned it down. On Windows that is what another application
    /// holding the combination looks like.
    Refused { detail: String },
}

/// One row of the AutoFocus screen.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoFocusView {
    pub kind: NotificationKind,
    pub enabled: bool,
}

/// Whether the system lets Multifus work, and whether it is working.
///
/// Two booleans and not one. On macOS both hang on Accessibility, but being
/// allowed to listen and actually listening are different states, and the day
/// AutoFocus does not fire the difference is the first thing to look at.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorizationView {
    /// The system authorization is granted: Accessibility on macOS.
    pub granted: bool,
    /// The notification listening is running right now.
    pub listening: bool,
}

/// Where the configuration lives and what reading or writing it cost.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigView {
    /// The file `app_config_dir` named, shown so that the user can go and look.
    pub path: String,
    /// `null` when the configuration on screen is the one on disk.
    pub problem: Option<ConfigProblem>,
}

/// Why the configuration on screen is not the one on disk.
///
/// This exists so that the interface can say it. A roster that comes back empty
/// with no explanation is the failure mode this whole type is here to prevent.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ConfigProblem {
    /// The file is there and could not be read at all, a refused permission for
    /// instance. Nothing was moved: the bytes may well be perfectly good.
    Unreadable { detail: String },

    /// The bytes were read and are not a configuration. The file was set aside
    /// rather than overwritten, and `quarantined` says where it went.
    Malformed {
        detail: String,
        quarantined: Option<String>,
    },

    /// The bytes were read, are not a configuration, and the file could not even
    /// be moved out of the way.
    ///
    /// The one state of this list where doing nothing loses something: the file
    /// is still at the path the next save writes to. It outranks
    /// [`ConfigProblem::Malformed`] on the band for that reason, and `detail` is
    /// what the system said about the move rather than about the reading.
    NotSetAside { detail: String },

    /// The last save did not go through. What is on screen is right, what is on
    /// disk is behind.
    NotSaved { detail: String },
}
