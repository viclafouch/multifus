use std::collections::HashMap;
use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::sync::mpsc;
use std::sync::mpsc::Sender;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::PoisonError;
use std::thread;
use std::time::Instant;

use tauri::AppHandle;
use tauri::Manager;

use crate::app::banner;
use crate::app::journal::JournalEvent;
use crate::app::journal::WalkFrom;
use crate::app::journal::WalkIdle;
use crate::app::journal::Work;
use crate::app::state::lock;
use crate::app::view::BannerCharacter;
use crate::platform::ClickGate;
use crate::platform::ClickReport;
use crate::platform::ClickSink;
use crate::platform::ClickWatcher;
use crate::platform::ClickedAt;
use crate::platform::PlatformClickWatcher;
use crate::platform::PlatformError;
use crate::platform::PlatformWindowManager;
use crate::platform::WindowId;
use crate::platform::WindowManager;
use crate::platform::SETTLE;
use crate::platform::SWITCH_CEILING;

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct WalkPlan {
    pub watched: Vec<WindowId>,
    pub next: HashMap<WindowId, WindowId>,
}

#[derive(Debug)]
enum WalkStep {
    Clicked { clicked: ClickedAt },
    Foreground { window: WindowId },
    ListeningResumed,
    ListeningLost,
}

#[derive(Debug)]
pub struct Walk {
    gate: Arc<ClickGate>,
    plan: Mutex<WalkPlan>,
    steps: Sender<WalkStep>,
}

impl Walk {
    fn watches(&self, window: WindowId) -> bool {
        self.plan
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .watched
            .contains(&window)
    }

    fn next_after(&self, clicked: WindowId) -> Option<WindowId> {
        self.plan
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .next
            .get(&clicked)
            .copied()
    }
}

pub fn setup(app: &AppHandle) {
    let (steps, taken) = mpsc::channel::<WalkStep>();
    let gate = Arc::new(ClickGate::default());

    let spawned = thread::Builder::new()
        .name("multifus-walk".to_owned())
        .spawn({
            let app = app.clone();
            let gate = Arc::clone(&gate);

            move || {
                for step in taken {
                    if catch_unwind(AssertUnwindSafe(|| take(&app, step))).is_err() {
                        gate.open();

                        lock(&app).log_unless_repeated(JournalEvent::Panicked { work: Work::Walk });
                    }
                }
            }
        });

    if let Err(error) = spawned {
        lock(app).log(JournalEvent::WalkListeningRefused {
            detail: error.to_string(),
        });
    }

    app.manage(Walk {
        gate,
        plan: Mutex::default(),
        steps,
    });
    app.manage(PlatformClickWatcher::new());
}

pub fn set_enabled(app: &AppHandle, enabled: bool, from: WalkFrom) {
    if lock(app).is_walk_enabled() == enabled {
        return;
    }

    if enabled {
        if let Err(error) = listen(app) {
            lock(app).log(JournalEvent::WalkListeningRefused {
                detail: error.to_string(),
            });

            return;
        }
    } else {
        app.state::<PlatformClickWatcher>().stop();
    }

    let here = enabled.then(|| who_is_here(app)).flatten();

    if enabled {
        lock(app).set_banner_character(here.clone());
    }

    lock(app).set_walk_enabled(enabled, from);

    banner::follow_walk(app, enabled, here.is_some());
}

fn who_is_here(app: &AppHandle) -> Option<BannerCharacter> {
    let found = app
        .state::<PlatformWindowManager>()
        .foreground_game_window()
        .ok()
        .flatten()?;

    lock(app).banner_character_of(found.id())
}

pub fn toggle(app: &AppHandle, from: WalkFrom) {
    let enabled = lock(app).is_walk_enabled();

    set_enabled(app, !enabled, from);
}

pub fn refresh(app: &AppHandle) {
    let plan = {
        let state = lock(app);

        state.is_walk_enabled().then(|| state.walk_plan())
    };

    if let Some(plan) = plan {
        remember(app, plan);
    }
}

fn remember(app: &AppHandle, plan: WalkPlan) {
    let walk = app.state::<Walk>();

    walk.gate.watch(&plan.watched);

    *walk.plan.lock().unwrap_or_else(PoisonError::into_inner) = plan;
}

fn listen(app: &AppHandle) -> Result<(), PlatformError> {
    let (gate, steps) = {
        let walk = app.state::<Walk>();

        (Arc::clone(&walk.gate), walk.steps.clone())
    };

    app.state::<PlatformClickWatcher>()
        .start(Arc::clone(&gate), sink_of(gate, steps))?;

    remember(app, lock(app).walk_plan());

    Ok(())
}

fn sink_of(gate: Arc<ClickGate>, steps: Sender<WalkStep>) -> ClickSink {
    Arc::new(move |report| {
        let step = match report {
            ClickReport::Clicked { clicked } => WalkStep::Clicked { clicked },
            ClickReport::Foreground { window } => WalkStep::Foreground { window },
            ClickReport::ListeningResumed => WalkStep::ListeningResumed,
            ClickReport::ListeningLost => WalkStep::ListeningLost,
        };

        if steps.send(step).is_err() {
            gate.open();
        }
    })
}

