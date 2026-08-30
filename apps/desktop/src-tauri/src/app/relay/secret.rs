use std::error::Error;
use std::fmt;

use keyring::Entry;

const SERVICE: &str = "com.viclafouch.multifus";

const ACCOUNT: &str = "telegram-bot-token";

pub type Result<T> = core::result::Result<T, SecretError>;

#[derive(Clone, PartialEq, Eq)]
pub struct BotToken(String);

impl BotToken {
    #[must_use]
    pub fn new(token: impl Into<String>) -> Option<Self> {
        let token = token.into().trim().to_owned();

        if token.is_empty() {
            None
        } else {
            Some(Self(token))
        }
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Debug for BotToken {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("BotToken(hidden)")
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SecretError {
    pub operation: &'static str,
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

fn entry(operation: &'static str) -> Result<Entry> {
    Entry::new(SERVICE, ACCOUNT).map_err(|error| SecretError::new(operation, &error))
}

pub fn store(token: &BotToken) -> Result<()> {
    const OPERATION: &str = "storing the bot token";

    entry(OPERATION)?
        .set_password(token.as_str())
        .map_err(|error| SecretError::new(OPERATION, &error))
}

pub fn read() -> Result<Option<BotToken>> {
    const OPERATION: &str = "reading the bot token";

    match entry(OPERATION)?.get_password() {
        Ok(token) => Ok(BotToken::new(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(SecretError::new(OPERATION, &error)),
    }
}

pub fn erase() -> Result<()> {
    const OPERATION: &str = "erasing the bot token";

    match entry(OPERATION)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(SecretError::new(OPERATION, &error)),
    }
}

pub fn is_stored() -> Result<bool> {
    Ok(read()?.is_some())
}

#[cfg(test)]
mod tests {
    use std::sync::LazyLock;

    use super::*;

    static MOCK_KEYCHAIN: LazyLock<()> = LazyLock::new(|| {
        // The platform store poses itself on the first entry, so it goes first and the mock replaces it.
        let _ = Entry::store_status();

        keyring_core::set_default_store(keyring_core::mock::Store::new().expect("a mock keychain"));
    });

    #[test]
    fn the_bot_token_is_put_away_read_back_and_taken_out_for_good() {
        LazyLock::force(&MOCK_KEYCHAIN);

        let token = BotToken::new("123456:abcdef").expect("a token");

        erase().expect("a keychain that holds nothing is emptied all the same");
        store(&token).expect("the keychain takes the token");

        assert!(is_stored().expect("the keychain answers"));
        assert_eq!(read().expect("the keychain answers"), Some(token));

        erase().expect("the keychain gives the token up");

        assert_eq!(read().expect("the keychain answers"), None);
        assert!(!is_stored().expect("the keychain answers"));
    }

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
