use std::time::Duration;

use reqwest::Client;
use reqwest::RequestBuilder;
use reqwest::redirect::Policy;
use serde::Deserialize;
use serde::Serialize;
use serde::de::DeserializeOwned;
use serde::de::IgnoredAny;

use crate::app::relay::secret::BotToken;

const API_BASE: &str = "https://api.telegram.org/bot";

const TIMEOUT: Duration = Duration::from_secs(15);

pub type Result<T> = core::result::Result<T, TelegramError>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TelegramError {
    Network { detail: String },
    Refused { detail: String },
}

pub async fn first_chat(token: &BotToken) -> Result<Option<i64>> {
    let updates = ask::<Vec<Update>>(client()?.get(url(token, "getUpdates"))).await?;

    Ok(first_chat_of(&updates))
}

pub async fn send(client: &Client, token: &BotToken, chat_id: i64, text: &str) -> Result<()> {
    let outgoing = Outgoing { chat_id, text };

    ask::<IgnoredAny>(client.post(url(token, "sendMessage")).json(&outgoing)).await?;

    Ok(())
}

fn first_chat_of(updates: &[Update]) -> Option<i64> {
    updates
        .iter()
        .find_map(|update| update.message.as_ref().map(|message| message.chat.id))
}

fn url(token: &BotToken, method: &str) -> String {
    format!("{API_BASE}{}/{method}", token.as_str())
}

pub fn client() -> Result<Client> {
    Client::builder()
        .timeout(TIMEOUT)
        .redirect(Policy::none())
        .build()
        .map_err(stripped)
}

async fn ask<T: DeserializeOwned>(request: RequestBuilder) -> Result<T> {
    let response = request.send().await.map_err(stripped)?;
    let status = response.status();

    match response.json::<Answer<T>>().await {
        Ok(Answer {
            ok: true,
            result: Some(result),
            ..
        }) => Ok(result),
        Ok(answer) => Err(TelegramError::Refused {
            detail: answer.description.unwrap_or_else(|| status.to_string()),
        }),
        Err(_) => Err(TelegramError::Refused {
            detail: status.to_string(),
        }),
    }
}

fn stripped(error: reqwest::Error) -> TelegramError {
    TelegramError::Network {
        detail: error.without_url().to_string(),
    }
}

#[derive(Debug, Serialize)]
struct Outgoing<'a> {
    chat_id: i64,
    text: &'a str,
}

#[derive(Debug, Deserialize)]
struct Answer<T> {
    ok: bool,
    result: Option<T>,
    description: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Update {
    message: Option<Message>,
}

#[derive(Debug, Deserialize)]
struct Message {
    chat: Chat,
}

#[derive(Debug, Deserialize)]
struct Chat {
    id: i64,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn updates_of(json: &str) -> Answer<Vec<Update>> {
        serde_json::from_str(json).expect("an answer from Telegram")
    }

    #[test]
    fn a_bot_nobody_has_written_to_answers_with_no_chat() {
        let answer = updates_of(r#"{"ok":true,"result":[]}"#);

        assert!(answer.ok);
        assert_eq!(first_chat_of(&answer.result.expect("a result")), None);
    }

    #[test]
    fn the_pairing_takes_the_chat_of_the_first_message() {
        let answer = updates_of(
            r#"{"ok":true,"result":[
                {"update_id":1,"message":{"chat":{"id":-1001234567890}}},
                {"update_id":2,"message":{"chat":{"id":42}}}
            ]}"#,
        );

        assert_eq!(
            first_chat_of(&answer.result.expect("a result")),
            Some(-1_001_234_567_890)
        );
    }

    #[test]
    fn an_update_that_is_not_a_message_carries_no_chat_to_pair_with() {
        let answer = updates_of(
            r#"{"ok":true,"result":[
                {"update_id":1,"my_chat_member":{"date":0}},
                {"update_id":2,"message":{"chat":{"id":7}}}
            ]}"#,
        );

        assert_eq!(first_chat_of(&answer.result.expect("a result")), Some(7));
    }

    #[test]
    fn a_refused_token_is_told_apart_by_the_envelope_and_not_by_the_status() {
        let answer = updates_of(r#"{"ok":false,"error_code":401,"description":"Unauthorized"}"#);

        assert!(!answer.ok);
        assert!(answer.result.is_none());
        assert_eq!(answer.description.as_deref(), Some("Unauthorized"));
    }

    #[test]
    fn a_message_goes_up_as_plain_text_with_no_parse_mode() {
        let outgoing = Outgoing {
            chat_id: 42,
            text: "Alpha\nMessage privé",
        };

        let json = serde_json::to_string(&outgoing).expect("a message serialises");

        assert_eq!(json, r#"{"chat_id":42,"text":"Alpha\nMessage privé"}"#);
    }
}
