use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::sync::atomic::AtomicU64;
use std::sync::atomic::Ordering;
use std::thread;
use std::time::Duration;
use std::time::Instant;

use serde_json::Value;
use tauri::AppHandle;
use tauri::LogicalPosition;
use tauri::LogicalSize;
use tauri::Manager;
use tauri::WebviewUrl;
use tauri::WebviewWindow;
use tauri::WebviewWindowBuilder;
use tauri::WindowEvent;
use tauri::window::Color;

use crate::app::alarm::Alarm;
use crate::app::journal::JournalEvent;
use crate::app::journal::Work;
use crate::app::keyboard::keyboard;
use crate::app::overlay::Overlay;
use crate::app::overlay::WorkArea;
use crate::app::overlay::primary_screen;
use crate::app::overlay::screens;
use crate::app::shortcuts;
use crate::app::state::lock;
use crate::app::tray;
use crate::config::NoteLoaded;
use crate::config::NoteStore;
use crate::config::NotesPlace;
use crate::config::note::matches_a_note;
use crate::platform;

const OVERLAY: Overlay = Overlay {
    label: "notes",
    page: "notes.html",
    thread: "multifus-notes",
    work: Work::Notes,
    failed: |detail| JournalEvent::NotesFailed { detail },
    accepts_first_mouse: true,
};

const FIRST_WIDTH: f64 = 340.0;

const FIRST_HEIGHT: f64 = 440.0;

const NARROWEST: f64 = 280.0;

const SHORTEST: f64 = 180.0;

const MARGIN: f64 = 32.0;

const BAR_HEIGHT: f64 = 36.0;

const PAPER: Color = Color(18, 15, 11, 255);

const QUIET: Duration = Duration::from_millis(700);

const LONGEST_UNSAVED: Duration = Duration::from_secs(5);

const IDLE: Duration = Duration::from_secs(3600);

static NEXT_KEEP: Alarm = Alarm::new();

#[derive(Debug, Default)]
struct Kept {
    note: Option<Value>,
    store: Option<NoteStore>,
    is_note_unsaved: bool,
    is_place_unsaved: bool,
}

impl Kept {
    fn take_unsaved(&mut self) -> (Option<(NoteStore, Value)>, bool) {
        let note = if self.is_note_unsaved {
            self.store.clone().zip(self.note.clone())
        } else {
            None
        };

        self.is_note_unsaved = false;

        (note, std::mem::take(&mut self.is_place_unsaved))
    }
}

#[derive(Debug, Default)]
struct Notes {
    kept: Mutex<Kept>,
    keeping: Mutex<()>,
    building: Mutex<()>,
    stirred: AtomicU64,
}

impl Notes {
    fn kept(&self) -> MutexGuard<'_, Kept> {
        self.kept.lock().unwrap_or_else(PoisonError::into_inner)
    }

    fn stir(&self) {
        self.stirred.fetch_add(1, Ordering::AcqRel);

        NEXT_KEEP.wake();
    }

    fn stirred(&self) -> u64 {
        self.stirred.load(Ordering::Acquire)
    }
}

pub fn setup(app: &AppHandle) {
    let store = NoteStore::for_app(app).ok();
    let loaded = store.as_ref().map_or(NoteLoaded::Blank, NoteStore::load);
    let is_writable = loaded.matches_writable();

    let note = match loaded {
        NoteLoaded::Blank => None,
        NoteLoaded::Read(note) => Some(note),
        NoteLoaded::SetAside { detail, path } => {
            lock(app).log(JournalEvent::NoteLoadFailed {
                detail,
                set_aside: Some(path.display().to_string()),
            });

            None
        }
        NoteLoaded::Stuck { detail } => {
            lock(app).log(JournalEvent::NoteLoadFailed {
                detail,
                set_aside: None,
            });

            None
        }
    };

    app.manage(Notes {
        kept: Mutex::new(Kept {
            note,
            store: store.filter(|_| is_writable),
            ..Kept::default()
        }),
        ..Notes::default()
    });

    keep_apart(app);
}

#[must_use]
pub fn note(app: &AppHandle) -> Option<Value> {
    app.state::<Notes>().kept().note.clone()
}

pub fn write(app: &AppHandle, note: Value) {
    if !matches_a_note(&note) {
        return;
    }

    let notes = app.state::<Notes>();

    {
        let mut kept = notes.kept();

        kept.note = Some(note);
        kept.is_note_unsaved = true;
    }

    notes.stir();
}

pub fn keep(app: &AppHandle) {
    let notes = app.state::<Notes>();
    let _keeping = notes.keeping.lock().unwrap_or_else(PoisonError::into_inner);
    let (unsaved_note, is_place_unsaved) = notes.kept().take_unsaved();

    if let Some((store, note)) = unsaved_note
        && let Err(error) = store.save(&note)
    {
        notes.kept().is_note_unsaved = true;

        lock(app).log_unless_repeated(JournalEvent::NoteSaveFailed {
            detail: error.to_string(),
        });
    }

    if is_place_unsaved {
        lock(app).save();
    }
}

