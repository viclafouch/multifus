use std::mem::take;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::thread;
use std::time::Duration;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

use reqwest::Client;
use reqwest::header::CONTENT_TYPE;
use reqwest::header::HeaderMap;
use reqwest::header::HeaderValue;
use serde_json::Value;
use serde_json::json;
use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;

const EUROPE: &str = "https://eu.aptabase.com";

const EUROPE_REGION: &str = "EU";

const EVENTS_PATH: &str = "/api/v0/events";

const APP_KEY_HEADER: &str = "App-Key";

const JSON: &str = "application/json";

const ANSWER_CEILING: Duration = Duration::from_secs(5);

const SESSION_SPREAD: u64 = 100_000_000;

const WORD_CEILING: usize = 180;

const SDK: &str = "multifus";

#[cfg(target_os = "macos")]
const OS_NAME: &str = "macOS";

#[cfg(target_os = "windows")]
const OS_NAME: &str = "Windows";

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
const OS_NAME: &str = "Linux";

#[cfg(target_os = "macos")]
const ENGINE_NAME: &str = "WebKit";

#[cfg(target_os = "windows")]
const ENGINE_NAME: &str = "WebView2";

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
const ENGINE_NAME: &str = "WebKitGTK";

#[derive(Debug)]
pub struct SystemParams {
    pub app_version: String,
    pub os_version: String,
    pub locale: String,
    pub engine_version: String,
}

#[derive(Debug)]
struct Poster {
    client: Client,
    endpoint: String,
}

#[derive(Debug)]
pub struct Aptabase {
    poster: Option<Poster>,
    sharing: AtomicBool,
    session: String,
    system: Value,
    queue: Mutex<Vec<Value>>,
}

impl Aptabase {
    #[must_use]
    pub fn new(key: &str, system: SystemParams) -> Self {
        Self {
            poster: poster(key),
            sharing: AtomicBool::new(false),
            session: new_session(),
            system: described(system),
            queue: Mutex::new(Vec::new()),
        }
    }

    pub fn share(&self, sharing: bool) {
        self.sharing.store(sharing, Ordering::Relaxed);
    }

    #[must_use]
    pub fn is_measuring(&self) -> bool {
        self.poster.is_some() && self.sharing.load(Ordering::Relaxed)
    }

    pub fn track(&self, name: &str, props: Value) {
        if !self.is_measuring() {
            return;
        }

        self.queued().push(json!({
            "timestamp": stamped_now(),
            "sessionId": self.session,
            "eventName": name,
            "systemProps": self.system,
            "props": props,
        }));
    }

    pub fn send_apart(self: &Arc<Self>) {
        let stats = Arc::clone(self);

        tauri::async_runtime::spawn(async move {
            stats.send().await;
        });
    }

    pub fn send_and_wait(self: &Arc<Self>) {
        let stats = Arc::clone(self);
        let sending = thread::spawn(move || {
            tauri::async_runtime::block_on(stats.send());
        });

        drop(sending.join());
    }

    async fn send(&self) {
        let Some(poster) = &self.poster else {
            return;
        };

        let events = self.drained();

        if events.is_empty() {
            return;
        }

        if let Some(kept) = post(poster, events).await {
            self.give_back(kept);
        }
    }

    fn queued(&self) -> MutexGuard<'_, Vec<Value>> {
        self.queue.lock().unwrap_or_else(PoisonError::into_inner)
    }

    fn drained(&self) -> Vec<Value> {
        take(&mut *self.queued())
    }

    fn give_back(&self, mut events: Vec<Value>) {
        let mut queue = self.queued();

        events.append(&mut queue);

        *queue = events;
    }
}

async fn post(poster: &Poster, events: Vec<Value>) -> Option<Vec<Value>> {
    let answered = poster
        .client
        .post(&poster.endpoint)
        .json(&events)
        .send()
        .await;

    let is_worth_keeping = match answered {
        Ok(answer) => answer.status().is_server_error(),
        Err(_) => true,
    };

    is_worth_keeping.then_some(events)
}

fn poster(key: &str) -> Option<Poster> {
    let endpoint = endpoint(key)?;
    let mut headers = HeaderMap::new();

    headers.insert(APP_KEY_HEADER, HeaderValue::from_str(key).ok()?);
    headers.insert(CONTENT_TYPE, HeaderValue::from_static(JSON));

    let client = Client::builder()
        .timeout(ANSWER_CEILING)
        .default_headers(headers)
        .build()
        .ok()?;

    Some(Poster { client, endpoint })
}

fn endpoint(key: &str) -> Option<String> {
    let parts = key.split('-').collect::<Vec<_>>();

    let [_, region, _] = parts.as_slice() else {
        return None;
    };

    if *region != EUROPE_REGION {
        return None;
    }

    Some(format!("{EUROPE}{EVENTS_PATH}"))
}

