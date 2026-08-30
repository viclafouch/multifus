use std::cell::Cell;
use std::collections::HashSet;
use std::sync::Arc;
use std::sync::Condvar;
use std::sync::Mutex;
use std::sync::PoisonError;
use std::sync::TryLockError;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::AtomicU64;
use std::sync::atomic::Ordering;
use std::time::Duration;
use std::time::Instant;

use crate::platform::error::Result;
use crate::platform::window::ScreenPoint;
use crate::platform::window::WindowId;

pub const SETTLE: Duration = if cfg!(target_os = "windows") {
    Duration::from_millis(95)
} else {
    Duration::from_millis(40)
};

pub const SWITCH_CEILING: Duration = Duration::from_millis(250);

const NOTHING_AWAITED: u64 = 0;

#[derive(Debug, Clone, Copy)]
pub struct ClickedAt {
    pub window: WindowId,
    pub at: ScreenPoint,
}

#[derive(Debug)]
pub enum ClickReport {
    Clicked { clicked: ClickedAt },

    Foreground { window: WindowId },

    ListeningResumed,

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
    held: AtomicBool,
    held_back: AtomicU64,
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

    #[must_use]
    pub fn is_held(&self) -> bool {
        self.held.load(Ordering::Acquire)
    }

    #[must_use]
    pub fn clicks_held_back(&self) -> u64 {
        self.held_back.load(Ordering::Acquire)
    }

    fn hold_back(&self) {
        self.held_back.fetch_add(1, Ordering::AcqRel);
    }

    pub fn close(&self) {
        self.switching.store(true, Ordering::Release);
    }

    pub fn open(&self) {
        self.awaited.store(NOTHING_AWAITED, Ordering::Release);
        self.switching.store(false, Ordering::Release);
    }

