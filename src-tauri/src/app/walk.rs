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

use crate::app::journal::JournalEvent;
use crate::app::journal::WalkFrom;
use crate::app::journal::WalkIdle;
use crate::app::journal::Work;
use crate::app::state::lock;
use crate::app::view::WalkMeasure;
use crate::platform::ClickGate;
use crate::platform::ClickReport;
use crate::platform::ClickSink;
use crate::platform::ClickWatcher;
use crate::platform::PlatformClickWatcher;
use crate::platform::PlatformError;
use crate::platform::PlatformWindowManager;
use crate::platform::WindowId;
use crate::platform::WindowManager;
use crate::platform::SWITCH_CEILING;

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct WalkPlan {
    pub watched: Vec<WindowId>,
    pub next: HashMap<WindowId, WindowId>,
}

#[derive(Debug)]
enum WalkStep {
    Clicked { window: WindowId, at: Instant },
    ListeningLost,
}

#[derive(Debug)]
pub struct Walk {
    gate: Arc<ClickGate>,
    plan: Mutex<WalkPlan>,
    steps: Sender<WalkStep>,
}

impl Walk {
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

    lock(app).set_walk_enabled(enabled, from);
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
            ClickReport::Clicked { window, at } => WalkStep::Clicked { window, at },
            ClickReport::ListeningLost => WalkStep::ListeningLost,
        };

        if steps.send(step).is_err() {
            gate.open();
        }
    })
}

fn take(app: &AppHandle, step: WalkStep) {
    match step {
        WalkStep::Clicked { window, at } => switch(app, window, at),
        WalkStep::ListeningLost => {
            lock(app).log(JournalEvent::WalkListeningLost);

            set_enabled(app, false, WalkFrom::ListeningLost);
        }
    }
}

fn switch(app: &AppHandle, clicked: WindowId, at: Instant) {
    let walk = app.state::<Walk>();
    let Some(target) = walk.next_after(clicked) else {
        walk.gate.open();

        lock(app).log_unless_repeated(JournalEvent::WalkIdle {
            reason: WalkIdle::NobodyInCycle,
        });

        return;
    };

    if target == clicked {
        walk.gate.open();

        return;
    }

    walk.gate.expect(target);

    let asked = app.state::<PlatformWindowManager>().focus_fast(target);
    let landed = asked.is_ok() && walk.gate.await_arrival(SWITCH_CEILING);
    let milliseconds = u64::try_from(at.elapsed().as_millis()).unwrap_or(u64::MAX);

    walk.gate.open();

    let mut state = lock(app);

    state.remember_walk_measure(WalkMeasure {
        milliseconds,
        landed,
    });

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
}
