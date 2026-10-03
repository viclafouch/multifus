use std::sync::Arc;
use std::sync::Mutex;
use std::sync::PoisonError;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::time::Duration;
use std::time::Instant;

use tauri::AppHandle;
use tauri::Manager;

use crate::platform::Authorization;
use crate::platform::GameWindow;
use crate::platform::Result;
use crate::platform::ScreenFrame;
use crate::platform::ScreenPoint;
use crate::platform::ShortTitleReport;
use crate::platform::WindowIcon;
use crate::platform::WindowId;
use crate::platform::WindowManager;
use crate::platform::matches_game_in_front;

const HANDING_BACK: Duration = Duration::from_millis(600);

#[derive(Debug, Default)]
pub struct Keyboard {
    notes_holding: AtomicBool,
    front: Mutex<Option<WindowId>>,
    handing_back_until: Mutex<Option<Instant>>,
}

impl Keyboard {
    #[must_use]
    pub fn matches_notes_holding(&self) -> bool {
        self.notes_holding.load(Ordering::Acquire)
    }

    pub fn notes_take(&self) {
        self.notes_holding.store(true, Ordering::Release);
    }

    pub fn notes_let_go(&self) {
        self.notes_holding.store(false, Ordering::Release);
        *self.handing_back() = None;
    }

    #[must_use]
    pub fn matches_handing_back(&self) -> bool {
        self.handing_back()
            .is_some_and(|until| Instant::now() < until)
    }

    fn start_handing_back(&self) {
        *self.handing_back() = Some(Instant::now() + HANDING_BACK);
    }

    fn front(&self) -> Option<WindowId> {
        *self.front.lock().unwrap_or_else(PoisonError::into_inner)
    }

    fn note_front(&self, window: WindowId) {
        *self.front.lock().unwrap_or_else(PoisonError::into_inner) = Some(window);
    }

    fn handing_back(&self) -> std::sync::MutexGuard<'_, Option<Instant>> {
        self.handing_back_until
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
    }
}

#[must_use]
pub fn keyboard(app: &AppHandle) -> &Keyboard {
    app.state::<Arc<Keyboard>>().inner()
}

#[must_use]
pub fn matches_in_the_game(windows: &dyn WindowManager, keyboard: &Keyboard) -> bool {
    keyboard.matches_notes_holding() || matches_game_in_front(windows)
}

pub struct KeyboardAware {
    windows: Arc<dyn WindowManager>,
    keyboard: Arc<Keyboard>,
}

impl KeyboardAware {
    #[must_use]
    pub fn new(windows: Arc<dyn WindowManager>, keyboard: Arc<Keyboard>) -> Self {
        Self { windows, keyboard }
    }

    fn client_in_front(&self) -> Result<Option<GameWindow>> {
        let clients = self.windows.game_windows()?;
        let wanted = match self.keyboard.front() {
            Some(front) if clients.iter().any(|client| client.id() == front) => Some(front),
            _ => self.windows.highest_game_window()?,
        };

        Ok(wanted.and_then(|wanted| clients.into_iter().find(|client| client.id() == wanted)))
    }

    fn switch(
        &self,
        window: WindowId,
        focus: impl FnOnce(&dyn WindowManager) -> Result<()>,
    ) -> Result<()> {
        if self.keyboard.matches_notes_holding() {
            self.keyboard.start_handing_back();
            self.windows.raise(window)?;
        } else {
            focus(self.windows.as_ref())?;
        }

        self.keyboard.note_front(window);

        Ok(())
    }
}

impl WindowManager for KeyboardAware {
    fn authorization(&self) -> Result<Authorization> {
        self.windows.authorization()
    }

    fn request_authorization(&self) -> Result<Authorization> {
        self.windows.request_authorization()
    }

    fn game_windows(&self) -> Result<Vec<GameWindow>> {
        self.windows.game_windows()
    }

    fn foreground_game_window(&self) -> Result<Option<GameWindow>> {
        let found = self.windows.foreground_game_window()?;

        if let Some(window) = &found {
            self.keyboard.note_front(window.id());

            return Ok(found);
        }

        if !self.keyboard.matches_notes_holding() {
            return Ok(None);
        }

        self.client_in_front()
    }

    fn highest_game_window(&self) -> Result<Option<WindowId>> {
        self.windows.highest_game_window()
    }

    fn window_at(&self, at: ScreenPoint) -> Result<Option<WindowId>> {
        self.windows.window_at(at)
    }

    fn window_frame(&self, window: WindowId) -> Result<Option<ScreenFrame>> {
        self.windows.window_frame(window)
    }

    fn is_minimized(&self, window: WindowId) -> Result<bool> {
        self.windows.is_minimized(window)
    }

    fn maximized_windows(&self, windows: &[WindowId]) -> Vec<WindowId> {
        self.windows.maximized_windows(windows)
    }

    fn unlock_foreground(&self) -> Result<()> {
        self.windows.unlock_foreground()
    }

    fn give_foreground_back(&self) -> Result<()> {
        self.windows.give_foreground_back()
    }

    fn focus(&self, window: WindowId) -> Result<()> {
        self.switch(window, |windows| windows.focus(window))
    }

    fn focus_fast(&self, window: WindowId) -> Result<()> {
        self.switch(window, |windows| windows.focus_fast(window))
    }

