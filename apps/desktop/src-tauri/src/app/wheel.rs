use std::f64::consts::TAU;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::thread;
use std::time::Duration;
use std::time::Instant;

use tauri::AppHandle;
use tauri::Emitter;
use tauri::LogicalSize;
use tauri::Manager;
use tauri::Monitor;
use tauri::PhysicalPosition;
use tauri::PhysicalRect;
use tauri::PhysicalSize;

use crate::app::banner;
use crate::app::clicks;
use crate::app::clicks::Asker;
use crate::app::journal::JournalEvent;
use crate::app::journal::WheelOutcome;
use crate::app::journal::Work;
use crate::app::main_window;
use crate::app::overlay::Acknowledged;
use crate::app::overlay::Generation;
use crate::app::overlay::Overlay;
use crate::app::overlay::holds_point;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::app::view::DisplayView;
use crate::app::view::WheelSlice;
use crate::app::view::WheelStep;
use crate::config::WHEEL_WIDEST;
use crate::domain::Class;
use crate::domain::Gender;
use crate::platform::PlatformError;
use crate::platform::WindowId;
use crate::platform::matches_game_in_front;

const OVERLAY: Overlay = Overlay {
    label: "wheel",
    page: "wheel.html",
    thread: "multifus-wheel",
    work: Work::Wheel,
    failed: |detail| JournalEvent::WheelFailed { detail },
    accepts_first_mouse: false,
};

const STEP_EVENT: &str = "multifus://wheel";

const AIM_EVENT: &str = "multifus://wheel-aim";

const WIPE_EVENT: &str = "multifus://wheel-wipe";

const PREVIEW: Duration = Duration::from_millis(2500);

const POLL: Duration = Duration::from_millis(16);

const WIPE: Duration = Duration::from_millis(150);

pub const DEAD_ZONE: f64 = 0.32;

const NUDGE: f64 = 4.0;

const HALO: f64 = 32.0;

#[derive(Debug, Default)]
pub struct WheelPlan {
    pub slices: Vec<WheelSlice>,
    pub windows: Vec<WindowId>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct Dial {
    center_x: f64,
    center_y: f64,
    radius: f64,
    origin_x: f64,
    origin_y: f64,
    slices: usize,
}

impl Dial {
    fn stirred(&self, x: f64, y: f64) -> bool {
        (x - self.origin_x).hypot(y - self.origin_y) >= NUDGE
    }

    fn aimed_at(&self, x: f64, y: f64) -> Option<usize> {
        if self.slices == 0 {
            return None;
        }

        let sideways = x - self.center_x;
        let upwards = self.center_y - y;
        let away = sideways.hypot(upwards);

        if away <= self.radius * DEAD_ZONE || away > self.radius {
            return None;
        }

        let slice = TAU / self.slices as f64;
        let clockwise = (sideways.atan2(upwards) + slice / 2.0).rem_euclid(TAU);

        Some((clockwise / slice) as usize % self.slices)
    }
}

#[derive(Debug)]
struct Open {
    generation: u64,
    dial: Dial,
    slices: Vec<WheelSlice>,
    windows: Vec<WindowId>,
    hovered: Option<usize>,
    stirred: bool,
    previewing: bool,
}

impl Open {
    fn step(&self, diameter: u32) -> WheelStep {
        WheelStep {
            diameter,
            dead_zone: DEAD_ZONE,
            slices: self.slices.clone(),
            hovered: self.hovered,
            previewing: self.previewing,
        }
    }

    fn aim(&mut self, x: f64, y: f64) -> Aimed {
        self.stirred = self.stirred || self.dial.stirred(x, y);

        let hovered = if self.stirred {
            self.dial.aimed_at(x, y)
        } else {
            None
        };

        if hovered == self.hovered {
            return Aimed::Same;
        }

        self.hovered = hovered;

        Aimed::Moved(hovered)
    }

