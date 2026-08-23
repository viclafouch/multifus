//! The relay while it runs: the switch, the sending, the avis and the display
//! held awake. What it stands on is step 11b-2 of `docs/macos.md`.

use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::time::Duration;

use reqwest::Client;
use tauri::async_runtime::channel;
use tauri::async_runtime::Receiver;
use tauri::async_runtime::Sender;
use tauri::AppHandle;
use tauri::Manager;

use crate::app::journal::JournalEvent;
use crate::app::journal::NoticeCase;
use crate::app::journal::RelayFailure;
use crate::app::journal::RelayStop;
use crate::app::journal::Surface;
use crate::app::relay::secret;
use crate::app::relay::secret::BotToken;
use crate::app::relay::telegram;
use crate::app::relay::telegram::TelegramError;
use crate::app::runtime;
use crate::app::state::lock;
use crate::app::state::ScanChange;
use crate::app::state::StartId;
use crate::app::view::SwitchView;
use crate::app::view::TestView;
use crate::domain::GameNotification;
use crate::domain::NotificationKind;
use crate::platform::DisplayKeeper;
use crate::platform::PlatformDisplayKeeper;

// What the bot writes. French here for the reason `app::tray` gives at its top:
// a Telegram message is a surface React cannot draw.
const HEADER: &str = "multifus";
const PRIVATE_MESSAGE: &str = "message privé";
const DISCONNECTED: &str = "s’est déconnecté.";
const NOBODY_LEFT: &str = "Plus aucun personnage relayé n’est connecté.";
const TEST_LINE: &str = "Message d’essai.";
const TEST_PROOF: &str = "Un vrai message privé arrivera sous cette forme.";
const RELAY_ON: &str = "Relais activé.";
const RELAY_OFF: &str = "Relais désactivé.";
const NOBODY_YET: &str = "Aucun personnage relayé n’est connecté pour l’instant.";

/// How many messages may wait for Telegram at once. About a minute of backlog,
/// against a limit of roughly one message a second per chat.
const QUEUE_CAPACITY: usize = 64;

/// How long a test message holds the button. Counted from the arrival, so what
/// it protects is the telephone and not the click.
const TEST_COOLDOWN: Duration = Duration::from_secs(30);

/// What the keychain has to say when the chat says paired and no token is there.
const NO_TOKEN: &str = "no bot token in the keychain";

/// What the journal says when Telegram is further behind than the queue is deep.
const SATURATED: &str = "the sending is more than a minute behind";

/// The relay as it runs, `None` when it is off. Dropping it closes the queue,
/// which is the whole of how the sending stops.
type RelayState = Mutex<Option<Running>>;

/// The display keeper, which needs `&mut self` to raise and release its hold.
type KeeperState = Mutex<PlatformDisplayKeeper>;

/// The one handle the rest of multifus needs on a running relay.
#[derive(Debug)]
struct Running {
    outgoing: Sender<Message>,
}

/// One thing the relay has to write on the telephone.
#[derive(Debug, Clone, PartialEq, Eq)]
enum Message {
    /// A private message somebody really wrote, ADR 0008.
    Private {
        nickname: String,
        /// The text, `None` unless the user ticked the setting. The one place a
        /// notification body leaves the machine.
        body: Option<String>,
    },
    /// multifus talking about itself, ADR 0010. Never a notification body.
    Notice { gone: Vec<String>, none_left: bool },
    /// The switch was moved on. The confirmation somebody is standing there
    /// waiting for, and it carries the empty-relay warning rather than the
    /// warning being sent on its own, where it read as an alarm.
    Enabled { none_online: bool },
    /// The switch was moved off by one of the three gestures that say so.
    Disabled,
    /// The one message the user asks for. It carries no character and no body,
    /// so it proves the chain and tells nobody anything about the game.
    Test,
}

/// What the queue did with a message. Three and not a boolean: a relay that is
/// off and a queue a minute behind are answered in two different places.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Queued {
    /// The sending task has it, and the order is kept.
    Taken,

    /// No relay is running, which is an ordinary state and not a failure.
    NoRelay,

    /// A minute of backlog, or a sending task that is gone.
    Saturated,
}

