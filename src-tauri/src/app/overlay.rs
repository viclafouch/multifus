use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::sync::atomic::AtomicU64;
use std::sync::atomic::Ordering;
use std::thread;

use tauri::AppHandle;
use tauri::EventTarget;
use tauri::LogicalSize;
use tauri::Manager;
use tauri::WebviewUrl;
use tauri::WebviewWindow;
use tauri::WebviewWindowBuilder;

use crate::app::journal::JournalEvent;
use crate::app::journal::Work;
use crate::app::state::lock;

#[derive(Debug, Default)]
pub struct Generation {
    latest: AtomicU64,
}

impl Generation {
    pub fn next(&self) -> u64 {
        self.latest.fetch_add(1, Ordering::AcqRel) + 1
    }

    pub fn matches_latest(&self, generation: u64) -> bool {
        self.latest.load(Ordering::Acquire) == generation
    }
}

#[derive(Debug, Default)]
pub struct Acknowledged {
    seen: AtomicU64,
}

impl Acknowledged {
    pub fn acknowledge(&self, generation: u64) {
        self.seen.fetch_max(generation, Ordering::AcqRel);
    }

    pub fn matches_acknowledged(&self, generation: u64) -> bool {
        self.seen.load(Ordering::Acquire) >= generation
    }
}

#[must_use]
pub fn holds_point(edge: f64, room: f64, at: f64) -> bool {
    at >= edge && at < edge + room
}

pub struct Overlay {
    pub label: &'static str,
    pub page: &'static str,
    pub thread: &'static str,
    pub work: Work,
    pub failed: fn(String) -> JournalEvent,
    pub accepts_first_mouse: bool,
}

impl Overlay {
    pub fn target(&self) -> EventTarget {
        EventTarget::webview_window(self.label)
    }

    pub fn window(&self, app: &AppHandle) -> Option<WebviewWindow> {
        app.get_webview_window(self.label)
    }

    pub fn said(&self, app: &AppHandle, told: tauri::Result<()>) {
        if let Err(error) = told {
            self.complain(app, error.to_string());
        }
    }

    pub fn complain(&self, app: &AppHandle, detail: String) {
        lock(app).log_unless_repeated((self.failed)(detail));
    }

    pub fn build(&self, app: &AppHandle, size: LogicalSize<f64>) -> Option<WebviewWindow> {
        let built = WebviewWindowBuilder::new(app, self.label, WebviewUrl::App(self.page.into()))
            .title("Multifus")
            .inner_size(size.width, size.height)
            .decorations(false)
            .transparent(true)
            .always_on_top(true)
            .skip_taskbar(true)
            .focusable(false)
            .focused(false)
            .accept_first_mouse(self.accepts_first_mouse)
            .resizable(false)
            .shadow(false)
            .visible(false)
            .visible_on_all_workspaces(true)
            .build();

        match built {
            Ok(window) => Some(window),
            Err(error) => {
                self.complain(app, error.to_string());

                None
            }
        }
    }

    pub fn apart(&self, app: &AppHandle, work: impl FnOnce(&AppHandle) + Send + 'static) -> bool {
        let panicked = self.work;
        let spawned = thread::Builder::new().name(self.thread.to_owned()).spawn({
            let app = app.clone();

            move || {
                if catch_unwind(AssertUnwindSafe(|| work(&app))).is_err() {
                    lock(&app).log_unless_repeated(JournalEvent::Panicked { work: panicked });
                }
            }
        });

        if let Err(error) = spawned {
            self.complain(app, error.to_string());

            return false;
        }

        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_screen_holds_its_first_point_and_leaves_the_first_of_the_next_one() {
        assert!(holds_point(1920.0, 1920.0, 1920.0));
        assert!(!holds_point(1920.0, 1920.0, 3840.0));
        assert!(!holds_point(1920.0, 1920.0, 1919.0));
    }

    #[test]
    fn an_overlay_that_a_newer_one_replaced_no_longer_speaks_for_itself() {
        let generation = Generation::default();
        let first = generation.next();
        let second = generation.next();

        assert_ne!(first, second);
        assert!(generation.matches_latest(second));
        assert!(
            !generation.matches_latest(first),
            "the opening that was asked for first must not close the one showing now"
        );
    }

    #[test]
    fn an_acknowledgement_stands_for_every_generation_before_it() {
        let wiped = Acknowledged::default();

        assert!(!wiped.matches_acknowledged(2));

        wiped.acknowledge(2);

        assert!(wiped.matches_acknowledged(2));
        assert!(
            wiped.matches_acknowledged(1),
            "a window wiped for a newer opening is wiped for the older one too"
        );
        assert!(!wiped.matches_acknowledged(3));
    }

    #[test]
    fn an_acknowledgement_that_arrives_late_does_not_undo_a_newer_one() {
        let wiped = Acknowledged::default();

        wiped.acknowledge(5);
        wiped.acknowledge(2);

        assert!(
            wiped.matches_acknowledged(5),
            "the answer of an older opening must not take the newer one back"
        );
    }
}