fn keep_apart(app: &AppHandle) {
    OVERLAY.apart(app, |app| {
        let notes = app.state::<Notes>();

        loop {
            NEXT_KEEP.wait(Duration::ZERO, IDLE);

            settle(&notes);
            keep(app);
        }
    });
}

fn settle(notes: &Notes) {
    let started = Instant::now();

    loop {
        let seen = notes.stirred();

        thread::sleep(QUIET);

        if notes.stirred() == seen || started.elapsed() >= LONGEST_UNSAVED {
            return;
        }
    }
}

pub fn toggle(app: &AppHandle) {
    if lock(app).are_notes_open() {
        close(app);
    } else {
        open(app);
    }
}

fn open(app: &AppHandle) {
    let Some(window) = OVERLAY.window(app).or_else(|| build(app)) else {
        return;
    };

    lay(app, &window);
    reveal(app, &window);
    take_keyboard(app);

    lock(app).set_notes_shown(true);

    tray::refresh(app);
}

pub fn close(app: &AppHandle) {
    let_keyboard_go(app);

    if let Some(window) = OVERLAY.window(app)
        && window.is_visible().unwrap_or(false)
    {
        OVERLAY.said(app, window.hide());
    }

    lock(app).set_notes_shown(false);

    keep(app);

    tray::refresh(app);
}

pub fn note_foreground(app: &AppHandle) {
    let keyboard = keyboard(app);

    if keyboard.matches_notes_holding() && keyboard.matches_handing_back() {
        take_keyboard(app);
    }
}

fn follow(app: &AppHandle, event: &WindowEvent) {
    match event {
        WindowEvent::Focused(true) => {
            keyboard(app).notes_take();

            shortcuts::note_foreground(app);
        }
        WindowEvent::Focused(false) => lose_keyboard(app),
        WindowEvent::Moved(_) | WindowEvent::Resized(_) => remember_place(app),
        WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();

            close(app);
        }
        _ => {}
    }
}

fn let_keyboard_go(app: &AppHandle) {
    #[cfg(target_os = "macos")]
    platform::let_keyboard_go();

    keyboard(app).notes_let_go();

    shortcuts::note_foreground(app);
}

fn remember_place(app: &AppHandle) {
    let Some(window) = OVERLAY.window(app) else {
        return;
    };

    if !window.is_visible().unwrap_or(false) {
        return;
    }

    let Some(place) = place_of(&window) else {
        return;
    };

    if !lock(app).set_notes_place(place) {
        return;
    }

    let notes = app.state::<Notes>();

    notes.kept().is_place_unsaved = true;
    notes.stir();
}

fn place_of(window: &WebviewWindow) -> Option<NotesPlace> {
    let scale = window.scale_factor().ok()?;
    let at = window.outer_position().ok()?.to_logical::<f64>(scale);
    let size = window.inner_size().ok()?.to_logical::<f64>(scale);

    Some(NotesPlace {
        x: at.x,
        y: at.y,
        width: size.width,
        height: size.height,
    })
}

fn lay(app: &AppHandle, window: &WebviewWindow) {
    let saved = lock(app).notes_place();
    let areas = screens(app)
        .unwrap_or_default()
        .into_iter()
        .map(|screen| screen.area)
        .collect::<Vec<_>>();
    let primary = primary_screen(app).map(|screen| screen.area);

    let Some(place) = placed(saved, &areas, primary) else {
        return;
    };

    let laid = window
        .set_size(LogicalSize::new(place.width, place.height))
        .and_then(|()| window.set_position(LogicalPosition::new(place.x, place.y)));

    OVERLAY.said(app, laid);
}

fn placed(
    saved: Option<NotesPlace>,
    areas: &[WorkArea],
    primary: Option<WorkArea>,
) -> Option<NotesPlace> {
    let reachable = saved.filter(|saved| {
        areas
            .iter()
            .any(|area| area.holds(saved.x + saved.width / 2.0, saved.y + BAR_HEIGHT / 2.0))
    });

    reachable.or_else(|| primary.or_else(|| areas.first().copied()).map(first_place))
}

fn first_place(area: WorkArea) -> NotesPlace {
    let width = FIRST_WIDTH.min(area.width);
    let height = FIRST_HEIGHT.min(area.height);

    NotesPlace {
        x: (area.x + area.width - width - MARGIN).max(area.x),
        y: area.y + (area.height - height) / 2.0,
        width,
        height,
    }
}