/// Puts up the two slots the relay runs in. Neither holds anything yet.
pub fn setup(app: &AppHandle, keeper: PlatformDisplayKeeper) {
    app.manage::<RelayState>(Mutex::new(None));
    app.manage::<KeeperState>(Mutex::new(keeper));
}

/// The item of the system tray was clicked on a relay that is ready.
pub fn toggle(app: &AppHandle) {
    let active = lock(app).is_relay_active();

    set_active(app, !active, Surface::Tray);
}

/// One of the two switches was moved, and this says which one.
///
/// Returns straight away: switching on reads the keychain, which ADR 0009
/// measured blocking on a dialog, so it goes off this thread like `pairing::pair`.
/// The start is claimed before the task is spawned, see `docs/macos.md`, step 11b-2.
pub fn set_active(app: &AppHandle, active: bool, surface: Surface) {
    if !active {
        stop(app, stop_of(surface));

        runtime::emit_snapshot(app);

        return;
    }

    let Some(start_id) = lock(app).begin_relay_start() else {
        return;
    };

    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        let outcome = start(&app, surface, start_id).await;

        lock(&app).end_relay_start(start_id, outcome);

        runtime::emit_snapshot(&app);
    });
}

/// Whether a test went out recently enough that another has to wait.
fn is_cooling(app: &AppHandle) -> bool {
    lock(app)
        .since_last_test()
        .is_some_and(|since| since < TEST_COOLDOWN)
}

/// A hand on a switch, said as one of the five reasons a relay stops.
fn stop_of(surface: Surface) -> RelayStop {
    match surface {
        Surface::Tray => RelayStop::Tray,
        Surface::Window => RelayStop::Window,
    }
}

/// The user asked the relay to prove itself, from the Relais screen.
///
/// Through the live queue when there is one, which proves the sending task too;
/// off it, this is the one message that goes out with the relay stopped. Returns
/// straight away like [`toggle`], the keychain being read either way.
pub fn test(app: &AppHandle) {
    // The button stays clickable, the project forbids a dead one, so the two
    // ways to spam a telephone are turned away here with an answer each.
    if matches!(lock(app).test_view(), TestView::Working) {
        return;
    }

    if is_cooling(app) {
        lock(app).set_test(TestView::TooSoon);

        runtime::emit_snapshot(app);

        return;
    }

    lock(app).set_test(TestView::Working);

    runtime::emit_snapshot(app);

    // Asked of the queue and not of `running`, which a stop can empty between
    // the two: a saturated queue is the one way this button could sit on
    // « Envoi… » for ever, and a relay merely off is not that.
    match queue(app, Message::Test) {
        Queued::Taken => {}
        Queued::Saturated => {
            lock(app).set_test(TestView::Failed {
                reason: saturated(),
            });

            runtime::emit_snapshot(app);
        }
        Queued::NoRelay => {
            let app = app.clone();

            tauri::async_runtime::spawn(async move {
                send_once(&app, &Message::Test).await;
            });
        }
    }
}

/// Switches the relay off. Taking the running relay out of its slot closes the
/// queue and ends the sending task, and the display hold falls at the next scan.
pub fn stop(app: &AppHandle, reason: RelayStop) {
    // A start still reading the keychain is no longer wanted. Taken before the
    // queue, so a stop always wins over a start it crossed.
    lock(app).cancel_relay_start();

    // Queued before the queue is let go, since letting it go is what closes it.
    // The sending task drains what it already accepted before it ends. A relay
    // that was not running has no queue, and this is then a no-op.
    if says_so(reason) {
        queue(app, Message::Disabled);
    }

    drop(running(app).take());

    lock(app).disable_relay(reason);
}

/// Whether the telephone is told the relay stopped.
///
/// Only the three gestures. A bot being forgotten would be told in the very chat
/// multifus is erasing, and a last character unticked happens at the keyboard on
/// a relay that had nothing left to carry.
fn says_so(reason: RelayStop) -> bool {
    matches!(
        reason,
        RelayStop::Shortcut | RelayStop::Tray | RelayStop::Window
    )
}

