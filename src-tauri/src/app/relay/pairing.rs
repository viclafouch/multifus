//! The pairing, which is the one moment a bot token enters multifus.
//!
//! A bot cannot write first, ADR 0007, so the chat only exists once the user has
//! written to it. The screen therefore asks for two things in two moments, and
//! this module is what happens when Connecter is pressed.
//!
//! **Nothing here runs on the thread that asked.** Two network round trips and a
//! keychain that ADR 0009 measured blocking on a system dialog: paying any of it
//! on the main thread would freeze the window. The command returns straight
//! away, and what comes back arrives through a snapshot, exactly as
//! [`crate::app::update`] does with its check.
//!
//! **The order proves the whole chain before anything is written down.** The
//! chat is read, a message is sent to it, and only then is the token put away.
//! So a pairing that reports success is one whose message has actually landed on
//! the telephone, rather than one that will fail at the first private message.

use tauri::AppHandle;

use crate::app::journal::JournalEvent;
use crate::app::journal::RelayFailure;
use crate::app::journal::RelayStop;
use crate::app::relay::run;
use crate::app::relay::secret;
use crate::app::relay::secret::BotToken;
use crate::app::relay::telegram;
use crate::app::relay::telegram::TelegramError;
use crate::app::runtime;
use crate::app::state::lock;
use crate::app::view::PairingProblem;
use crate::app::view::PairingView;

/// What the bot writes once the pairing has gone through. Never an « essai »,
/// which CONTEXT.md gives to the message the Relais screen asks for.
const PAIRED_MESSAGE: &str = "multifus\nLe relais est connecté.";

/// Pairs the relay with the bot whose token this is.
///
/// Returns as soon as the work is queued. A blank field is answered on the spot,
/// since there is nothing to ask Telegram about.
pub fn pair(app: &AppHandle, token: String) {
    let Some(token) = BotToken::new(token) else {
        fail(app, PairingProblem::TokenBlank);

        return;
    };

    lock(app).set_pairing(PairingView::Working);

    runtime::emit_snapshot(app);

    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        match attempt(token).await {
            Ok(chat_id) => {
                lock(&app).set_paired(chat_id);
            }
            Err(problem) => fail(&app, problem),
        }

        runtime::emit_snapshot(&app);
    });
}

/// Forgets the bot: the token leaves the keychain and the chat leaves the file.
///
/// The erasing is a keychain call like any other, so it goes off the calling
/// thread too. The chat is dropped whatever the keychain answered: a token that
/// cannot be erased is worth saying, and it is not a reason to keep pointing at
/// a conversation multifus can no longer write in.
pub fn unpair(app: &AppHandle) {
    // First, and not at the end: the sending task holds the token in memory, so
    // a relay left running would keep writing after the screen says it is gone.
    run::stop(app, RelayStop::NoLongerPaired);

    lock(app).set_pairing(PairingView::Working);

    runtime::emit_snapshot(app);

    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        let erased = tauri::async_runtime::spawn_blocking(secret::erase).await;

        if let Ok(Err(error)) = erased {
            lock(&app).log(JournalEvent::RelayFailed {
                reason: RelayFailure::Keychain {
                    detail: error.to_string(),
                },
            });
        }

        lock(&app).set_unpaired();

        runtime::emit_snapshot(&app);
    });
}

/// The pairing itself, off the main thread, holding no lock across an await.
async fn attempt(token: BotToken) -> Result<i64, PairingProblem> {
    let chat_id = telegram::first_chat(&token)
        .await
        .map_err(PairingProblem::from)?
        .ok_or(PairingProblem::NoChat)?;

    let client = telegram::client().map_err(PairingProblem::from)?;

    telegram::send(&client, &token, chat_id, PAIRED_MESSAGE)
        .await
        .map_err(PairingProblem::from)?;

    // Last, so that what is put away is a token that has just been proven to
    // write in that chat.
    store(token).await?;

    Ok(chat_id)
}

/// Puts the token in the keychain, on a thread that may block on a dialog.
async fn store(token: BotToken) -> Result<(), PairingProblem> {
    let stored = tauri::async_runtime::spawn_blocking(move || secret::store(&token)).await;

    let detail = match stored {
        Ok(Ok(())) => return Ok(()),
        Ok(Err(error)) => error.to_string(),
        // The thread died under it, which leaves nothing of the keychain to
        // quote. Still a keychain refusal, since that is the only work it had.
        Err(error) => error.to_string(),
    };

    Err(PairingProblem::Keychain { detail })
}

/// Says what went wrong, on screen and, when it is multifus's business, in the
/// journal.
///
/// A blank field and a bot nobody has written to are steps of the pairing that
/// the user finishes, not failures of the relay: they show on the screen where
/// they are repaired and leave the journal alone.
fn fail(app: &AppHandle, problem: PairingProblem) {
    let mut state = lock(app);

    if let Some(reason) = failure_of(&problem) {
        state.log(JournalEvent::RelayFailed { reason });
    }

    state.set_pairing(PairingView::Failed { problem });
}

/// The journal's reading of a pairing that did not go through, `None` for the
/// two that are not failures.
fn failure_of(problem: &PairingProblem) -> Option<RelayFailure> {
    match problem {
        PairingProblem::TokenBlank | PairingProblem::NoChat => None,
        PairingProblem::TokenRefused { detail } => Some(RelayFailure::Telegram {
            detail: detail.clone(),
        }),
        PairingProblem::Keychain { detail } => Some(RelayFailure::Keychain {
            detail: detail.clone(),
        }),
        PairingProblem::Network { detail } => Some(RelayFailure::Network {
            detail: detail.clone(),
        }),
    }
}

impl From<TelegramError> for PairingProblem {
    /// A refusal is the token, a transport failure is the network. Three repairs
    /// in three places, and this is where two of them are named.
    fn from(error: TelegramError) -> Self {
        match error {
            TelegramError::Refused { detail } => Self::TokenRefused { detail },
            TelegramError::Network { detail } => Self::Network { detail },
        }
    }
}
