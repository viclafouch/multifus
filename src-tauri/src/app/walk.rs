use std::collections::HashMap;
use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::sync::mpsc;
use std::sync::mpsc::Sender;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::MutexGuard;
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
use crate::app::state::hold;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::app::state::AppState;
use crate::app::view::BannerCharacter;
use crate::platform::ClickGate;
use crate::platform::ClickReport;
use crate::platform::ClickSink;
use crate::platform::ClickWatcher;
use crate::platform::ClickedAt;
use crate::platform::PlatformClickWatcher;
use crate::platform::PlatformError;
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
    fn plan(&self) -> MutexGuard<'_, WalkPlan> {
        self.plan.lock().unwrap_or_else(PoisonError::into_inner)
    }

    fn watches(&self, window: WindowId) -> bool {
        self.plan().watched.contains(&window)
    }

    fn next_after(&self, clicked: WindowId) -> Option<WindowId> {
        self.plan().next.get(&clicked).copied()
    }

    fn remember(&self, plan: WalkPlan) -> bool {
        self.gate.watch(&plan.watched);

        let mut held = self.plan();
        let no_window_left = !held.watched.is_empty() && plan.watched.is_empty();

        *held = plan;

        no_window_left
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
    let found = windows(app).foreground_game_window().ok().flatten()?;

    lock(app).banner_character_of(found.id())
}

pub fn toggle(app: &AppHandle, from: WalkFrom) {
    let enabled = lock(app).is_walk_enabled();

    set_enabled(app, !enabled, from);
}

pub fn refresh(app: &AppHandle) -> bool {
    let plan = {
        let state = lock(app);

        state.is_walk_enabled().then(|| state.walk_plan())
    };

    let Some(plan) = plan else {
        return false;
    };

    if !app.state::<Walk>().remember(plan) {
        return false;
    }

    set_enabled(app, false, WalkFrom::NoWindowLeft);

    true
}

fn listen(app: &AppHandle) -> Result<(), PlatformError> {
    let (gate, steps) = {
        let walk = app.state::<Walk>();

        (Arc::clone(&walk.gate), walk.steps.clone())
    };

    app.state::<PlatformClickWatcher>()
        .start(Arc::clone(&gate), sink_of(gate, steps))?;

    let plan = lock(app).walk_plan();

    let _ = app.state::<Walk>().remember(plan);

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
        WalkStep::Clicked { clicked } => on_click(app, clicked),
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

#[derive(Debug, PartialEq, Eq)]
enum Aim {
    Elsewhere,
    NobodyInCycle,
    AlreadyThere,
    Next(WindowId),
}

fn switch_said(refusal: Option<&PlatformError>, landed: bool) -> Option<JournalEvent> {
    match refusal {
        Some(error) => Some(JournalEvent::WalkSwitchFailed {
            detail: error.to_string(),
        }),
        None if !landed => Some(JournalEvent::WalkIdle {
            reason: WalkIdle::TooSlow,
        }),
        None => None,
    }
}

fn aim(windows: &dyn WindowManager, walk: &Walk, clicked: ClickedAt) -> Aim {
    let under = windows.window_at(clicked.at).ok().flatten();

    let Some(under) = under.filter(|under| walk.watches(*under)) else {
        return Aim::Elsewhere;
    };

    let Some(target) = walk.next_after(under) else {
        return Aim::NobodyInCycle;
    };

    if target == under {
        return Aim::AlreadyThere;
    }

    Aim::Next(target)
}

trait Banner {
    fn step(&self, arrived: Option<BannerCharacter>);
}

struct AppBanner<'a>(&'a AppHandle);

impl Banner for AppBanner<'_> {
    fn step(&self, arrived: Option<BannerCharacter>) {
        banner::step(self.0, arrived);
    }
}

struct Switch<'a> {
    windows: &'a dyn WindowManager,
    walk: &'a Walk,
    state: &'a AppState,
    banner: &'a dyn Banner,
}

fn on_click(app: &AppHandle, clicked: ClickedAt) {
    let walk = app.state::<Walk>();

    switch_over(
        &Switch {
            windows: windows(app),
            walk: walk.inner(),
            state: app.state::<AppState>().inner(),
            banner: &AppBanner(app),
        },
        clicked,
    );
}