/// Switches the relay off if it can no longer carry anything: the last relayed
/// character unticked, ADR 0011, or the bot forgotten.
pub fn stop_if_unready(app: &AppHandle, reason: RelayStop) {
    let unready = {
        let state = lock(app);

        // A start still reading the keychain counts: it holds the chat it read
        // before the wait, and nothing else would ever call it off.
        (state.is_relay_active() || state.has_relay_start()) && !state.is_relay_ready()
    };

    if unready {
        stop(app, reason);
    }
}

/// A game notification just arrived, on the watcher's own thread.
///
/// The private message alone, hardcoded, see perimetre.md. Nothing longer than a
/// queue push happens here: `platform::notification` forbids blocking the sink.
pub fn offer(app: &AppHandle, notification: &GameNotification, nickname: &str) {
    if notification.kind() != Some(NotificationKind::PrivateMessage) {
        return;
    }

    let body = {
        let state = lock(app);

        if !state.relays(nickname) {
            return;
        }

        state
            .sends_body()
            .then(|| notification.body.trim().to_owned())
    };

    queue(
        app,
        Message::Private {
            nickname: nickname.to_owned(),
            body,
        },
    );
}

/// What the relay has to say about the turn the scan just took in.
///
/// One message per scan: six relayed characters falling together would otherwise
/// be seven messages in one second, against a limit of about one. See ADR 0010.
pub fn announce(app: &AppHandle, change: &ScanChange) {
    if change.relayed_gone.is_empty() || !lock(app).is_relay_active() {
        return;
    }

    queue(
        app,
        Message::Notice {
            gone: change.relayed_gone.clone(),
            none_left: change.none_relayed_left,
        },
    );
}

/// Keeps the display in step with what the relay still has to hear, and says
/// whether it wrote a line.
///
/// The switch and the connected relayed characters, both: see CONTEXT.md. The
/// keeper is idempotent, so this keeps no boolean and the line is written on the
/// change alone.
pub fn follow_display(app: &AppHandle) -> bool {
    let wanted = {
        let state = lock(app);

        state.is_relay_active() && state.has_relayed_online()
    };

    let mut keeper = keeper(app);
    let was = keeper.is_awake();

    // Nothing to raise and nothing to let go. Without this, `platform::windows`
    // answers `NotImplemented` every three seconds until step 9.
    if !wanted && !was {
        return false;
    }

    let outcome = if wanted {
        keeper.keep_awake()
    } else {
        keeper.release()
    };
    let now = keeper.is_awake();

    drop(keeper);

    match outcome {
        Ok(()) if was == now => false,
        Ok(()) => {
            lock(app).log(JournalEvent::DisplayAwake { held: now });

            true
        }
        // Not a `RelayFailed`: the relay carries messages right up until the
        // session locks.
        Err(error) => lock(app).log_unless_repeated(JournalEvent::DisplayAwakeFailed {
            detail: error.to_string(),
        }),
    }
}

/// Switching on: the keychain, then the queue, then the avis of an empty relay.
///
/// Hands back what the switch has to say. A relay that was never ready is not a
/// failure and says nothing: the card already draws « incomplet ».
async fn start(app: &AppHandle, surface: Surface, start_id: StartId) -> SwitchView {
    // Asked again here rather than trusted from the menu, which is built from a
    // snapshot and can be a few seconds old.
    let Some(chat_id) = ready_chat(app) else {
        return SwitchView::Idle;
    };

    let token = match read_token().await {
        Ok(token) => token,
        Err(reason) => {
            lock(app).log(JournalEvent::RelayFailed {
                reason: reason.clone(),
            });

            return SwitchView::Failed { reason };
        }
    };

    // Before the queue exists and not inside the sending task: a task that gave
    // up on its client dropped the receiver while the queue was still open, and
    // whatever had been pushed in between was lost without an answer.
    let client = match telegram::client() {
        Ok(client) => client,
        Err(error) => {
            return SwitchView::Failed {
                reason: report(app, &error),
            };
        }
    };

    // The claim, the queue and the flag under one guard: a stop that crossed the
    // keychain must win, and it cannot if it lands between them.
    let mut state = lock(app);

    // A switch moved off while the dialog was open, or a later click took the
    // claim. Nothing is installed, and the stop that came in stands.
    if !state.is_relay_starting(start_id) {
        return SwitchView::Idle;
    }

    let (outgoing, incoming) = channel::<Message>(QUEUE_CAPACITY);

    *running(app) = Some(Running { outgoing });

    state.enable_relay(surface);

    // Every activation says so, because that is the answer somebody standing
    // with a telephone in hand is waiting for. The third trigger of ADR 0010
    // rides in it as a second line: sent alone it read as an alarm.
    let none_online = !state.has_relayed_online();

    drop(state);

    tauri::async_runtime::spawn(deliver(app.clone(), client, token, chat_id, incoming));

    queue(app, Message::Enabled { none_online });

    SwitchView::Idle
}