    fn picked(&self, at: Option<(f64, f64)>) -> Option<(String, WindowId)> {
        if self.previewing {
            return None;
        }

        let hovered = match at {
            Some((x, y)) if self.stirred || self.dial.stirred(x, y) => self.dial.aimed_at(x, y),
            Some(_) => None,
            None => self.hovered,
        }?;
        let slice = self.slices.get(hovered)?;
        let window = self.windows.get(hovered)?;

        Some((slice.nickname.clone(), *window))
    }
}

#[derive(Debug, Default)]
pub struct Wheel {
    latest: Generation,
    wiped: Acknowledged,
    gesture: Mutex<()>,
    open: Mutex<Option<Open>>,
}

impl Wheel {
    fn next(&self) -> u64 {
        self.latest.next()
    }

    fn matches_latest(&self, generation: u64) -> bool {
        self.latest.matches_latest(generation)
    }

    fn set_wiped(&self, generation: u64) {
        self.wiped.acknowledge(generation);
    }

    fn matches_wiped(&self, generation: u64) -> bool {
        self.wiped.matches_acknowledged(generation)
    }

    fn gesture(&self) -> MutexGuard<'_, ()> {
        self.gesture.lock().unwrap_or_else(PoisonError::into_inner)
    }

    fn held(&self) -> MutexGuard<'_, Option<Open>> {
        self.open.lock().unwrap_or_else(PoisonError::into_inner)
    }

    fn lay(&self, open: Open) {
        *self.held() = Some(open);
    }

    fn take_if(&self, generation: u64) -> Option<Open> {
        let mut held = self.held();

        held.take_if(|open| open.generation == generation)
    }

    fn holds(&self, generation: u64) -> bool {
        self.held()
            .as_ref()
            .is_some_and(|open| open.generation == generation)
    }

    fn playing(&self) -> Option<u64> {
        self.held()
            .as_ref()
            .filter(|open| !open.previewing)
            .map(|open| open.generation)
    }

    fn aim(&self, generation: u64, x: f64, y: f64) -> Aimed {
        let mut held = self.held();

        held.as_mut()
            .filter(|open| open.generation == generation)
            .map_or(Aimed::Same, |open| open.aim(x, y))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Aimed {
    Same,
    Moved(Option<usize>),
}

struct DemoCharacter {
    nickname: &'static str,
    class: Class,
    gender: Gender,
    main: bool,
}

const DEMO_TEAM: [DemoCharacter; 8] = [
    DemoCharacter {
        nickname: "Zoubidou",
        class: Class::Iop,
        gender: Gender::Male,
        main: false,
    },
    DemoCharacter {
        nickname: "Kaelis",
        class: Class::Cra,
        gender: Gender::Female,
        main: false,
    },
    DemoCharacter {
        nickname: "Mamiheal",
        class: Class::Eniripsa,
        gender: Gender::Female,
        main: true,
    },
    DemoCharacter {
        nickname: "Grobill",
        class: Class::Sacrieur,
        gender: Gender::Male,
        main: false,
    },
    DemoCharacter {
        nickname: "Sadidette",
        class: Class::Sadida,
        gender: Gender::Female,
        main: false,
    },
    DemoCharacter {
        nickname: "Tic-Tac",
        class: Class::Xelor,
        gender: Gender::Male,
        main: false,
    },
    DemoCharacter {
        nickname: "Bouclette",
        class: Class::Feca,
        gender: Gender::Female,
        main: false,
    },
    DemoCharacter {
        nickname: "Nyko",
        class: Class::Sram,
        gender: Gender::Male,
        main: false,
    },
];

#[must_use]
pub fn demo_slices(crowd: usize) -> Vec<WheelSlice> {
    DEMO_TEAM
        .iter()
        .take(crowd.min(DEMO_TEAM.len()))
        .enumerate()
        .map(|(rank, character)| WheelSlice {
            nickname: character.nickname.to_owned(),
            class: Some(character.class),
            gender: Some(character.gender),
            main: character.main,
            here: rank == 0,
        })
        .collect()
}

#[must_use]
pub fn demo_crowd() -> usize {
    DEMO_TEAM.len()
}

pub fn setup(app: &AppHandle) {
    app.manage(Wheel::default());

    build(app);
}

pub fn open(app: &AppHandle, here: WindowId) {
    let wheel = app.state::<Wheel>();
    let _gesture = wheel.gesture();

    if wheel.playing().is_some() {
        return;
    }

    let (diameter, plan) = {
        let state = lock(app);

        (state.wheel_diameter(), state.wheel_plan(Some(here)))
    };

    let Some(dial) = place(app, diameter, plan.slices.len(), opening(app)) else {
        return;
    };

    let generation = wheel.next();
    let open = Open {
        generation,
        dial,
        slices: plan.slices,
        windows: plan.windows,
        hovered: None,
        stirred: false,
        previewing: false,
    };

    let step = open.step(diameter);

    wheel.lay(open);

    let clicks_before = hold_clicks(app);

    tell(app, &step);
    reveal(app);

    follow_cursor(app, generation, clicks_before);
}

pub fn release(app: &AppHandle) {
    let Some(generation) = app.state::<Wheel>().playing() else {
        return;
    };

    let_go(app, generation);
}

fn let_go(app: &AppHandle, generation: u64) {
    let at = cursor_of(app);

    let Some(open) = shut_if(app, generation) else {
        return;
    };

    let Some((nickname, window)) = open.picked(at) else {
        return;
    };

    land(app, nickname, window);
}

fn hold_clicks(app: &AppHandle) -> u64 {
    if let Err(error) = clicks::listen(app, Asker::Wheel) {
        lock(app).log_unless_repeated(JournalEvent::WheelFailed {
            detail: error.to_string(),
        });
    }

    let gate = clicks::gate(app);
    let clicks_before = gate.clicks_held_back();

    gate.hold(true);

    clicks_before
}

fn give_clicks_back(app: &AppHandle) {
    clicks::gate(app).hold(false);
    clicks::stop(app, Asker::Wheel);
}

pub fn follow_foreground(app: &AppHandle) {
    let Some(generation) = app.state::<Wheel>().playing() else {
        return;
    };

    if matches_game_in_front(windows(app)) {
        return;
    }

    drop(shut_if(app, generation));
}

pub fn preview(app: &AppHandle, crowd: usize) {
    OVERLAY.apart(app, move |app| {
        let Some(generation) = raise_preview(app, crowd) else {
            return;
        };

        thread::sleep(PREVIEW);

        drop(shut_if(app, generation));
    });
}

fn raise_preview(app: &AppHandle, crowd: usize) -> Option<u64> {
    let wheel = app.state::<Wheel>();
    let _gesture = wheel.gesture();

    if wheel.playing().is_some() {
        return None;
    }

    let diameter = lock(app).wheel_diameter();
    let slices = demo_slices(crowd);

    let middle = middle_of_the_screen(app)?;
    let dial = place(
        app,
        diameter,
        slices.len(),
        Some(Placing {
            middle,
            origin: middle,
        }),
    )?;

    let generation = wheel.next();
    let open = Open {
        generation,
        dial,
        slices,
        windows: Vec::new(),
        hovered: None,
        stirred: false,
        previewing: true,
    };

    let step = open.step(diameter);

    wheel.lay(open);

    tell(app, &step);
    reveal(app);
    follow_cursor(app, generation, clicks::gate(app).clicks_held_back());

    Some(generation)
}

fn shut_if(app: &AppHandle, generation: u64) -> Option<Open> {
    let wheel = app.state::<Wheel>();
    let _gesture = wheel.gesture();

    let open = wheel.take_if(generation)?;

    wipe(app, generation);

    if !open.previewing {
        give_clicks_back(app);
    }

    Some(open)
}

fn land(app: &AppHandle, nickname: String, window: WindowId) {
    let outcome = match windows(app).focus(window) {
        Ok(()) => WheelOutcome::Focused {
            nickname: nickname.clone(),
        },
        Err(PlatformError::WindowGone) => WheelOutcome::NoWindow {
            nickname: nickname.clone(),
        },
        Err(error) => WheelOutcome::FocusFailed {
            nickname: nickname.clone(),
            detail: error.to_string(),
        },
    };

    let arrived = {
        let mut state = lock(app);

        state.log(JournalEvent::WheelPicked { outcome });

        state.banner_character_of(window)
    };

    banner::step(app, arrived);
}

fn follow_cursor(app: &AppHandle, generation: u64, clicks_before: u64) {
    OVERLAY.apart(app, move |app| {
        let gate = clicks::gate(app);

        while app.state::<Wheel>().holds(generation) {
            thread::sleep(POLL);

            if gate.clicks_held_back() != clicks_before {
                let_go(app, generation);

                return;
            }

            let Some(at) = cursor_of(app) else {
                continue;
            };

            if let Aimed::Moved(hovered) = app.state::<Wheel>().aim(generation, at.0, at.1) {
                point_at(app, hovered);
            }
        }
    });
}

fn tell(app: &AppHandle, step: &WheelStep) {
    OVERLAY.said(app, app.emit_to(OVERLAY.target(), STEP_EVENT, step));
}

fn point_at(app: &AppHandle, hovered: Option<usize>) {
    OVERLAY.said(app, app.emit_to(OVERLAY.target(), AIM_EVENT, hovered));
}

fn reveal(app: &AppHandle) {
    let Some(window) = OVERLAY.window(app) else {
        return;
    };

    OVERLAY.said(app, window.set_ignore_cursor_events(false));
    OVERLAY.said(app, window.show());
}

pub fn wiped(app: &AppHandle, generation: u64) {
    app.state::<Wheel>().set_wiped(generation);
}

fn wipe(app: &AppHandle, generation: u64) {
    let Some(window) = OVERLAY.window(app) else {
        return;
    };

    OVERLAY.said(app, window.set_ignore_cursor_events(true));
    OVERLAY.said(app, app.emit_to(OVERLAY.target(), WIPE_EVENT, generation));

    let hiding = OVERLAY.apart(app, move |app| {
        hide_once_empty(app, generation);
    });

    if !hiding {
        hide(app);
    }
}

fn hide_once_empty(app: &AppHandle, generation: u64) {
    wait_to_hide(app, generation);

    let wheel = app.state::<Wheel>();
    let _gesture = wheel.gesture();

    if wheel.matches_latest(generation) {
        hide(app);
    }
}

fn wait_to_hide(app: &AppHandle, generation: u64) {
    let until = Instant::now() + WIPE;
    let wheel = app.state::<Wheel>();

    while Instant::now() < until {
        if wheel.matches_wiped(generation) || !wheel.matches_latest(generation) {
            return;
        }

        thread::sleep(POLL);
    }
}

fn hide(app: &AppHandle) {
    let Some(window) = OVERLAY.window(app) else {
        return;
    };

    OVERLAY.said(app, window.hide());
}

fn cursor_of(app: &AppHandle) -> Option<(f64, f64)> {
    match app.cursor_position() {
        Ok(at) => Some((at.x, at.y)),
        Err(error) => {
            lock(app).log_unless_repeated(JournalEvent::WheelFailed {
                detail: error.to_string(),
            });

            None
        }
    }
}

pub fn step(app: &AppHandle) -> Option<WheelStep> {
    let diameter = lock(app).wheel_diameter();
    let wheel = app.state::<Wheel>();
    let held = wheel.held();

    held.as_ref().map(|open| open.step(diameter))
}

pub fn display(app: &AppHandle) -> Option<DisplayView> {
    let screen = multifus_screen(app)?;

    Some(banner::display_of(&screen, true))
}

fn multifus_screen(app: &AppHandle) -> Option<Monitor> {
    app.get_webview_window(main_window::LABEL)
        .and_then(|window| window.current_monitor().ok().flatten())
        .or_else(|| app.primary_monitor().ok().flatten())
}

fn middle_of_the_screen(app: &AppHandle) -> Option<(f64, f64)> {
    middle_of(&multifus_screen(app)?)
}

fn opening(app: &AppHandle) -> Option<Placing> {
    let origin = cursor_of(app)?;
    let middle = middle_of(&screen_under(app, origin.0, origin.1)?)?;

    Some(Placing { middle, origin })
}

fn middle_of(screen: &Monitor) -> Option<(f64, f64)> {
    let area = screen.work_area();

    Some((
        f64::from(area.position.x) + f64::from(area.size.width) / 2.0,
        f64::from(area.position.y) + f64::from(area.size.height) / 2.0,
    ))
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct Placing {
    middle: (f64, f64),
    origin: (f64, f64),
}

fn place(app: &AppHandle, diameter: u32, slices: usize, placing: Option<Placing>) -> Option<Dial> {
    let window = OVERLAY.window(app)?;
    let Placing {
        middle: (middle_x, middle_y),
        origin: (origin_x, origin_y),
    } = placing?;
    let screen = screen_under(app, middle_x, middle_y)?;
    let scale = screen.scale_factor();
    let side = framed(diameter);
    let size = PhysicalSize::<u32>::from_logical(LogicalSize::new(side, side), scale);
    let halo = (HALO * scale).round() as u32;
    let disc = PhysicalSize::new(
        size.width.saturating_sub(halo * 2),
        size.height.saturating_sub(halo * 2),
    );
    let at = held_inside(screen.work_area(), disc, halo, (middle_x, middle_y));
    let placed = window.set_size(size).and_then(|()| window.set_position(at));

    if let Err(error) = placed {
        lock(app).log_unless_repeated(JournalEvent::WheelFailed {
            detail: error.to_string(),
        });

        return None;
    }

    Some(Dial {
        center_x: f64::from(at.x) + f64::from(size.width) / 2.0,
        center_y: f64::from(at.y) + f64::from(size.height) / 2.0,
        radius: f64::from(diameter) * scale / 2.0,
        origin_x,
        origin_y,
        slices,
    })
}

fn held_inside(
    area: &PhysicalRect<i32, u32>,
    disc: PhysicalSize<u32>,
    halo: u32,
    middle: (f64, f64),
) -> PhysicalPosition<i32> {
    let halo = i32::try_from(halo).unwrap_or(0);
    let (x, y) = middle;

    PhysicalPosition::new(
        held_between(area.position.x, area.size.width, disc.width, x) - halo,
        held_between(area.position.y, area.size.height, disc.height, y) - halo,
    )
}

fn held_between(edge: i32, room: u32, side: u32, at: f64) -> i32 {
    let room = i32::try_from(room).unwrap_or(i32::MAX);
    let side = i32::try_from(side).unwrap_or(i32::MAX);
    let wanted = (at - f64::from(side) / 2.0) as i32;
    let furthest = edge.saturating_add(room.saturating_sub(side).max(0));

    wanted.clamp(edge, furthest)
}

fn screen_under(app: &AppHandle, x: f64, y: f64) -> Option<Monitor> {
    let screens = app.available_monitors().ok()?;

    let under = screens.into_iter().find(|screen| {
        let corner = screen.position();
        let side = screen.size();

        holds_point(f64::from(corner.x), f64::from(side.width), x)
            && holds_point(f64::from(corner.y), f64::from(side.height), y)
    });

    under.or_else(|| app.primary_monitor().ok().flatten())
}

fn framed(diameter: u32) -> f64 {
    f64::from(diameter) + HALO * 2.0
}

fn build(app: &AppHandle) {
    let widest = framed(WHEEL_WIDEST);

    let Some(window) = OVERLAY.build(app, LogicalSize::new(widest, widest)) else {
        return;
    };

    OVERLAY.said(app, window.set_ignore_cursor_events(true));
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use super::*;
    use crate::config::WHEEL_SMALLEST;

    const SIDE: u32 = 400;

    const NO_HALO: u32 = 0;

    fn dial(slices: usize) -> Dial {
        Dial {
            center_x: 500.0,
            center_y: 500.0,
            radius: 200.0,
            origin_x: 500.0,
            origin_y: 500.0,
            slices,
        }
    }

    fn work_area() -> PhysicalRect<i32, u32> {
        PhysicalRect {
            position: PhysicalPosition::new(0, 0),
            size: PhysicalSize::new(1920, 1040),
        }
    }

    fn size() -> PhysicalSize<u32> {
        PhysicalSize::new(SIDE, SIDE)
    }

    #[test]
    fn the_first_slice_stands_at_midnight_and_the_others_follow_the_clock() {
        let dial = dial(4);

        assert_eq!(dial.aimed_at(500.0, 380.0), Some(0));
        assert_eq!(dial.aimed_at(620.0, 500.0), Some(1));
        assert_eq!(dial.aimed_at(500.0, 620.0), Some(2));
        assert_eq!(dial.aimed_at(380.0, 500.0), Some(3));
    }

    #[test]
    fn a_single_character_takes_the_whole_disc() {
        let dial = dial(1);

        assert_eq!(dial.aimed_at(500.0, 380.0), Some(0));
        assert_eq!(dial.aimed_at(620.0, 500.0), Some(0));
        assert_eq!(dial.aimed_at(380.0, 620.0), Some(0));
    }

    #[test]
    fn the_dead_centre_and_the_outside_of_the_disc_pick_nobody() {
        let dial = dial(6);

        assert_eq!(
            dial.aimed_at(540.0, 500.0),
            None,
            "forty points from the centre is still the dead round"
        );
        assert_eq!(
            dial.aimed_at(760.0, 500.0),
            None,
            "the player left the disc, and it picks nobody"
        );
        assert_eq!(dial.aimed_at(600.0, 440.0), Some(1));
    }

    #[test]
    fn a_wheel_opened_without_a_single_character_never_picks_one() {
        assert_eq!(dial(0).aimed_at(620.0, 500.0), None);
    }

    #[test]
    fn nothing_is_aimed_at_until_the_mouse_has_moved() {
        let born_on_a_slice = Dial {
            origin_x: 620.0,
            origin_y: 500.0,
            ..dial(4)
        };
        let mut open = Open {
            stirred: false,
            ..open_at(1, born_on_a_slice, false)
        };

        assert_eq!(
            open.aim(620.0, 500.0),
            Aimed::Same,
            "a hold with no gesture must bring nobody forward"
        );
        assert_eq!(open.picked(Some((620.0, 500.0))), None);
        assert_eq!(open.aim(640.0, 500.0), Aimed::Moved(Some(1)));
    }

    #[test]
    fn the_disc_lands_in_the_middle_while_the_gesture_starts_where_the_hand_is() {
        let placing = Placing {
            middle: (960.0, 540.0),
            origin: (200.0, 800.0),
        };

        assert_ne!(
            placing.middle, placing.origin,
            "the wheel opens in the middle, and the hand stays where it was"
        );
    }

    #[test]
    fn a_hand_already_over_the_disc_still_brings_nobody_forward_without_a_gesture() {
        let where_the_hand_rests = Dial {
            origin_x: 620.0,
            origin_y: 500.0,
            ..dial(4)
        };
        let open = Open {
            stirred: false,
            ..open_at(1, where_the_hand_rests, false)
        };

        assert_eq!(
            where_the_hand_rests.aimed_at(620.0, 500.0),
            Some(1),
            "the hand rests on a slice of the disc"
        );
        assert_eq!(
            open.picked(Some((620.0, 500.0))),
            None,
            "and a hold with no gesture still brings nobody forward"
        );
    }

    #[test]
    fn the_slice_the_wheel_was_born_on_answers_again_once_the_hand_has_stirred() {
        let born_on_a_slice = Dial {
            origin_x: 620.0,
            origin_y: 500.0,
            ..dial(4)
        };
        let mut open = Open {
            slices: vec![
                slice("Alpha"),
                slice("Bravo"),
                slice("Charlie"),
                slice("Delta"),
            ],
            windows: (1..=4).map(WindowId::from_raw).collect(),
            stirred: false,
            ..open_at(1, born_on_a_slice, false)
        };

        open.aim(640.0, 500.0);

        assert_eq!(
            open.aim(620.0, 500.0),
            Aimed::Same,
            "the hand came back to where the wheel was born, and the slice is still lit"
        );
        assert_eq!(
            open.picked(Some((620.0, 500.0))),
            Some(("Bravo".to_owned(), WindowId::from_raw(2)))
        );
    }

    #[test]
    fn a_wheel_born_at_the_edge_slides_whole_into_the_work_area() {
        let area = work_area();

        assert_eq!(
            held_inside(&area, size(), NO_HALO, (4.0, 4.0)),
            PhysicalPosition::new(0, 0),
            "the corner of the screen keeps the whole disc on screen"
        );
        assert_eq!(
            held_inside(&area, size(), NO_HALO, (1918.0, 1038.0)),
            PhysicalPosition::new(1920 - 400, 1040 - 400)
        );
        assert_eq!(
            held_inside(&area, size(), NO_HALO, (960.0, 520.0)),
            PhysicalPosition::new(760, 320),
            "away from the edges the disc is born under the cursor"
        );
    }

    #[test]
    fn the_preview_hands_over_as_many_false_characters_as_it_is_asked_for() {
        assert_eq!(demo_slices(1).len(), 1);
        assert_eq!(demo_slices(6).len(), 6);
        assert_eq!(demo_slices(demo_crowd()).len(), demo_crowd());
    }

    #[test]
    fn the_preview_never_hands_over_more_characters_than_it_has() {
        assert_eq!(demo_slices(usize::MAX).len(), demo_crowd());
    }

    #[test]
    fn the_first_false_character_stands_where_the_player_would_be() {
        let team = demo_slices(demo_crowd());

        assert!(team[0].here, "the wheel always comes from somewhere");
        assert_eq!(
            team.iter().filter(|slice| slice.here).count(),
            1,
            "and from one window only"
        );
    }

    #[test]
    fn every_false_character_carries_a_head_and_a_name_of_its_own() {
        let team = demo_slices(demo_crowd());
        let names: HashSet<_> = team.iter().map(|slice| slice.nickname.clone()).collect();

        assert_eq!(names.len(), team.len());
        assert!(team.iter().all(|slice| slice.class.is_some()));
        assert!(team.iter().all(|slice| slice.gender.is_some()));
    }

    #[test]
    fn the_window_leaves_a_ring_of_room_around_the_disc_on_every_side() {
        for diameter in [WHEEL_SMALLEST, 320, WHEEL_WIDEST] {
            let room = framed(diameter) - f64::from(diameter);

            assert!(
                (room / 2.0 - HALO).abs() < f64::EPSILON,
                "the shadow of the disc needs the same room all around"
            );
        }
    }

    #[test]
    fn a_second_screen_holds_the_wheel_by_its_own_edges() {
        let beside = PhysicalRect {
            position: PhysicalPosition::new(1920, 0),
            size: PhysicalSize::new(1920, 1080),
        };

        assert_eq!(
            held_inside(&beside, size(), NO_HALO, (1921.0, 12.0)),
            PhysicalPosition::new(1920, 0)
        );
    }

    #[test]
    fn the_halo_of_the_disc_hangs_off_the_screen_rather_than_pushing_it_in() {
        let area = work_area();
        let halo = 32;

        assert_eq!(
            held_inside(&area, size(), halo, (4.0, 4.0)),
            PhysicalPosition::new(-32, -32),
            "the disc itself sits in the corner, and its shadow falls outside"
        );
        assert_eq!(
            held_inside(&area, size(), halo, (1918.0, 1038.0)),
            PhysicalPosition::new(1920 - 400 - 32, 1040 - 400 - 32)
        );
    }

    #[test]
    fn a_disc_wider_than_the_screen_starts_at_the_corner_rather_than_off_it() {
        let cramped = PhysicalRect {
            position: PhysicalPosition::new(0, 0),
            size: PhysicalSize::new(300, 300),
        };

        assert_eq!(
            held_inside(&cramped, size(), NO_HALO, (150.0, 150.0)),
            PhysicalPosition::new(0, 0)
        );
    }

    #[test]
    fn the_wheel_that_a_newer_one_replaced_no_longer_speaks_for_itself() {
        let wheel = Wheel::default();
        let first = wheel.next();
        let second = wheel.next();

        wheel.lay(open_at(second, dial(4), false));

        assert!(wheel.holds(second));
        assert!(!wheel.holds(first));
        assert!(wheel.take_if(second).is_some());
        assert!(!wheel.holds(second));
    }

    #[test]
    fn the_wheel_stays_on_screen_until_the_window_says_it_has_nothing_left_to_draw() {
        let wheel = Wheel::default();
        let generation = wheel.next();

        assert!(!wheel.matches_wiped(generation));

        wheel.set_wiped(generation);

        assert!(wheel.matches_wiped(generation));
    }

    #[test]
    fn a_window_emptied_late_never_hides_the_wheel_opened_since() {
        let wheel = Wheel::default();
        let first = wheel.next();
        let second = wheel.next();

        wheel.set_wiped(first);

        assert!(
            !wheel.matches_latest(first),
            "the player held the keys again, and the wheel showing now stays"
        );
        assert!(wheel.matches_latest(second));
        assert!(
            !wheel.matches_wiped(second),
            "the window has yet to empty itself of the wheel showing now"
        );
    }

    #[test]
    fn the_cursor_only_speaks_when_it_changes_slice() {
        let wheel = Wheel::default();
        let generation = wheel.next();

        wheel.lay(open_at(generation, dial(4), false));

        assert_eq!(wheel.aim(generation, 500.0, 380.0), Aimed::Moved(Some(0)));
        assert_eq!(
            wheel.aim(generation, 500.0, 400.0),
            Aimed::Same,
            "the same slice is still the same slice, and the window is left alone"
        );
        assert_eq!(wheel.aim(generation, 620.0, 500.0), Aimed::Moved(Some(1)));
        assert_eq!(wheel.aim(generation, 500.0, 500.0), Aimed::Moved(None));
        assert_eq!(
            wheel.aim(generation + 1, 620.0, 500.0),
            Aimed::Same,
            "an older hold never moves the wheel showing now"
        );
    }

    #[test]
    fn a_preview_never_answers_to_the_net_that_watches_the_foreground() {
        let wheel = Wheel::default();
        let generation = wheel.next();

        wheel.lay(open_at(generation, dial(0), true));

        assert_eq!(wheel.playing(), None);

        wheel.lay(open_at(generation, dial(0), false));

        assert_eq!(wheel.playing(), Some(generation));
    }

    #[test]
    fn the_net_only_takes_away_the_wheel_it_looked_at() {
        let wheel = Wheel::default();
        let older = wheel.next();

        wheel.lay(open_at(wheel.next(), dial(4), false));

        assert!(
            wheel.take_if(older).is_none(),
            "the player let go and held again, and the newer wheel stays"
        );
        assert!(wheel.playing().is_some());
    }

    #[test]
    fn a_preview_never_brings_a_window_forward_however_it_is_released() {
        let previewing = Open {
            hovered: Some(1),
            ..open_at(1, dial(2), true)
        };

        assert_eq!(previewing.picked(None), None);
        assert_eq!(previewing.picked(Some((620.0, 500.0))), None);
    }

    #[test]
    fn the_slice_released_on_names_the_character_and_his_window() {
        let open = Open {
            slices: vec![slice("Alpha"), slice("Bravo")],
            windows: vec![WindowId::from_raw(1), WindowId::from_raw(2)],
            hovered: Some(1),
            ..open_at(1, dial(2), false)
        };

        assert_eq!(
            open.picked(None),
            Some(("Bravo".to_owned(), WindowId::from_raw(2)))
        );

        let cancelled = Open {
            hovered: None,
            ..open
        };

        assert_eq!(cancelled.picked(None), None);
    }

    #[test]
    fn the_release_takes_the_slice_the_cursor_is_on_rather_than_the_last_one_seen() {
        let open = Open {
            slices: vec![slice("Alpha"), slice("Bravo")],
            windows: vec![WindowId::from_raw(1), WindowId::from_raw(2)],
            hovered: Some(0),
            ..open_at(1, dial(2), false)
        };

        assert_eq!(
            open.picked(Some((500.0, 620.0))),
            Some(("Bravo".to_owned(), WindowId::from_raw(2))),
            "the hand moved between the last poll and the release"
        );
        assert_eq!(
            open.picked(Some((500.0, 500.0))),
            None,
            "the hand came back to the dead round, and the wheel is cancelled"
        );
    }

    fn open_at(generation: u64, dial: Dial, previewing: bool) -> Open {
        Open {
            generation,
            dial,
            slices: Vec::new(),
            windows: Vec::new(),
            hovered: None,
            stirred: true,
            previewing,
        }
    }

    fn slice(nickname: &str) -> WheelSlice {
        WheelSlice {
            nickname: nickname.to_owned(),
            class: None,
            gender: None,
            main: false,
            here: false,
        }
    }
}