fn switch_over(switch: &Switch, clicked: ClickedAt) {
    let asked_at = Instant::now();
    let gate = &switch.walk.gate;

    let target = match aim(switch.windows, switch.walk, clicked) {
        Aim::Elsewhere | Aim::AlreadyThere => {
            gate.open();

            return;
        }
        Aim::NobodyInCycle => {
            gate.open();

            hold(switch.state).log_unless_repeated(JournalEvent::WalkIdle {
                reason: WalkIdle::NobodyInCycle,
            });

            switch.banner.step(None);

            return;
        }
        Aim::Next(target) => target,
    };

    thread::sleep(SETTLE.saturating_sub(asked_at.elapsed()));

    gate.expect(target);

    let asked = switch.windows.focus_fast(target);
    let landed = asked.is_ok() && gate.await_arrival(SWITCH_CEILING);

    gate.open();

    let arrived = {
        let mut state = hold(switch.state);

        if let Some(said) = switch_said(asked.err().as_ref(), landed) {
            state.log_unless_repeated(said);
        }

        state.banner_character_of(target)
    };

    switch.banner.step(arrived);
}

#[cfg(test)]
mod tests {
    use std::sync::mpsc::Receiver;

    use tempfile::TempDir;

    use super::*;
    use crate::config::Settings;
    use crate::domain::Character;
    use crate::domain::Class;
    use crate::domain::Gender;
    use crate::domain::Roster;
    use crate::platform::ScreenPoint;
    use crate::test_doubles::app_state;
    use crate::test_doubles::directory;
    use crate::test_doubles::game_window;
    use crate::test_doubles::journalled;
    use crate::test_doubles::Asked;
    use crate::test_doubles::Desktop;
    use crate::test_doubles::FakeWindowManager;

    #[derive(Debug, Default)]
    struct FakeBanner {
        steps: Mutex<Vec<Option<BannerCharacter>>>,
    }

    impl FakeBanner {
        fn steps(&self) -> Vec<Option<BannerCharacter>> {
            self.steps
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .clone()
        }
    }

    impl Banner for FakeBanner {
        fn step(&self, arrived: Option<BannerCharacter>) {
            self.steps
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .push(arrived);
        }
    }

    fn id(raw: u64) -> WindowId {
        WindowId::from_raw(raw)
    }

    fn bravo() -> BannerCharacter {
        BannerCharacter {
            nickname: "Bravo".to_owned(),
            class: Some(Class::Cra),
            gender: Some(Gender::Female),
        }
    }

    fn two_in_the_cycle(directory: &TempDir) -> AppState {
        let state = app_state(
            directory,
            Settings {
                roster: Roster::from_characters(vec![
                    Character::new("Alpha")
                        .with_class(Class::Iop)
                        .with_gender(Gender::Male),
                    Character::new("Bravo")
                        .with_class(Class::Cra)
                        .with_gender(Gender::Female),
                ]),
                ..Settings::default()
            },
        );

        hold(&state).apply_windows(&[game_window(1, "Alpha"), game_window(2, "Bravo")]);

        state
    }