/// Sends one message with no relay running: the chat, the keychain, a client of
/// its own. A bot that was never paired writes nothing down, being a step left
/// to do rather than a failure, as `pairing` treats a blank field.
async fn send_once(app: &AppHandle, message: &Message) {
    // Read into a binding first: this mutex is not reentrant, and taking it
    // again from inside a `let ... else` whose scrutinee holds it is a deadlock.
    let paired_chat = lock(app).chat_id();

    let Some(chat_id) = paired_chat else {
        lock(app).set_test(TestView::Idle);

        runtime::emit_snapshot(app);

        return;
    };

    let token = match read_token().await {
        Ok(token) => token,
        Err(reason) => {
            let mut state = lock(app);

            // Not `log`: the button stays clickable by design, and five tries
            // against a locked keychain are one fact and not five.
            state.log_unless_repeated(JournalEvent::RelayFailed {
                reason: reason.clone(),
            });
            state.set_test(TestView::Failed { reason });
            drop(state);

            runtime::emit_snapshot(app);

            return;
        }
    };

    match telegram::client() {
        Ok(client) => write(app, &client, &token, chat_id, message).await,
        Err(error) => could_not_write(app, message, &error),
    }
}

/// The chat to write in, `None` when the relay is not ready to switch on.
fn ready_chat(app: &AppHandle) -> Option<i64> {
    let state = lock(app);

    state.is_relay_ready().then(|| state.chat_id()).flatten()
}

/// Reads the token, on a thread that may block on a system dialog.
///
/// A refusal stops the activation dead rather than letting somebody walk away
/// believing the relay is on, which is the measurement of ADR 0009. The reason
/// is handed back and not written down: one of the two callers has a screen.
async fn read_token() -> Result<BotToken, RelayFailure> {
    let read = tauri::async_runtime::spawn_blocking(secret::read).await;

    let detail = match read {
        Ok(Ok(Some(token))) => return Ok(token),
        // The file says a bot was paired here and the keychain has nothing. Only
        // the keychain is authoritative, ADR 0009.
        Ok(Ok(None)) => NO_TOKEN.to_owned(),
        Ok(Err(error)) => error.to_string(),
        Err(error) => error.to_string(),
    };

    Err(RelayFailure::Keychain { detail })
}

/// The sending, one message at a time, for as long as the relay is on.
///
/// One task and not one per message, which is what keeps the order. It ends when
/// the queue closes, after draining what was already accepted.
async fn deliver(
    app: AppHandle,
    client: Client,
    token: BotToken,
    chat_id: i64,
    mut incoming: Receiver<Message>,
) {
    while let Some(message) = incoming.recv().await {
        write(&app, &client, &token, chat_id, &message).await;
    }
}

/// Writes one message and says so in the journal, whichever way it went.
///
/// No retry on any answer: a relay that held messages back to send them later
/// would lie about the hour somebody was called.
async fn write(
    app: &AppHandle,
    client: &Client,
    token: &BotToken,
    chat_id: i64,
    message: &Message,
) {
    match telegram::send(client, token, chat_id, &text_of(message)).await {
        Ok(()) => wrote(app, message),
        Err(error) => could_not_write(app, message, &error),
    }
}

