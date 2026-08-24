//! The bot token, in the system keychain and nowhere else, see ADR 0009. Read
//! when the relay is switched on, never at launch, and never handed to React.

use std::error::Error;
use std::fmt;

use keyring::Entry;

/// The service the credential is filed under, the bundle identifier of Multifus.
const SERVICE: &str = "com.viclafouch.multifus";

/// The account inside that service. One token, one name.
const ACCOUNT: &str = "telegram-bot-token";

/// Shorthand for every call of this module.
pub type Result<T> = core::result::Result<T, SecretError>;

/// The token of the Telegram bot the relay writes through. Neither `Serialize`
/// nor printable, so no command can return one and no journal line can leak one.
#[derive(Clone, PartialEq, Eq)]
pub struct BotToken(String);

impl BotToken {
    /// Reads what the user pasted, trimmed. `None` on a blank one, which is an
    /// absence. Whether Telegram accepts it is the pairing call's answer.
    #[must_use]
    pub fn new(token: impl Into<String>) -> Option<Self> {
        let token = token.into().trim().to_owned();

        if token.is_empty() {
            None
        } else {
            Some(Self(token))
        }
    }

    /// The token, for the one caller that builds a request with it.
    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Debug for BotToken {
    /// Written by hand, since the derived one would print the secret.
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("BotToken(hidden)")
    }
}

/// Why the keychain did not do what was asked. Its own type so that an unreadable
/// token never reads as « Telegram refused »: three repairs, three places.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SecretError {
    /// What was being attempted, in this module's own words.
    pub operation: &'static str,
    /// What the keychain said about it.
    pub detail: String,
}

impl SecretError {
    fn new(operation: &'static str, error: &keyring::Error) -> Self {
        Self {
            operation,
            detail: error.to_string(),
        }
    }
}

impl fmt::Display for SecretError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{} failed: {}", self.operation, self.detail)
    }
}

impl Error for SecretError {}

/// The one entry Multifus ever opens.
fn entry(operation: &'static str) -> Result<Entry> {
    Entry::new(SERVICE, ACCOUNT).map_err(|error| SecretError::new(operation, &error))
}

/// Puts the token away, replacing whatever was there. Called by the pairing.
pub fn store(token: &BotToken) -> Result<()> {
    const OPERATION: &str = "storing the bot token";

    entry(OPERATION)?
        .set_password(token.as_str())
        .map_err(|error| SecretError::new(OPERATION, &error))
}

/// Reads the token, at the moment the relay is switched on. `Ok(None)` is a bot
/// nobody has paired yet; only a keychain that refused stops the activation.
pub fn read() -> Result<Option<BotToken>> {
    const OPERATION: &str = "reading the bot token";

    match entry(OPERATION)?.get_password() {
        Ok(token) => Ok(BotToken::new(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(SecretError::new(OPERATION, &error)),
    }
}

/// Takes the token out of the keychain, which is what unlinking does. Erasing
/// one that is not there is a success: nothing is stored, as asked.
pub fn erase() -> Result<()> {
    const OPERATION: &str = "erasing the bot token";

    match entry(OPERATION)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(SecretError::new(OPERATION, &error)),
    }
}

/// Whether a token is put away. Asked of the keychain and never of a boolean in
/// the file, which could say yes over a token that is gone.
pub fn is_stored() -> Result<bool> {
    Ok(read()?.is_some())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_blank_token_is_an_absence_not_a_token() {
        assert_eq!(BotToken::new(""), None);
        assert_eq!(BotToken::new("  \n "), None);
        assert_eq!(
            BotToken::new("  123456:abcdef  ").map(|token| token.as_str().to_owned()),
            Some("123456:abcdef".to_owned())
        );
    }

    #[test]
    fn a_token_never_prints_itself() {
        let token = BotToken::new("123456:abcdef").expect("a token");

        assert_eq!(format!("{token:?}"), "BotToken(hidden)");
    }

    #[test]
    fn a_keychain_refusal_says_which_operation_it_was() {
        let refusal = SecretError::new("reading the bot token", &keyring::Error::NoEntry);

        assert_eq!(
            refusal.to_string(),
            "reading the bot token failed: No matching credential found"
        );
    }
}