    fn walked(journal: &[JournalEvent]) -> Vec<JournalEvent> {
        journal
            .iter()
            .filter(|event| {
                matches!(
                    event,
                    JournalEvent::WalkIdle { .. } | JournalEvent::WalkSwitchFailed { .. }
                )
            })
            .cloned()
            .collect()
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
    fn the_walk_says_the_turn_where_the_last_window_it_watched_leaves_the_screen() {
        let (walk, _taken) = walk(plan_of(&[1, 2], &[(1, 2), (2, 1)]));

        assert!(
            !walk.remember(plan_of(&[1], &[(1, 1)])),
            "one client of the two is closed, and the other is still there to walk on"
        );
        assert!(walk.remember(plan_of(&[], &[])));
        assert!(
            !walk.remember(plan_of(&[], &[])),
            "the walk is already off, and the turns that follow have nothing to say"
        );
    }

    #[test]
    fn a_walk_turned_on_without_a_single_client_stays_on_and_waits() {
        let (walk, _taken) = walk(plan_of(&[], &[]));

        assert!(!walk.remember(plan_of(&[], &[])));
        assert!(!walk.remember(plan_of(&[1], &[(1, 1)])));
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
    fn a_click_on_a_watched_window_aims_at_the_next_character_of_the_cycle() {
        let (walk, _taken) = walk(plan_of(&[1, 2], &[(1, 2), (2, 1)]));
        let windows = FakeWindowManager::showing(Desktop {
            under_click: Some(id(1)),
            ..Desktop::default()
        });

        assert_eq!(
            aim(windows.as_ref(), &walk, clicked_at(1)),
            Aim::Next(id(2))
        );
    }

    #[test]
    fn a_click_that_lands_outside_the_game_aims_nowhere() {
        let (walk, _taken) = walk(plan_of(&[1, 2], &[(1, 2), (2, 1)]));
        let windows = FakeWindowManager::showing(Desktop::default());

        assert_eq!(aim(windows.as_ref(), &walk, clicked_at(1)), Aim::Elsewhere);

        windows.show(Desktop {
            under_click: Some(id(9)),
            ..Desktop::default()
        });

        assert_eq!(
            aim(windows.as_ref(), &walk, clicked_at(9)),
            Aim::Elsewhere,
            "a client the scan never handed over is not walked on"
        );
    }

    #[test]
    fn a_click_with_nobody_left_in_the_cycle_says_so_rather_than_switching() {
        let (walk, _taken) = walk(plan_of(&[1], &[]));
        let windows = FakeWindowManager::showing(Desktop {
            under_click: Some(id(1)),
            ..Desktop::default()
        });

        assert_eq!(
            aim(windows.as_ref(), &walk, clicked_at(1)),
            Aim::NobodyInCycle
        );
    }

    #[test]
    fn the_last_character_of_the_cycle_stays_where_it_is() {
        let (walk, _taken) = walk(plan_of(&[1], &[(1, 1)]));
        let windows = FakeWindowManager::showing(Desktop {
            under_click: Some(id(1)),
            ..Desktop::default()
        });

        assert_eq!(
            aim(windows.as_ref(), &walk, clicked_at(1)),
            Aim::AlreadyThere
        );
    }

    #[test]
    fn a_switch_is_only_over_when_the_system_says_the_window_came_forward() {
        assert_eq!(switch_said(None, true), None);
        assert_eq!(
            switch_said(None, false),
            Some(JournalEvent::WalkIdle {
                reason: WalkIdle::TooSlow,
            }),
            "the system took the click but never brought the window forward"
        );
    }

    #[test]
    fn a_switch_the_system_refused_is_said_by_its_reason_and_not_by_its_delay() {
        let refusal = PlatformError::system("focusing", "the system said no");

        assert_eq!(
            switch_said(Some(&refusal), false),
            Some(JournalEvent::WalkSwitchFailed {
                detail: "focusing failed: the system said no".to_owned(),
            })
        );
    }

    #[test]
    fn a_click_carries_the_player_to_the_next_window_once_the_game_has_had_it() {
        let directory = directory();
        let state = two_in_the_cycle(&directory);
        let (walk, _taken) = walk(hold(&state).walk_plan());
        let windows = FakeWindowManager::showing(Desktop {
            under_click: Some(id(1)),
            tells_arrival: Some(Arc::clone(&walk.gate)),
            ..Desktop::default()
        });
        let shown = FakeBanner::default();

        walk.gate.close();

        let began_at = Instant::now();

        switch_over(
            &Switch {
                windows: windows.as_ref(),
                walk: &walk,
                state: &state,
                banner: &shown,
            },
            clicked_at(1),
        );

        assert_eq!(windows.asked(), vec![Asked::Focused(id(2))]);
        assert!(
            windows.first_asked_at().expect("a window was asked for") >= began_at + SETTLE,
            "the game keeps the click for the whole settle before the window is moved"
        );
        assert_eq!(
            walked(&journalled(&state)),
            Vec::new(),
            "the window came forward, so the switch has nothing to say"
        );
        assert_eq!(shown.steps(), vec![Some(bravo())]);
        assert!(
            !walk.gate.is_switching(),
            "the door is open again for the next click"
        );
    }

    #[test]
    fn a_switch_the_system_never_finishes_is_awaited_up_to_the_ceiling_and_no_further() {
        let directory = directory();
        let state = two_in_the_cycle(&directory);
        let (walk, _taken) = walk(hold(&state).walk_plan());
        let windows = FakeWindowManager::showing(Desktop {
            under_click: Some(id(1)),
            ..Desktop::default()
        });
        let shown = FakeBanner::default();

        walk.gate.close();

        let began_at = Instant::now();

        switch_over(
            &Switch {
                windows: windows.as_ref(),
                walk: &walk,
                state: &state,
                banner: &shown,
            },
            clicked_at(1),
        );

        assert_eq!(
            walked(&journalled(&state)),
            vec![JournalEvent::WalkIdle {
                reason: WalkIdle::TooSlow,
            }],
            "the system took the click and never brought the window forward"
        );
        assert!(began_at.elapsed() >= SETTLE + SWITCH_CEILING);
        assert_eq!(shown.steps(), vec![Some(bravo())]);
        assert!(!walk.gate.is_switching());
    }

    #[test]
    fn a_switch_the_system_refuses_is_not_waited_for() {
        let directory = directory();
        let state = two_in_the_cycle(&directory);
        let (walk, _taken) = walk(hold(&state).walk_plan());
        let windows = FakeWindowManager::showing(Desktop {
            under_click: Some(id(1)),
            tells_arrival: Some(Arc::clone(&walk.gate)),
            focus_refusal: Some(PlatformError::system("focusing", "the system said no")),
            ..Desktop::default()
        });
        let shown = FakeBanner::default();

        walk.gate.close();

        let began_at = Instant::now();

        switch_over(
            &Switch {
                windows: windows.as_ref(),
                walk: &walk,
                state: &state,
                banner: &shown,
            },
            clicked_at(1),
        );

        assert_eq!(
            walked(&journalled(&state)),
            vec![JournalEvent::WalkSwitchFailed {
                detail: "focusing failed: the system said no".to_owned(),
            }]
        );
        assert!(
            began_at.elapsed() < SETTLE + SWITCH_CEILING,
            "a switch the system would not even take is not awaited"
        );
        assert!(!walk.gate.is_switching());
    }

    #[test]
    fn a_click_that_walks_nowhere_opens_the_door_it_closed() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let (last_of_the_cycle, _taken) = walk(plan_of(&[1], &[(1, 1)]));
        let (nobody_in_the_cycle, _left) = walk(plan_of(&[1], &[]));
        let windows = FakeWindowManager::showing(Desktop {
            under_click: Some(id(1)),
            ..Desktop::default()
        });
        let shown = FakeBanner::default();

        last_of_the_cycle.gate.close();
        nobody_in_the_cycle.gate.close();

        switch_over(
            &Switch {
                windows: windows.as_ref(),
                walk: &last_of_the_cycle,
                state: &state,
                banner: &shown,
            },
            clicked_at(1),
        );

        assert!(!last_of_the_cycle.gate.is_switching());
        assert_eq!(windows.asked(), Vec::new());
        assert_eq!(
            shown.steps(),
            Vec::new(),
            "the player stays where they are, and the banner with them"
        );
        assert_eq!(walked(&journalled(&state)), Vec::new());

        switch_over(
            &Switch {
                windows: windows.as_ref(),
                walk: &nobody_in_the_cycle,
                state: &state,
                banner: &shown,
            },
            clicked_at(1),
        );

        assert!(!nobody_in_the_cycle.gate.is_switching());
        assert_eq!(windows.asked(), Vec::new());
        assert_eq!(
            shown.steps(),
            vec![None],
            "there is nobody to name, so the banner shows nobody"
        );
        assert_eq!(
            walked(&journalled(&state)),
            vec![JournalEvent::WalkIdle {
                reason: WalkIdle::NobodyInCycle,
            }]
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
