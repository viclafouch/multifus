//! The two calls the relay makes, and the only place a bot token reaches a URL.
//!
//! `getUpdates` once at the pairing and `sendMessage` for everything else, see
//! ADR 0007. Nothing here reads the configuration or the keychain: the caller
//! hands over the token and the chat, and gets back a plain answer.

use std::time::Duration;

use reqwest::Client;
use reqwest::RequestBuilder;
use serde::de::DeserializeOwned;
use serde::de::IgnoredAny;
use serde::Deserialize;
use serde::Serialize;

use crate::app::relay::secret::BotToken;

/// Where the calls go. The token goes in the path, which is what the note on
/// [`stripped`] is about.
const API_BASE: &str = "https://api.telegram.org/bot";

/// How long a call has to answer. Without it a connection that hangs leaves the
/// screen on « appariement en cours » for the rest of the session.
const TIMEOUT: Duration = Duration::from_secs(15);

/// Shorthand for every call of this module.
pub type Result<T> = core::result::Result<T, TelegramError>;

/// Why a call did not do what was asked. Two variants because they are repaired
/// in two places: the token is the user's, the network is not.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TelegramError {
    /// The request never left, or never came back.
    Network { detail: String },
    /// Telegram answered and turned it down. A refused token lands here.
    Refused { detail: String },
}

/// The chat of the first message somebody wrote to this bot, `None` when nobody
/// has yet.
///
/// No `offset` is passed, so nothing is consumed and clicking Connecter twice
/// works. Telegram keeps an unread update for 24 hours, and no longer.
pub async fn first_chat(token: &BotToken) -> Result<Option<i64>> {
    let updates = ask::<Vec<Update>>(client()?.get(url(token, "getUpdates"))).await?;

    Ok(first_chat_of(&updates))
}

/// Writes one message in a chat.
///
/// No `parse_mode` is asked for, ADR 0008: a game body carrying an asterisk or
/// an underscore would have Telegram reject the whole message rather than send
/// it plain.
pub async fn send(token: &BotToken, chat_id: i64, text: &str) -> Result<()> {
    let outgoing = Outgoing { chat_id, text };

    ask::<IgnoredAny>(client()?.post(url(token, "sendMessage")).json(&outgoing)).await?;

    Ok(())
}

/// The chat of the first update that carries a message.
///
/// A bot is also sent updates that carry none, a membership change for one, and
/// those have no chat to pair with.
fn first_chat_of(updates: &[Update]) -> Option<i64> {
    updates
        .iter()
        .find_map(|update| update.message.as_ref().map(|message| message.chat.id))
}

/// Where one method of one bot answers. The token is the path, hence [`stripped`].
fn url(token: &BotToken, method: &str) -> String {
    format!("{API_BASE}{}/{method}", token.as_str())
}

/// A client for one call. Built rather than shared: the pairing runs once, and
/// the sending of step 11b-2 gets a client of its own on its own thread.
fn client() -> Result<Client> {
    Client::builder().timeout(TIMEOUT).build().map_err(stripped)
}

/// Sends one request and reads the envelope every Telegram answer carries.
///
/// A refusal is still JSON and still carries `description`, which is the only
/// half of it worth reading, so the status code is the fallback and not the
/// answer.
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
        // Not JSON at all, which is a proxy or a captive portal answering in
        // Telegram's place. The status is all there is to say about it.
        Err(_) => Err(TelegramError::Refused {
            detail: status.to_string(),
        }),
    }
}

/// A transport failure with the URL taken out of it.
///
/// `reqwest` puts the URL in its `Display` and documents that it does; the token
/// is in that URL, and this detail ends up in a journal file that lives for
/// weeks.
fn stripped(error: reqwest::Error) -> TelegramError {
    TelegramError::Network {
        detail: error.without_url().to_string(),
    }
}

/// What goes up to `sendMessage`. Plain text and nothing else.
#[derive(Debug, Serialize)]
struct Outgoing<'a> {
    chat_id: i64,
    text: &'a str,
}

/// The envelope both answers come in.
#[derive(Debug, Deserialize)]
struct Answer<T> {
    ok: bool,
    result: Option<T>,
    /// What Telegram says about a refusal, in English, straight from the wire.
    description: Option<String>,
}

/// One update, cut down to the one field the pairing reads.
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
    /// Signed, since Telegram numbers a group negatively.
    id: i64,
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The three shapes the pairing screen has to tell apart, read as bytes on
    /// purpose: built from the types they would prove nothing about the wire.
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
        // A bot is sent these all the time, and reading a chat out of them would
        // pair the relay with a conversation nobody wrote in.
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
        // Measured, and in the plan: an invalid token is a 401, one without a
        // colon is a 404. Both answer with this shape.
        let answer = updates_of(
            r#"{"ok":false,"error_code":401,"description":"Unauthorized"}"#,
        );

        assert!(!answer.ok);
        assert!(answer.result.is_none());
        assert_eq!(answer.description.as_deref(), Some("Unauthorized"));
    }

    #[test]
    fn a_message_goes_up_as_plain_text_with_no_parse_mode() {
        // ADR 0008: asking for Markdown would have Telegram reject a whole
        // message over an asterisk somebody typed in the game.
        let outgoing = Outgoing {
            chat_id: 42,
            text: "Alpha\nMessage privé",
        };

        let json = serde_json::to_string(&outgoing).expect("a message serialises");

        assert_eq!(json, r#"{"chat_id":42,"text":"Alpha\nMessage privé"}"#);
    }
}
