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

const PAIRED_MESSAGE: &str =
    "Multifus\nVotre robot est relié.\nVous ne recevez pas encore vos messages privés.";

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

pub fn unpair(app: &AppHandle) {
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

async fn attempt(token: BotToken) -> Result<i64, PairingProblem> {
    let chat_id = telegram::first_chat(&token)
        .await
        .map_err(PairingProblem::from)?
        .ok_or(PairingProblem::NoChat)?;

    let client = telegram::client().map_err(PairingProblem::from)?;

    telegram::send(&client, &token, chat_id, PAIRED_MESSAGE)
        .await
        .map_err(PairingProblem::from)?;

    store(token).await?;

    Ok(chat_id)
}

async fn store(token: BotToken) -> Result<(), PairingProblem> {
    let stored = tauri::async_runtime::spawn_blocking(move || secret::store(&token)).await;

    let detail = match stored {
        Ok(Ok(())) => return Ok(()),
        Ok(Err(error)) => error.to_string(),
        Err(error) => error.to_string(),
    };

    Err(PairingProblem::Keychain { detail })
}

fn fail(app: &AppHandle, problem: PairingProblem) {
    let mut state = lock(app);

    if let Some(reason) = failure_of(&problem) {
        state.log(JournalEvent::RelayFailed { reason });
    }

    state.set_pairing(PairingView::Failed { problem });
}

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
    fn from(error: TelegramError) -> Self {
        match error {
            TelegramError::Refused { detail } => Self::TokenRefused { detail },
            TelegramError::Network { detail } => Self::Network { detail },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_paired_message_never_says_the_relay_is_running() {
        assert!(!PAIRED_MESSAGE.contains("connecté"));
        assert!(!PAIRED_MESSAGE.contains("activé"));
    }
}
