use std::cell::Cell;
use std::cell::RefCell;
use std::panic;
use std::panic::AssertUnwindSafe;
use std::panic::catch_unwind;

use tauri::AppHandle;

use crate::app::journal::JournalEvent;
use crate::app::journal_file;
use crate::app::state::lock_if_free;

thread_local! {
    static INSIDE_A_GUARD: Cell<bool> = const { Cell::new(false) };
    static CAUGHT: RefCell<Option<String>> = const { RefCell::new(None) };
}

pub fn watch(app: &AppHandle) {
    let app = app.clone();
    let previous = panic::take_hook();

    panic::set_hook(Box::new(move |info| {
        let detail = info.to_string();

        if INSIDE_A_GUARD.get() {
            CAUGHT.replace(Some(detail));
        } else {
            let event = JournalEvent::PanickedElsewhere { detail };

            match lock_if_free(&app) {
                Some(mut state) => {
                    state.log_unless_repeated(event);
                }
                None => journal_file::append_unnumbered(&event),
            }
        }

        previous(info);
    }));
}

pub fn guard<T>(work: impl FnOnce() -> T) -> Result<T, String> {
    let outer = INSIDE_A_GUARD.replace(true);
    let done = catch_unwind(AssertUnwindSafe(work));

    INSIDE_A_GUARD.set(outer);

    done.map_err(|_| CAUGHT.take().unwrap_or_default())
}