fn take(app: &AppHandle, step: WalkStep) {
    match step {
        WalkStep::Clicked { clicked } => switch(app, clicked),
        WalkStep::Foreground { window } => {
            banner::follow_foreground(app, app.state::<Walk>().watches(window));
        }
        WalkStep::ListeningResumed => {
            lock(app).log(JournalEvent::WalkListeningResumed);
        }
        WalkStep::ListeningLost => {
            lock(app).log(JournalEvent::WalkListeningLost);

            set_enabled(app, false, WalkFrom::ListeningLost);
        }
    }
}

fn window_under(app: &AppHandle, clicked: ClickedAt) -> Option<WindowId> {
    let under = app
        .state::<PlatformWindowManager>()
        .window_at(clicked.at)
        .ok()
        .flatten()?;

    app.state::<Walk>().watches(under).then_some(under)
}

fn switch(app: &AppHandle, clicked: ClickedAt) {
    let asked_at = Instant::now();
    let walk = app.state::<Walk>();

    let Some(under) = window_under(app, clicked) else {
        walk.gate.open();

        return;
    };

    let Some(target) = walk.next_after(under) else {
        walk.gate.open();

        lock(app).log_unless_repeated(JournalEvent::WalkIdle {
            reason: WalkIdle::NobodyInCycle,
        });

        banner::step(app, None);

        return;
    };

    if target == under {
        walk.gate.open();

        return;
    }

    thread::sleep(SETTLE.saturating_sub(asked_at.elapsed()));

    walk.gate.expect(target);

    let asked = app.state::<PlatformWindowManager>().focus_fast(target);
    let landed = asked.is_ok() && walk.gate.await_arrival(SWITCH_CEILING);

    walk.gate.open();

    let arrived = {
        let mut state = lock(app);

        match asked {
            Err(error) => {
                state.log_unless_repeated(JournalEvent::WalkSwitchFailed {
                    detail: error.to_string(),
                });
            }
            Ok(()) if !landed => {
                state.log_unless_repeated(JournalEvent::WalkIdle {
                    reason: WalkIdle::TooSlow,
                });
            }
            Ok(()) => {}
        }

        state.banner_character_of(target)
    };

    banner::step(app, arrived);
}

#[cfg(test)]
mod tests {
    use std::sync::mpsc::Receiver;

    use super::*;
    use crate::platform::ScreenPoint;

    fn id(raw: u64) -> WindowId {
        WindowId::from_raw(raw)
    }

    fn clicked_at(raw: u64) -> ClickedAt {
        ClickedAt {
            window: id(raw),
            at: ScreenPoint { x: 12.0, y: 34.0 },
        }
    }

    fn walk(plan: WalkPlan) -> (Walk, Receiver<WalkStep>) {
        let (steps, taken) = mpsc::channel::<WalkStep>();

        (
            Walk {
                gate: Arc::new(ClickGate::default()),
                plan: Mutex::new(plan),
                steps,
            },
            taken,
        )
    }

    fn plan_of(watched: &[u64], next: &[(u64, u64)]) -> WalkPlan {
        WalkPlan {
            watched: watched.iter().copied().map(id).collect(),
            next: next.iter().map(|(from, to)| (id(*from), id(*to))).collect(),
        }
    }

    #[test]
    fn the_walk_only_answers_for_the_windows_the_scan_handed_it() {
        let (walk, _taken) = walk(plan_of(&[1, 2], &[(1, 2), (2, 1)]));

        assert!(walk.watches(id(1)));
        assert!(!walk.watches(id(3)));
        assert_eq!(walk.next_after(id(1)), Some(id(2)));
        assert_eq!(walk.next_after(id(3)), None);
    }

    #[test]
    fn a_click_on_a_watched_window_with_nobody_in_the_cycle_has_nowhere_to_go() {
        let (walk, _taken) = walk(plan_of(&[1, 2], &[]));

        assert!(walk.watches(id(1)));
        assert_eq!(walk.next_after(id(1)), None);
    }

    #[test]
    fn each_thing_the_system_reports_reaches_the_walk_as_one_step() {
        let (steps, taken) = mpsc::channel::<WalkStep>();
        let gate = Arc::new(ClickGate::default());
        let sink = sink_of(Arc::clone(&gate), steps);

        sink(ClickReport::Clicked {
            clicked: clicked_at(1),
        });
        sink(ClickReport::Foreground { window: id(2) });
        sink(ClickReport::ListeningResumed);
        sink(ClickReport::ListeningLost);

        let taken = taken.try_iter().collect::<Vec<_>>();

        assert!(
            matches!(
                taken.as_slice(),
                [
                    WalkStep::Clicked { clicked },
                    WalkStep::Foreground { window },
                    WalkStep::ListeningResumed,
                    WalkStep::ListeningLost,
                ] if clicked.window == id(1) && *window == id(2)
            ),
            "{taken:?}"
        );
    }

    #[test]
    fn the_door_reopens_when_the_walk_is_no_longer_there_to_take_the_click() {
        let (steps, taken) = mpsc::channel::<WalkStep>();
        let gate = Arc::new(ClickGate::default());
        let sink = sink_of(Arc::clone(&gate), steps);

        gate.close();
        drop(taken);

        sink(ClickReport::Clicked {
            clicked: clicked_at(1),
        });

        assert!(
            !gate.is_switching(),
            "a dead walk must not eat the clicks for ever"
        );
    }
}
