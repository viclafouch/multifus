use std::sync::Condvar;
use std::sync::Mutex;
use std::sync::PoisonError;
use std::thread;
use std::time::Duration;

#[derive(Debug, Default)]
pub struct Alarm {
    asked: Mutex<bool>,
    alarm: Condvar,
}

impl Alarm {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            asked: Mutex::new(false),
            alarm: Condvar::new(),
        }
    }

    pub fn wake(&self) {
        *self.asked.lock().unwrap_or_else(PoisonError::into_inner) = true;

        self.alarm.notify_all();
    }

    pub fn wait(&self, rest: Duration, interval: Duration) {
        thread::sleep(rest);

        let mut guard = self.asked.lock().unwrap_or_else(PoisonError::into_inner);

        if !*guard {
            let (waited, _) = self
                .alarm
                .wait_timeout(guard, interval.saturating_sub(rest))
                .unwrap_or_else(PoisonError::into_inner);

            guard = waited;
        }

        *guard = false;
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;
    use std::time::Instant;

    use super::*;

    const A_REST: Duration = Duration::from_millis(40);

    const AN_INTERVAL: Duration = Duration::from_millis(400);

    #[test]
    fn a_turn_nobody_asked_for_waits_the_whole_interval() {
        let alarm = Alarm::new();
        let start = Instant::now();

        alarm.wait(A_REST, AN_INTERVAL);

        assert!(
            start.elapsed() >= AN_INTERVAL,
            "the beat is the interval, rest included"
        );
    }

    #[test]
    fn a_wake_during_a_turn_is_kept_and_starts_the_next_one() {
        let alarm = Alarm::new();

        alarm.wake();

        let start = Instant::now();

        alarm.wait(A_REST, AN_INTERVAL);

        assert!(
            start.elapsed() < AN_INTERVAL,
            "a wake asked for before the wait is not lost"
        );
    }

    #[test]
    fn a_wake_never_starts_a_turn_before_the_rest_is_over() {
        let alarm = Alarm::new();

        alarm.wake();

        let start = Instant::now();

        alarm.wait(A_REST, AN_INTERVAL);

        assert!(
            start.elapsed() >= A_REST,
            "a burst of wakes may not run the turns back to back"
        );
    }

    #[test]
    fn a_wake_landing_during_the_rest_is_kept() {
        let alarm = Arc::new(Alarm::new());
        let waking = Arc::clone(&alarm);
        let woken = thread::spawn(move || {
            thread::sleep(A_REST / 2);
            waking.wake();
        });
        let start = Instant::now();

        alarm.wait(A_REST, AN_INTERVAL);

        assert!(
            start.elapsed() < AN_INTERVAL,
            "the rest holds a wake back, it never eats it"
        );

        drop(woken.join());
    }

    #[test]
    fn a_turn_that_ran_on_a_wake_leaves_no_wake_behind_it() {
        let alarm = Alarm::new();

        alarm.wake();
        alarm.wait(A_REST, AN_INTERVAL);

        let start = Instant::now();

        alarm.wait(A_REST, AN_INTERVAL);

        assert!(
            start.elapsed() >= AN_INTERVAL,
            "a wake serves one turn, not every turn after it"
        );
    }

    #[test]
    fn a_wake_reaches_every_waiter_and_not_only_the_first() {
        let alarm = Arc::new(Alarm::new());
        let waiters = [(), ()].map(|()| {
            let waiting = Arc::clone(&alarm);

            thread::spawn(move || {
                let start = Instant::now();

                waiting.wait(Duration::ZERO, AN_INTERVAL);

                start.elapsed()
            })
        });

        thread::sleep(A_REST);
        alarm.wake();

        for waiter in waiters {
            assert!(
                waiter.join().expect("a waiter") < AN_INTERVAL,
                "a follower left from an older opening must not eat the wake of the live one"
            );
        }
    }
}