pub fn build(app: &AppHandle) -> Option<WebviewWindow> {
    let notes = app.state::<Notes>();
    let _building = notes
        .building
        .lock()
        .unwrap_or_else(PoisonError::into_inner);

    if let Some(window) = OVERLAY.window(app) {
        return Some(window);
    }

    let built = WebviewWindowBuilder::new(app, OVERLAY.label, WebviewUrl::App(OVERLAY.page.into()))
        .title("Multifus")
        .inner_size(FIRST_WIDTH, FIRST_HEIGHT)
        .min_inner_size(NARROWEST, SHORTEST)
        .decorations(false)
        .resizable(true)
        .maximizable(false)
        .minimizable(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .focusable(true)
        .focused(false)
        .accept_first_mouse(OVERLAY.accepts_first_mouse)
        .shadow(true)
        .background_color(PAPER)
        .visible(false)
        .visible_on_all_workspaces(true)
        .build();

    let window = match built {
        Ok(window) => window,
        Err(error) => {
            OVERLAY.complain(app, error.to_string());

            return None;
        }
    };

    window.on_window_event({
        let app = app.clone();

        move |event| follow(&app, event)
    });

    pose(app, &window);

    Some(window)
}

#[cfg(target_os = "macos")]
fn pose(app: &AppHandle, window: &WebviewWindow) {
    OVERLAY.through_the_handle(app, window, platform::pose_as_notes_panel);
}

#[cfg(not(target_os = "macos"))]
fn pose(_app: &AppHandle, _window: &WebviewWindow) {}

#[cfg(target_os = "macos")]
fn reveal(app: &AppHandle, window: &WebviewWindow) {
    OVERLAY.through_the_handle(app, window, platform::show_notes);
}

#[cfg(not(target_os = "macos"))]
fn reveal(app: &AppHandle, window: &WebviewWindow) {
    OVERLAY.said(app, window.show());
}

pub fn take_keyboard(app: &AppHandle) {
    if let Some(window) = OVERLAY.window(app) {
        OVERLAY.through_the_handle(app, &window, platform::take_keyboard);
    }
}

fn lose_keyboard(app: &AppHandle) {
    if cfg!(target_os = "macos") && keyboard(app).matches_handing_back() {
        take_keyboard(app);

        return;
    }

    let_keyboard_go(app);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn screen_at(x: f64) -> WorkArea {
        WorkArea {
            x,
            y: 0.0,
            width: 1920.0,
            height: 1040.0,
        }
    }

    fn left_on(x: f64) -> NotesPlace {
        NotesPlace {
            x,
            y: 200.0,
            width: 360.0,
            height: 480.0,
        }
    }

    #[test]
    fn the_notes_open_where_the_player_left_them_on_any_screen_still_there() {
        let screens = [screen_at(0.0), screen_at(1920.0)];

        assert_eq!(
            placed(Some(left_on(2400.0)), &screens, Some(screens[0])),
            Some(left_on(2400.0))
        );
    }

    #[test]
    fn notes_left_on_a_screen_now_gone_come_back_to_the_first_place_on_the_main_one() {
        let main = screen_at(0.0);
        let back = placed(Some(left_on(2400.0)), &[main], Some(main))
            .expect("a screen is there to hold them");

        assert!(
            main.holds(back.x, back.y) && main.holds(back.x + back.width - 1.0, back.y),
            "the bar has to be within reach to move them again"
        );
        assert_eq!(back, first_place(main));
    }

    #[test]
    fn notes_pushed_until_their_bar_left_every_screen_come_back_too() {
        let main = screen_at(0.0);
        let bar_above_the_screen = NotesPlace {
            y: -300.0,
            ..left_on(400.0)
        };

        assert_eq!(
            placed(Some(bar_above_the_screen), &[main], Some(main)),
            Some(first_place(main))
        );
    }

    #[test]
    fn the_first_place_never_spills_off_a_small_screen() {
        let small = WorkArea {
            x: 0.0,
            y: 0.0,
            width: 300.0,
            height: 400.0,
        };
        let place = first_place(small);

        assert!(place.x >= small.x && place.width <= small.width);
        assert!(place.y >= small.y && place.height <= small.height);
    }

    #[test]
    fn a_turn_hands_what_is_unsaved_to_the_save_once() {
        let mut kept = Kept {
            note: Some(serde_json::json!({ "type": "doc" })),
            store: Some(NoteStore::in_directory("/nowhere")),
            is_note_unsaved: true,
            is_place_unsaved: true,
        };

        let (note, is_place_unsaved) = kept.take_unsaved();

        assert!(note.is_some());
        assert!(is_place_unsaved);
        assert_eq!(
            kept.take_unsaved(),
            (None, false),
            "a turn with nothing new writes nothing"
        );
    }

    #[test]
    fn a_note_that_could_not_be_set_aside_is_never_handed_to_a_save() {
        let mut kept = Kept {
            note: Some(serde_json::json!({ "type": "doc" })),
            store: None,
            is_note_unsaved: true,
            is_place_unsaved: false,
        };

        assert_eq!(kept.take_unsaved(), (None, false));
    }
}