    fn raise(&self, window: WindowId) -> Result<()> {
        self.windows.raise(window)
    }

    fn client_windows(&self) -> Result<Vec<WindowId>> {
        self.windows.client_windows()
    }

    fn maximize(&self, window: WindowId) -> Result<()> {
        self.windows.maximize(window)
    }

    fn apply_short_titles(&self, short: bool, suffix: Option<&str>) -> Result<ShortTitleReport> {
        self.windows.apply_short_titles(short, suffix)
    }

    fn set_window_icon(&self, window: WindowId, icon: Option<WindowIcon<'_>>) -> Result<()> {
        self.windows.set_window_icon(window, icon)
    }

    fn forget_closed_windows(&self) {
        self.windows.forget_closed_windows();
    }

    fn taskbar_combines(&self) -> Result<bool> {
        self.windows.taskbar_combines()
    }

    fn set_window_group(&self, window: WindowId, group: Option<&str>) -> Result<()> {
        self.windows.set_window_group(window, group)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_doubles::Asked;
    use crate::test_doubles::Desktop;
    use crate::test_doubles::FakeWindowManager;
    use crate::test_doubles::game_window;

    fn alpha() -> GameWindow {
        game_window(1, "Alpha")
    }

    fn bravo() -> GameWindow {
        game_window(2, "Bravo")
    }

    fn two_clients(foreground: Option<GameWindow>) -> Desktop {
        Desktop {
            game_windows: vec![alpha(), bravo()],
            foreground,
            highest: Some(bravo().id()),
            ..Desktop::default()
        }
    }

    fn aware(desktop: Desktop) -> (Arc<FakeWindowManager>, Arc<Keyboard>, KeyboardAware) {
        let platform = FakeWindowManager::showing(desktop);
        let keyboard = Arc::new(Keyboard::default());
        let windows = KeyboardAware::new(platform.clone(), Arc::clone(&keyboard));

        (platform, keyboard, windows)
    }

    #[test]
    fn the_notes_holding_the_keyboard_are_in_the_game_even_with_no_client_in_front() {
        let (_platform, keyboard, windows) = aware(Desktop::default());

        assert!(!matches_in_the_game(&windows, &keyboard));

        keyboard.notes_take();

        assert!(
            matches_in_the_game(&windows, &keyboard),
            "the shortcut that opened the notes has to be able to close them"
        );

        keyboard.notes_let_go();

        assert!(!matches_in_the_game(&windows, &keyboard));
    }

    #[test]
    fn the_client_in_front_stays_known_while_the_notes_hold_the_keyboard() {
        let (platform, keyboard, windows) = aware(two_clients(Some(alpha())));

        assert_eq!(windows.foreground_game_window(), Ok(Some(alpha())));

        keyboard.notes_take();
        platform.show(two_clients(None));

        assert_eq!(
            windows.foreground_game_window(),
            Ok(Some(alpha())),
            "« Personnage suivant » starts from the client the player was looking at"
        );
        assert!(matches_game_in_front(&windows));

        keyboard.notes_let_go();

        assert_eq!(
            windows.foreground_game_window(),
            Ok(None),
            "the notes no longer write, so the window in front is whatever the system says"
        );
    }

    #[test]
    fn a_client_gone_while_the_notes_hold_the_keyboard_gives_way_to_the_highest() {
        let (platform, keyboard, windows) = aware(two_clients(Some(alpha())));

        assert_eq!(windows.foreground_game_window(), Ok(Some(alpha())));

        keyboard.notes_take();
        platform.show(Desktop {
            game_windows: vec![bravo()],
            ..two_clients(None)
        });

        assert_eq!(windows.foreground_game_window(), Ok(Some(bravo())));
    }

    #[test]
    fn a_switch_while_the_notes_hold_the_keyboard_leaves_it_in_the_notes() {
        let (platform, keyboard, windows) = aware(two_clients(None));

        keyboard.notes_take();

        windows
            .focus(bravo().id())
            .expect("the switch goes through");
        windows
            .focus_fast(alpha().id())
            .expect("the switch goes through");

        assert_eq!(
            platform.asked(),
            vec![Asked::Raised(bravo().id()), Asked::Raised(alpha().id())],
            "a client handed the keyboard would take the end of the sentence"
        );
        assert!(keyboard.matches_handing_back());
        assert_eq!(
            windows.foreground_game_window(),
            Ok(Some(alpha())),
            "the client the switch brought in front is the one in front"
        );
    }

    #[test]
    fn a_switch_with_the_notes_idle_hands_the_keyboard_to_the_client_as_ever() {
        let (platform, keyboard, windows) = aware(two_clients(Some(alpha())));

        windows
            .focus(bravo().id())
            .expect("the switch goes through");

        assert_eq!(platform.asked(), vec![Asked::Focused(bravo().id())]);
        assert!(!keyboard.matches_handing_back());
    }

    #[test]
    fn letting_go_of_the_keyboard_ends_the_handing_back() {
        let keyboard = Keyboard::default();

        keyboard.notes_take();
        keyboard.start_handing_back();
        keyboard.notes_let_go();

        assert!(!keyboard.matches_handing_back());
        assert!(!keyboard.matches_notes_holding());
    }
}
