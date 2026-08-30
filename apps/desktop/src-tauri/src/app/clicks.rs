use std::collections::HashSet;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;

use tauri::AppHandle;
use tauri::Manager;

use crate::platform::ClickGate;
use crate::platform::ClickSink;
use crate::platform::ClickWatcher;
use crate::platform::PlatformClickWatcher;
use crate::platform::Result;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Asker {
    Walk,
    Wheel,
}

#[derive(Debug, Default)]
struct Askers(HashSet<Asker>);

impl Askers {
    fn is_nobody(&self) -> bool {
        self.0.is_empty()
    }

    fn add(&mut self, asker: Asker) {
        self.0.insert(asker);
    }

    fn is_the_last_out(&mut self, asker: Asker) -> bool {
        self.0.remove(&asker) && self.0.is_empty()
    }
}

pub struct Clicks {
    gate: Arc<ClickGate>,
    sink: ClickSink,
    watcher: PlatformClickWatcher,
    askers: Mutex<Askers>,
}

impl Clicks {
    fn askers(&self) -> MutexGuard<'_, Askers> {
        self.askers.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

pub fn setup(app: &AppHandle, sink_for: impl FnOnce(Arc<ClickGate>) -> ClickSink) {
    let gate = Arc::new(ClickGate::default());
    let sink = sink_for(Arc::clone(&gate));

    app.manage(Clicks {
        gate,
        sink,
        watcher: PlatformClickWatcher::new(),
        askers: Mutex::default(),
    });
}

#[must_use]
pub fn gate(app: &AppHandle) -> Arc<ClickGate> {
    Arc::clone(&app.state::<Clicks>().gate)
}

pub fn listen(app: &AppHandle, asker: Asker) -> Result<()> {
    let clicks = app.state::<Clicks>();
    let mut askers = clicks.askers();

    if askers.is_nobody() {
        clicks
            .watcher
            .start(Arc::clone(&clicks.gate), Arc::clone(&clicks.sink))?;
    }

    askers.add(asker);

    Ok(())
}

pub fn stop(app: &AppHandle, asker: Asker) {
    let clicks = app.state::<Clicks>();
    let mut askers = clicks.askers();

    if askers.is_the_last_out(asker) {
        clicks.watcher.stop();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_first_asker_opens_the_hook_and_the_last_one_out_closes_it() {
        let mut askers = Askers::default();

        assert!(askers.is_nobody(), "nobody asked yet, and nothing listens");

        askers.add(Asker::Walk);

        assert!(!askers.is_nobody());
        assert!(
            !askers.is_the_last_out(Asker::Wheel),
            "a wheel that never asked closes nothing"
        );
        assert!(askers.is_the_last_out(Asker::Walk));
    }

    #[test]
    fn a_wheel_opened_over_a_walk_leaves_the_hook_to_it_on_the_way_out() {
        let mut askers = Askers::default();

        askers.add(Asker::Walk);
        askers.add(Asker::Wheel);

        assert!(
            !askers.is_the_last_out(Asker::Wheel),
            "the walk is still there to take the clicks"
        );
        assert!(askers.is_the_last_out(Asker::Walk));
    }

    #[test]
    fn the_same_asker_twice_is_one_asker() {
        let mut askers = Askers::default();

        askers.add(Asker::Wheel);
        askers.add(Asker::Wheel);

        assert!(askers.is_the_last_out(Asker::Wheel));
        assert!(askers.is_nobody());
    }
}