fn described(system: SystemParams) -> Value {
    let SystemParams {
        app_version,
        os_version,
        locale,
        engine_version,
    } = system;

    json!({
        "isDebug": cfg!(debug_assertions),
        "osName": OS_NAME,
        "osVersion": os_version,
        "locale": locale,
        "engineName": ENGINE_NAME,
        "engineVersion": engine_version,
        "appVersion": app_version,
        "sdkVersion": SDK,
    })
}

fn new_session() -> String {
    let since_epoch = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let spread = u64::from(since_epoch.subsec_nanos()) % SESSION_SPREAD;

    since_epoch
        .as_secs()
        .saturating_mul(SESSION_SPREAD)
        .saturating_add(spread)
        .to_string()
}

#[must_use]
pub fn shortened(word: &str) -> String {
    match word.char_indices().nth(WORD_CEILING) {
        Some((cut, _)) => word[..cut].to_owned(),
        None => word.to_owned(),
    }
}

fn stamped_now() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_european_key_reaches_the_european_ingestion() {
        assert_eq!(
            endpoint("A-EU-1234567890"),
            Some("https://eu.aptabase.com/api/v0/events".to_owned())
        );
    }

    #[test]
    fn a_build_without_a_key_measures_nothing() {
        let stats = Aptabase::new("", system_params());

        stats.share(true);
        stats.track("app_started", json!({}));

        assert!(!stats.is_measuring());
        assert!(stats.queued().is_empty());
    }

    #[test]
    fn the_box_unticked_measures_nothing_either() {
        let stats = measuring();

        stats.share(false);
        stats.track("app_started", json!({}));

        assert!(!stats.is_measuring());
        assert!(stats.queued().is_empty());
    }

    #[test]
    fn a_value_longer_than_the_server_keeps_is_cut_before_it_leaves() {
        let long = "a".repeat(WORD_CEILING + 20);

        assert_eq!(shortened(&long).len(), WORD_CEILING);
        assert_eq!(shortened("app/walk.rs:214"), "app/walk.rs:214");
    }

    #[test]
    fn cutting_a_value_never_splits_a_letter_in_two() {
        let accented = "é".repeat(WORD_CEILING + 20);
        let cut = shortened(&accented);

        assert_eq!(cut.chars().count(), WORD_CEILING);
        assert!(cut.chars().all(|letter| letter == 'é'));
    }

    #[test]
    fn a_key_of_any_other_region_measures_nothing() {
        assert_eq!(endpoint("A-US-1234567890"), None);
        assert_eq!(endpoint("A-DEV-1234567890"), None);
        assert_eq!(endpoint("nonsense"), None);
        assert_eq!(endpoint("A-EU-1234-5678"), None);
    }

    #[test]
    fn a_tracked_event_carries_the_envelope_the_server_asks_for() {
        let stats = measuring();

        stats.track("app_started", json!({ "launch": "by_hand" }));

        let queued = stats.queued();
        let event = queued.first().expect("one queued event");

        assert_eq!(event["eventName"], json!("app_started"));
        assert_eq!(event["props"], json!({ "launch": "by_hand" }));
        assert_eq!(event["systemProps"]["sdkVersion"], json!(SDK));
        assert_eq!(event["systemProps"]["appVersion"], json!("1.2.3"));
        assert_eq!(event["systemProps"]["locale"], json!("fr-FR"));
        assert!(
            event["timestamp"]
                .as_str()
                .is_some_and(|stamp| stamp.ends_with('Z')),
            "the timestamp is written in RFC 3339, in UTC"
        );
    }

    #[test]
    fn the_session_says_the_second_it_was_born_in() {
        let session = new_session()
            .parse::<u64>()
            .expect("a session made of digits");
        let born = session / SESSION_SPREAD;
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("a clock past 1970")
            .as_secs();

        assert!(
            born.abs_diff(now) <= 1,
            "the server reads the seconds back out of the session"
        );
    }

    #[test]
    fn events_given_back_keep_their_place_before_the_newer_ones() {
        let stats = measuring();

        stats.track("app_stopped", json!({}));
        stats.give_back(vec![json!({ "eventName": "app_started" })]);

        let queued = stats.queued();
        let names = queued
            .iter()
            .map(|event| event["eventName"].clone())
            .collect::<Vec<_>>();

        assert_eq!(names, vec![json!("app_started"), json!("app_stopped")]);
    }

    #[test]
    fn draining_the_queue_empties_it() {
        let stats = measuring();

        stats.track("app_started", json!({}));

        assert_eq!(stats.drained().len(), 1);
        assert!(stats.queued().is_empty());
    }

    fn measuring() -> Aptabase {
        drop(rustls::crypto::ring::default_provider().install_default());

        let stats = Aptabase::new("A-EU-1234567890", system_params());

        stats.share(true);

        stats
    }

    fn system_params() -> SystemParams {
        SystemParams {
            app_version: "1.2.3".to_owned(),
            os_version: "26.0.0".to_owned(),
            locale: "fr-FR".to_owned(),
            engine_version: "620.1.16".to_owned(),
        }
    }
}