/// The message landed. No snapshot for the ordinary ones, the file has the line
/// and `offer`'s caller emitted one; a test is watched, so it gets one.
fn wrote(app: &AppHandle, message: &Message) {
    let mut state = lock(app);

    state.log(written(message));

    if !matches!(message, Message::Test) {
        return;
    }

    state.set_test(TestView::Sent);
    state.mark_test_sent();
    drop(state);

    runtime::emit_snapshot(app);
}

/// The message did not go out. A failure is always what the window has to be
/// told, so this one always emits its snapshot.
fn could_not_write(app: &AppHandle, message: &Message, error: &TelegramError) {
    let reason = report(app, error);

    if matches!(message, Message::Test) {
        lock(app).set_test(TestView::Failed { reason });
    }

    runtime::emit_snapshot(app);
}

/// What the journal says about a message that reached the telephone.
fn written(message: &Message) -> JournalEvent {
    match message {
        Message::Private { nickname, .. } => JournalEvent::RelaySent {
            nickname: nickname.clone(),
        },
        Message::Notice { none_left, .. } => JournalEvent::RelayNoticeSent {
            case: case_of(*none_left),
        },
        Message::Enabled { .. } => JournalEvent::RelayNoticeSent {
            case: NoticeCase::Enabled,
        },
        Message::Disabled => JournalEvent::RelayNoticeSent {
            case: NoticeCase::Disabled,
        },
        Message::Test => JournalEvent::RelayTestSent,
    }
}

/// Which of the two phrases of ADR 0010 the message carried, or both. A notice
/// always names at least one departure, [`announce`] refusing to send otherwise.
fn case_of(none_left: bool) -> NoticeCase {
    if none_left {
        NoticeCase::Both
    } else {
        NoticeCase::Disconnected
    }
}

/// The text that goes up to Telegram. The header names the sender, since this
/// chat holds two kinds of message.
fn text_of(message: &Message) -> String {
    let mut lines = vec![HEADER.to_owned()];

    match message {
        Message::Private { nickname, body } => {
            lines.push(format!("{nickname}, {PRIVATE_MESSAGE}."));

            if let Some(body) = body {
                lines.push(String::new());
                lines.push(body.clone());
            }
        }
        Message::Notice { gone, none_left } => {
            for nickname in gone {
                lines.push(format!("{nickname} {DISCONNECTED}"));
            }

            if *none_left {
                lines.push(NOBODY_LEFT.to_owned());
            }
        }
        Message::Enabled { none_online } => {
            lines.push(RELAY_ON.to_owned());

            if *none_online {
                lines.push(NOBODY_YET.to_owned());
            }
        }
        Message::Disabled => lines.push(RELAY_OFF.to_owned()),
        Message::Test => {
            lines.push(TEST_LINE.to_owned());
            lines.push(String::new());
            lines.push(TEST_PROOF.to_owned());
        }
    }

    lines.join("\n")
}

/// Puts a message in the queue, from whichever thread noticed it. A relay that is
/// off has no queue, which is an ordinary state and not a failure.
fn queue(app: &AppHandle, message: Message) -> Queued {
    let Some(outgoing) = running(app).as_ref().map(|relay| relay.outgoing.clone()) else {
        return Queued::NoRelay;
    };

    if outgoing.try_send(message).is_ok() {
        return Queued::Taken;
    }

    // Said once rather than once per message, since a burst is one fact.
    lock(app).log_unless_repeated(JournalEvent::RelayFailed {
        reason: saturated(),
    });

    Queued::Saturated
}

/// The queue would not take the message: it is a minute behind, or the sending
/// task is gone. One reason for both, since one is not repaired without the other.
fn saturated() -> RelayFailure {
    RelayFailure::Telegram {
        detail: SATURATED.to_owned(),
    }
}

