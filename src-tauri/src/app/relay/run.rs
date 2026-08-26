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

const HEADER: &str = "Multifus";
const PRIVATE_MESSAGE: &str = "message privé";
const DISCONNECTED: &str = "s’est déconnecté.";
const NOBODY_LEFT: &str = "Plus aucun personnage relayé n’est connecté.";
const TEST_LINE: &str = "Message d’essai.";
const TEST_PROOF: &str = "Un vrai message privé arrivera sous cette forme.";
const RELAY_ON: &str = "Vos messages privés arrivent ici.";
const RELAY_OFF: &str = "Vos messages privés n’arrivent plus ici.";
const NOBODY_YET: &str = "Aucun personnage relayé n’est connecté pour l’instant.";

const QUEUE_CAPACITY: usize = 64;

const TEST_COOLDOWN: Duration = Duration::from_secs(30);

const NO_TOKEN: &str = "no bot token in the keychain";

const SATURATED: &str = "the sending is more than a minute behind";

type RelayState = Mutex<Option<Running>>;

type KeeperState = Mutex<PlatformDisplayKeeper>;

#[derive(Debug)]
struct Running {
    outgoing: Sender<Message>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum Message {
    Private {
        nickname: String,
        body: Option<String>,
    },
    Notice {
        gone: Vec<String>,
        none_left: bool,
    },
    Enabled {
        none_online: bool,
    },
    Disabled,
    Test,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Queued {
    Taken,

    NoRelay,

    Saturated,
}

pub fn setup(app: &AppHandle, keeper: PlatformDisplayKeeper) {
    app.manage::<RelayState>(Mutex::new(None));
    app.manage::<KeeperState>(Mutex::new(keeper));
}

pub fn toggle(app: &AppHandle) {
    let active = lock(app).is_relay_active();

    set_active(app, !active, Surface::Tray);
}

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

fn is_cooling(app: &AppHandle) -> bool {
    lock(app)
        .since_last_test()
        .is_some_and(|since| since < TEST_COOLDOWN)
}

fn stop_of(surface: Surface) -> RelayStop {
    match surface {
        Surface::Tray => RelayStop::Tray,
        Surface::Window => RelayStop::Window,
    }
}

pub fn test(app: &AppHandle) {
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

pub fn stop(app: &AppHandle, reason: RelayStop) {
    lock(app).cancel_relay_start();

    if says_so(reason) {
        queue(app, Message::Disabled);
    }

    drop(running(app).take());

    lock(app).disable_relay(reason);
}

fn says_so(reason: RelayStop) -> bool {
    matches!(
        reason,
        RelayStop::Shortcut | RelayStop::Tray | RelayStop::Window
    )
}

pub fn stop_if_unready(app: &AppHandle, reason: RelayStop) {
    let unready = {
        let state = lock(app);

        (state.is_relay_active() || state.has_relay_start()) && !state.is_relay_ready()
    };

    if unready {
        stop(app, reason);
    }
}

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

pub fn follow_display(app: &AppHandle) -> bool {
    let wanted = {
        let state = lock(app);

        state.is_relay_active() && state.has_relayed_online()
    };

    let mut keeper = keeper(app);
    let was = keeper.is_awake();

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
        Err(error) => lock(app).log_unless_repeated(JournalEvent::DisplayAwakeFailed {
            detail: error.to_string(),
        }),
    }
}

async fn start(app: &AppHandle, surface: Surface, start_id: StartId) -> SwitchView {
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

    let client = match telegram::client() {
        Ok(client) => client,
        Err(error) => {
            return SwitchView::Failed {
                reason: report(app, &error),
            };
        }
    };

    let mut state = lock(app);

    if !state.is_relay_starting(start_id) {
        return SwitchView::Idle;
    }

    let (outgoing, incoming) = channel::<Message>(QUEUE_CAPACITY);

    *running(app) = Some(Running { outgoing });

    state.enable_relay(surface);

    let none_online = !state.has_relayed_online();

    drop(state);

    tauri::async_runtime::spawn(deliver(app.clone(), client, token, chat_id, incoming));

    queue(app, Message::Enabled { none_online });

    SwitchView::Idle
}

async fn send_once(app: &AppHandle, message: &Message) {
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

fn ready_chat(app: &AppHandle) -> Option<i64> {
    let state = lock(app);

    state.is_relay_ready().then(|| state.chat_id()).flatten()
}

async fn read_token() -> Result<BotToken, RelayFailure> {
    let read = tauri::async_runtime::spawn_blocking(secret::read).await;

    let detail = match read {
        Ok(Ok(Some(token))) => return Ok(token),
        Ok(Ok(None)) => NO_TOKEN.to_owned(),
        Ok(Err(error)) => error.to_string(),
        Err(error) => error.to_string(),
    };

    Err(RelayFailure::Keychain { detail })
}

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

fn could_not_write(app: &AppHandle, message: &Message, error: &TelegramError) {
    let reason = report(app, error);

    if matches!(message, Message::Test) {
        lock(app).set_test(TestView::Failed { reason });
    }

    runtime::emit_snapshot(app);
}

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

fn case_of(none_left: bool) -> NoticeCase {
    if none_left {
        NoticeCase::Both
    } else {
        NoticeCase::Disconnected
    }
}

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

fn queue(app: &AppHandle, message: Message) -> Queued {
    let Some(outgoing) = running(app).as_ref().map(|relay| relay.outgoing.clone()) else {
        return Queued::NoRelay;
    };

    if outgoing.try_send(message).is_ok() {
        return Queued::Taken;
    }

    lock(app).log_unless_repeated(JournalEvent::RelayFailed {
        reason: saturated(),
    });

    Queued::Saturated
}

fn saturated() -> RelayFailure {
    RelayFailure::Telegram {
        detail: SATURATED.to_owned(),
    }
}

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

fn running(app: &AppHandle) -> MutexGuard<'_, Option<Running>> {
    app.state::<RelayState>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}

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
    fn only_a_gesture_of_the_user_is_worth_a_last_word_on_the_phone() {
        assert!(says_so(RelayStop::Shortcut));
        assert!(says_so(RelayStop::Tray));
        assert!(says_so(RelayStop::Window));

        assert!(
            !says_so(RelayStop::NoLongerPaired),
            "there is no bot left to write to"
        );
        assert!(
            !says_so(RelayStop::NoRelayedCharacter),
            "nobody asked for this one"
        );
    }

    #[test]
    fn the_switch_says_which_of_the_two_places_it_was_moved_from() {
        assert_eq!(stop_of(Surface::Tray), RelayStop::Tray);
        assert_eq!(stop_of(Surface::Window), RelayStop::Window);
    }

    #[test]
    fn a_private_message_carries_the_nickname_and_the_kind_and_no_more() {
        let quiet = Message::Private {
            nickname: "Alpha".to_owned(),
            body: None,
        };

        assert_eq!(text_of(&quiet), "Multifus\nAlpha, message privé.");

        let spoken = Message::Private {
            nickname: "Alpha".to_owned(),
            body: Some("On se rejoint où ?".to_owned()),
        };

        assert_eq!(
            text_of(&spoken),
            "Multifus\nAlpha, message privé.\n\nOn se rejoint où ?"
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
            "Multifus\nMaître Forgeron s’est déconnecté.\nPlus aucun personnage relayé n’est connecté."
        );
        assert_eq!(case_of(true), NoticeCase::Both);
    }

    #[test]
    fn a_revoked_authorization_takes_every_character_in_one_message() {
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

        assert_eq!(text_of(&notice), "Multifus\nAlpha s’est déconnecté.");
        assert_eq!(case_of(false), NoticeCase::Disconnected);
    }

    #[test]
    fn the_test_message_names_no_character_and_carries_no_body() {
        assert_eq!(
            text_of(&Message::Test),
            "Multifus\nMessage d’essai.\n\nUn vrai message privé arrivera sous cette forme."
        );
        assert_eq!(written(&Message::Test), JournalEvent::RelayTestSent);
    }

    #[test]
    fn moving_the_switch_says_so_and_says_nothing_else() {
        assert_eq!(
            text_of(&Message::Enabled { none_online: false }),
            "Multifus\nVos messages privés arrivent ici."
        );
        assert_eq!(
            text_of(&Message::Disabled),
            "Multifus\nVos messages privés n’arrivent plus ici."
        );
    }

    #[test]
    fn switching_on_an_empty_relay_warns_under_the_confirmation() {
        let enabled = Message::Enabled { none_online: true };

        assert_eq!(
            text_of(&enabled),
            "Multifus\nVos messages privés arrivent ici.\nAucun personnage relayé n’est connecté pour l’instant."
        );
        assert_eq!(
            written(&enabled),
            JournalEvent::RelayNoticeSent {
                case: NoticeCase::Enabled
            }
        );
    }
}