    pub fn hold(&self, held: bool) {
        self.held.store(held, Ordering::Release);
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

pub enum Verdict {
    Pass,
    Eat,
}

#[derive(Debug, Clone, Copy)]
enum Press {
    Eaten,
    Ours(ClickedAt),
}

#[derive(Debug, Default)]
pub struct ClickJudge {
    pressed: Cell<Option<Press>>,
    pressed_right: Cell<bool>,
}

impl ClickJudge {
    pub fn press(&self, gate: &ClickGate, clicked: Option<ClickedAt>) -> Verdict {
        if gate.is_held() {
            gate.hold_back();
            self.pressed.set(Some(Press::Eaten));

            return Verdict::Eat;
        }

        let pressed = clicked
            .filter(|clicked| gate.watches(clicked.window))
            .map(|clicked| {
                if gate.is_switching() {
                    Press::Eaten
                } else {
                    Press::Ours(clicked)
                }
            });

        self.pressed.set(pressed);

        if matches!(pressed, Some(Press::Eaten)) {
            Verdict::Eat
        } else {
            Verdict::Pass
        }
    }

    pub fn release(&self, gate: &ClickGate, sink: &ClickSink) -> Verdict {
        let Some(pressed) = self.pressed.take() else {
            return Verdict::Pass;
        };

        let Press::Ours(clicked) = pressed else {
            return Verdict::Eat;
        };

        gate.close();

        (sink)(ClickReport::Clicked { clicked });

        Verdict::Pass
    }

    pub fn press_right(&self, gate: &ClickGate) -> Verdict {
        if !gate.is_held() {
            return Verdict::Pass;
        }

        gate.hold_back();
        self.pressed_right.set(true);

        Verdict::Eat
    }

    pub fn release_right(&self) -> Verdict {
        if self.pressed_right.take() {
            Verdict::Eat
        } else {
            Verdict::Pass
        }
    }
}

#[cfg(test)]
mod tests {
    use std::thread;

    use super::*;

    const CLICKED: u64 = 41;
    const ELSEWHERE: u64 = 42;

    type Reported = Arc<Mutex<Vec<WindowId>>>;

    fn window(raw: u64) -> WindowId {
        WindowId::from_raw(raw)
    }

    fn clicked_at(raw: u64) -> ClickedAt {
        ClickedAt {
            window: window(raw),
            at: ScreenPoint { x: 0.0, y: 0.0 },
        }
    }

    fn watching(gate: &ClickGate) -> (ClickJudge, ClickSink, Reported) {
        gate.watch(&[window(CLICKED)]);

        let reported: Reported = Arc::default();
        let sink: ClickSink = Arc::new({
            let reported = Arc::clone(&reported);

            move |report| {
                if let ClickReport::Clicked { clicked } = report {
                    reported
                        .lock()
                        .unwrap_or_else(PoisonError::into_inner)
                        .push(clicked.window);
                }
            }
        });

        (ClickJudge::default(), sink, reported)
    }

    fn windows_of(reported: &Reported) -> Vec<u64> {
        reported
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .iter()
            .map(|window| window.raw())
            .collect()
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
    fn the_wheel_holds_a_door_of_its_own_that_no_switch_lets_go_of() {
        let gate = ClickGate::default();

        gate.hold(true);
        gate.close();
        gate.open();

        assert!(
            gate.is_held(),
            "the switch is over, and the wheel is still open under the hand"
        );

        gate.hold(false);

        assert!(!gate.is_held());
    }

    #[test]
    fn a_click_the_wheel_holds_back_is_eaten_wherever_it_lands_and_counted() {
        let gate = ClickGate::default();
        let (judge, sink, reported) = watching(&gate);

        gate.hold(true);

        let press = judge.press(&gate, Some(clicked_at(ELSEWHERE)));
        let release = judge.release(&gate, &sink);

        assert!(matches!(press, Verdict::Eat));
        assert!(matches!(release, Verdict::Eat));
        assert_eq!(
            gate.clicks_held_back(),
            1,
            "the wheel reads this count, and closes on the click it names"
        );
        assert_eq!(
            windows_of(&reported),
            Vec::<u64>::new(),
            "a click the wheel took walks nobody"
        );
    }

    #[test]
    fn a_click_the_wheel_took_is_eaten_whole_even_once_the_wheel_has_closed() {
        let gate = ClickGate::default();
        let (judge, sink, reported) = watching(&gate);

        gate.hold(true);
        judge.press(&gate, Some(clicked_at(CLICKED)));
        gate.hold(false);

        assert!(
            matches!(judge.release(&gate, &sink), Verdict::Eat),
            "the wheel closed on the press, and the game must not see the half left"
        );
        assert_eq!(windows_of(&reported), Vec::<u64>::new());
    }

    #[test]
    fn the_wheel_only_counts_the_clicks_it_ate_itself() {
        let gate = ClickGate::default();
        let (judge, sink, _reported) = watching(&gate);

        judge.press(&gate, Some(clicked_at(CLICKED)));
        judge.release(&gate, &sink);

        gate.close();
        judge.press(&gate, Some(clicked_at(CLICKED)));
        judge.release(&gate, &sink);

        assert_eq!(gate.clicks_held_back(), 0);
    }

    #[test]
    fn the_right_button_is_eaten_whole_while_the_wheel_holds_the_door() {
        let gate = ClickGate::default();
        let judge = ClickJudge::default();

        gate.hold(true);

        let press = judge.press_right(&gate);

        gate.hold(false);

        assert!(matches!(press, Verdict::Eat));
        assert!(
            matches!(judge.release_right(), Verdict::Eat),
            "the wheel let go between the two halves, and the game sees neither"
        );
        assert_eq!(gate.clicks_held_back(), 1);
    }

    #[test]
    fn the_right_button_is_left_alone_with_no_wheel_open() {
        let gate = ClickGate::default();
        let judge = ClickJudge::default();

        assert!(matches!(judge.press_right(&gate), Verdict::Pass));
        assert!(matches!(judge.release_right(), Verdict::Pass));
        assert_eq!(gate.clicks_held_back(), 0);
    }

    #[test]
    fn the_wheel_letting_go_of_the_door_never_cuts_a_switch_short() {
        let gate = ClickGate::default();

        gate.close();
        gate.expect(window(7));
        gate.hold(true);
        gate.hold(false);

        assert!(
            gate.is_switching(),
            "the switch that was under way keeps the door to itself"
        );

        gate.note_foreground(window(7));

        assert!(gate.await_arrival(SWITCH_CEILING));
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

    #[test]
    fn a_whole_click_on_a_game_window_reaches_the_game_and_is_reported_once() {
        let gate = ClickGate::default();
        let (judge, sink, reported) = watching(&gate);

        let press = judge.press(&gate, Some(clicked_at(CLICKED)));
        let release = judge.release(&gate, &sink);

        assert!(matches!(press, Verdict::Pass));
        assert!(matches!(release, Verdict::Pass));
        assert_eq!(windows_of(&reported), vec![CLICKED]);
    }

    #[test]
    fn a_click_that_starts_during_a_switch_is_eaten_whole() {
        let gate = ClickGate::default();
        let (judge, sink, reported) = watching(&gate);

        gate.close();

        let press = judge.press(&gate, Some(clicked_at(CLICKED)));

        gate.open();

        let release = judge.release(&gate, &sink);

        assert!(matches!(press, Verdict::Eat));
        assert!(matches!(release, Verdict::Eat));
        assert_eq!(windows_of(&reported), Vec::<u64>::new());
    }

    #[test]
    fn a_release_belongs_to_the_window_the_button_went_down_on() {
        let gate = ClickGate::default();
        let (judge, sink, reported) = watching(&gate);

        judge.press(&gate, Some(clicked_at(CLICKED)));

        gate.watch(&[window(ELSEWHERE)]);

        judge.release(&gate, &sink);

        assert_eq!(windows_of(&reported), vec![CLICKED]);
    }

    #[test]
    fn a_click_outside_the_game_is_left_alone() {
        let gate = ClickGate::default();
        let (judge, sink, reported) = watching(&gate);

        let press = judge.press(&gate, Some(clicked_at(ELSEWHERE)));
        let release = judge.release(&gate, &sink);

        assert!(matches!(press, Verdict::Pass));
        assert!(matches!(release, Verdict::Pass));
        assert_eq!(windows_of(&reported), Vec::<u64>::new());
    }

    #[test]
    fn a_release_without_a_press_walks_nothing() {
        let gate = ClickGate::default();
        let (judge, sink, reported) = watching(&gate);

        let release = judge.release(&gate, &sink);

        assert!(matches!(release, Verdict::Pass));
        assert_eq!(windows_of(&reported), Vec::<u64>::new());
    }
}