/// Writes down what the relay could not do, in the words of the place it is
/// repaired in, and hands the reason back for the caller that has a screen to
/// answer too. Never formatted any other way, see [`telegram`].
fn report(app: &AppHandle, error: &TelegramError) -> RelayFailure {
    let reason = match error {
        TelegramError::Refused { detail } => RelayFailure::Telegram {
            detail: detail.clone(),
        },
        TelegramError::Network { detail } => RelayFailure::Network {
            detail: detail.clone(),
        },
    };

    lock(app).log_unless_repeated(JournalEvent::RelayFailed {
        reason: reason.clone(),
    });

    reason
}

/// The running relay, taken even if a previous holder panicked. See the note on
/// [`crate::app::state::lock`].
fn running(app: &AppHandle) -> MutexGuard<'_, Option<Running>> {
    app.state::<RelayState>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}

/// The display keeper, taken the same way.
fn keeper(app: &AppHandle) -> MutexGuard<'_, PlatformDisplayKeeper> {
    app.state::<KeeperState>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_private_message_carries_the_nickname_and_the_kind_and_no_more() {
        let quiet = Message::Private {
            nickname: "Alpha".to_owned(),
            body: None,
        };

        assert_eq!(text_of(&quiet), "multifus\nAlpha, message privé.");

        let spoken = Message::Private {
            nickname: "Alpha".to_owned(),
            body: Some("On se rejoint où ?".to_owned()),
        };

        assert_eq!(
            text_of(&spoken),
            "multifus\nAlpha, message privé.\n\nOn se rejoint où ?"
        );
    }

    #[test]
    fn a_scan_that_empties_the_relay_says_both_phrases_in_one_message() {
        let gone = vec!["Maître Forgeron".to_owned()];

        let both = Message::Notice {
            gone: gone.clone(),
            none_left: true,
        };

        assert_eq!(
            text_of(&both),
            "multifus\nMaître Forgeron s’est déconnecté.\nPlus aucun personnage relayé n’est connecté."
        );
        assert_eq!(case_of(true), NoticeCase::Both);
    }

    #[test]
    fn a_revoked_authorization_takes_every_character_in_one_message() {
        // The case that decided the grouping: seven messages in one second
        // against a limit of about one a second.
        let gone = ["Alpha", "Bravo", "Charlie"].map(str::to_owned).to_vec();

        let notice = Message::Notice {
            gone: gone.clone(),
            none_left: true,
        };

        assert_eq!(text_of(&notice).lines().count(), 5);
        assert_eq!(case_of(true), NoticeCase::Both);
    }

    #[test]
    fn a_departure_that_leaves_somebody_behind_says_only_that() {
        let notice = Message::Notice {
            gone: vec!["Alpha".to_owned()],
            none_left: false,
        };

        assert_eq!(text_of(&notice), "multifus\nAlpha s’est déconnecté.");
        assert_eq!(case_of(false), NoticeCase::Disconnected);
    }

    #[test]
    fn the_test_message_names_no_character_and_carries_no_body() {
        assert_eq!(
            text_of(&Message::Test),
            "multifus\nMessage d’essai.\n\nUn vrai message privé arrivera sous cette forme."
        );
        assert_eq!(written(&Message::Test), JournalEvent::RelayTestSent);
    }

    #[test]
    fn moving_the_switch_says_so_and_says_nothing_else() {
        // What used to go out here was the bare « plus personne de relayé », the
        // third trigger of ADR 0010, and on a telephone it read as an alarm.
        assert_eq!(
            text_of(&Message::Enabled { none_online: false }),
            "multifus\nRelais activé."
        );
        assert_eq!(text_of(&Message::Disabled), "multifus\nRelais désactivé.");
    }

    #[test]
    fn switching_on_an_empty_relay_warns_under_the_confirmation() {
        // The third trigger of ADR 0010, kept: no transition will ever come to
        // say it. It is a second line now, and not the whole message.
        let enabled = Message::Enabled { none_online: true };

        assert_eq!(
            text_of(&enabled),
            "multifus\nRelais activé.\nAucun personnage relayé n’est connecté pour l’instant."
        );
        assert_eq!(
            written(&enabled),
            JournalEvent::RelayNoticeSent {
                case: NoticeCase::Enabled
            }
        );
    }
}
