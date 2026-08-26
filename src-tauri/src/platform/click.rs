use std::collections::HashSet;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::AtomicU64;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::sync::Condvar;
use std::sync::Mutex;
use std::sync::PoisonError;
use std::sync::TryLockError;
use std::time::Duration;
use std::time::Instant;

use crate::platform::error::Result;
use crate::platform::window::WindowId;

pub const WATCHES_CLICKS: bool = cfg!(target_os = "windows");

#[cfg(target_os = "windows")]
pub const SWITCH_BUDGET_MS: u64 = 60;

#[cfg(not(target_os = "windows"))]
pub const SWITCH_BUDGET_MS: u64 = 120;

pub const SWITCH_CEILING_MS: u64 = 250;

pub const SWITCH_CEILING: Duration = Duration::from_millis(SWITCH_CEILING_MS);

const NOTHING_AWAITED: u64 = 0;

#[derive(Debug)]
pub enum ClickReport {
    Clicked { window: WindowId, at: Instant },

    ListeningLost,
}

pub type ClickSink = Arc<dyn Fn(ClickReport) + Send + Sync>;

pub trait ClickWatcher: Send + Sync {
    fn start(&self, gate: Arc<ClickGate>, sink: ClickSink) -> Result<()>;

    fn stop(&self);
}

#[derive(Debug, Default)]
pub struct ClickGate {
    switching: AtomicBool,
    awaited: AtomicU64,
    watched: Mutex<HashSet<WindowId>>,
    arrival: (Mutex<bool>, Condvar),
}

impl ClickGate {
    pub fn watch(&self, windows: &[WindowId]) {
        let mut watched = self.watched.lock().unwrap_or_else(PoisonError::into_inner);

        watched.clear();
        watched.extend(windows.iter().copied());
    }

    #[must_use]
    pub fn watches(&self, window: WindowId) -> bool {
        match self.watched.try_lock() {
            Ok(watched) => watched.contains(&window),
            Err(TryLockError::Poisoned(poisoned)) => poisoned.into_inner().contains(&window),
            Err(TryLockError::WouldBlock) => false,
        }
    }

    #[must_use]
    pub fn is_switching(&self) -> bool {
        self.switching.load(Ordering::Acquire)
    }

    pub fn close(&self) {
        self.switching.store(true, Ordering::Release);
    }

    pub fn open(&self) {
        self.awaited.store(NOTHING_AWAITED, Ordering::Release);
        self.switching.store(false, Ordering::Release);
    }

    pub fn expect(&self, window: WindowId) {
        let (arrived, _) = &self.arrival;

        *arrived.lock().unwrap_or_else(PoisonError::into_inner) = false;

        self.awaited.store(window.raw(), Ordering::Release);
    }

    pub fn note_foreground(&self, window: WindowId) {
        if self.awaited.load(Ordering::Acquire) != window.raw() {
            return;
        }

        let (arrived, alarm) = &self.arrival;

        *arrived.lock().unwrap_or_else(PoisonError::into_inner) = true;

        alarm.notify_all();
    }

    #[must_use]
    pub fn await_arrival(&self, ceiling: Duration) -> bool {
        let (arrived, alarm) = &self.arrival;
        let deadline = Instant::now() + ceiling;
        let mut guard = arrived.lock().unwrap_or_else(PoisonError::into_inner);

        while !*guard {
            let left = deadline.saturating_duration_since(Instant::now());

            if left.is_zero() {
                return false;
            }

            let (waited, _) = alarm
                .wait_timeout(guard, left)
                .unwrap_or_else(PoisonError::into_inner);

            guard = waited;
        }

        true
    }
}

#[cfg(test)]
mod tests {
    use std::thread;

    use super::*;

    fn window(raw: u64) -> WindowId {
        WindowId::from_raw(raw)
    }

    #[test]
    fn a_click_only_counts_on_a_window_the_scan_has_seen() {
        let gate = ClickGate::default();

        gate.watch(&[window(1), window(2)]);

        assert!(gate.watches(window(1)));
        assert!(!gate.watches(window(3)));
    }

    #[test]
    fn a_window_that_has_closed_stops_counting_at_the_next_turn() {
        let gate = ClickGate::default();

        gate.watch(&[window(1), window(2)]);
        gate.watch(&[window(2)]);

        assert!(!gate.watches(window(1)));
        assert!(gate.watches(window(2)));
    }

    #[test]
    fn the_door_starts_open_and_shuts_for_the_length_of_a_switch() {
        let gate = ClickGate::default();

        assert!(!gate.is_switching());

        gate.close();

        assert!(gate.is_switching());

        gate.open();

        assert!(!gate.is_switching());
    }

    #[test]
    fn a_switch_is_over_when_the_window_asked_for_is_the_one_in_front() {
        let gate = Arc::new(ClickGate::default());

        gate.expect(window(7));

        let noticed = thread::spawn({
            let gate = Arc::clone(&gate);

            move || {
                gate.note_foreground(window(7));
            }
        });

        assert!(gate.await_arrival(SWITCH_CEILING));

        noticed.join().expect("the foreground was noted");
    }

    #[test]
    fn another_window_coming_forward_is_not_the_switch_that_was_asked_for() {
        let gate = ClickGate::default();

        gate.expect(window(7));
        gate.note_foreground(window(8));

        assert!(!gate.await_arrival(Duration::from_millis(20)));
    }

    #[test]
    fn a_switch_nobody_asked_for_is_not_awaited_at_all() {
        let gate = ClickGate::default();

        gate.open();
        gate.note_foreground(window(7));

        assert!(!gate.await_arrival(Duration::from_millis(20)));
    }
}
