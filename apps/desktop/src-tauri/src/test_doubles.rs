use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::PoisonError;
use std::time::Instant;

use tempfile::TempDir;

use crate::app::Multifus;
use crate::app::MultifusParams;
use crate::app::journal::JournalEvent;
use crate::app::journal::Launch;
use crate::app::state::AppState;
use crate::app::state::hold;
use crate::app::view::ScreenSaverView;
use crate::config::ConfigStore;
use crate::config::Loaded;
use crate::config::Settings;
use crate::platform::Authorization;
use crate::platform::ClickGate;
use crate::platform::GameWindow;
use crate::platform::KeyLabels;
use crate::platform::PlatformError;
use crate::platform::Result;
use crate::platform::ScreenFrame;
use crate::platform::ScreenPoint;
use crate::platform::ShortTitleReport;
use crate::platform::WindowId;
use crate::platform::WindowManager;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Asked {
    Focused(WindowId),
    Maximized(WindowId),
    ShortTitles {
        short: bool,
        suffix: Option<String>,
    },
    Icon {
        window: WindowId,
        icon: Option<Vec<u8>>,
    },
    Group {
        window: WindowId,
        group: Option<String>,
    },
    ClosedForgotten,
}

#[derive(Debug, Clone)]
pub struct Desktop {
    pub game_windows: Vec<GameWindow>,
    pub client_windows: Vec<WindowId>,
    pub foreground: Option<GameWindow>,
    pub minimized: Vec<WindowId>,
    pub maximized: Vec<WindowId>,
    pub under_click: Option<WindowId>,
    pub frames: HashMap<WindowId, ScreenFrame>,
    pub tells_arrival: Option<Arc<ClickGate>>,
    pub taskbar_combines: bool,
    pub short_titles: ShortTitleReport,
    pub authorization: Authorization,
    pub scan_refusal: Option<PlatformError>,
    pub short_titles_refusal: Option<PlatformError>,
    pub icon_refusal: Option<PlatformError>,
    pub focus_refusal: Option<PlatformError>,
    pub client_windows_refusal: Option<PlatformError>,
    pub maximize_refusal: Option<PlatformError>,
}

impl Default for Desktop {
    fn default() -> Self {
        Self {
            game_windows: Vec::new(),
            client_windows: Vec::new(),
            foreground: None,
            minimized: Vec::new(),
            maximized: Vec::new(),
            under_click: None,
            frames: HashMap::new(),
            tells_arrival: None,
            taskbar_combines: true,
            short_titles: ShortTitleReport::default(),
            authorization: Authorization::Granted,
            scan_refusal: None,
            short_titles_refusal: None,
            icon_refusal: None,
            focus_refusal: None,
            client_windows_refusal: None,
            maximize_refusal: None,
        }
    }
}

#[derive(Debug, Default)]
pub struct FakeWindowManager {
    desktop: Mutex<Desktop>,
    asked: Mutex<Vec<Asked>>,
    asked_at: Mutex<Vec<Instant>>,
}

impl FakeWindowManager {
    #[must_use]
    pub fn showing(desktop: Desktop) -> Arc<Self> {
        Arc::new(Self {
            desktop: Mutex::new(desktop),
            asked: Mutex::default(),
            asked_at: Mutex::default(),
        })
    }

    pub fn show(&self, desktop: Desktop) {
        *self.desktop.lock().unwrap_or_else(PoisonError::into_inner) = desktop;
    }

    #[must_use]
    pub fn asked(&self) -> Vec<Asked> {
        self.asked
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .clone()
    }

    #[must_use]
    pub fn first_asked_at(&self) -> Option<Instant> {
        self.asked_at
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .first()
            .copied()
    }

    fn desktop(&self) -> Desktop {
        self.desktop
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .clone()
    }

    fn write_down(&self, asked: Asked) {
        self.asked
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .push(asked);
        self.asked_at
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .push(Instant::now());
    }
}

fn unless_refused<T>(refusal: Option<PlatformError>, answer: T) -> Result<T> {
    match refusal {
        Some(refusal) => Err(refusal),
        None => Ok(answer),
    }
}

impl WindowManager for FakeWindowManager {
    fn authorization(&self) -> Result<Authorization> {
        Ok(self.desktop().authorization)
    }

    fn request_authorization(&self) -> Result<Authorization> {
        Ok(self.desktop().authorization)
    }

    fn game_windows(&self) -> Result<Vec<GameWindow>> {
        let desktop = self.desktop();

        unless_refused(desktop.scan_refusal, desktop.game_windows)
    }

    fn foreground_game_window(&self) -> Result<Option<GameWindow>> {
        let desktop = self.desktop();

        unless_refused(desktop.scan_refusal, desktop.foreground)
    }

    fn window_at(&self, _at: ScreenPoint) -> Result<Option<WindowId>> {
        Ok(self.desktop().under_click)
    }

    fn window_frame(&self, window: WindowId) -> Result<Option<ScreenFrame>> {
        let desktop = self.desktop();

        unless_refused(desktop.scan_refusal, desktop.frames.get(&window).copied())
    }

    fn is_minimized(&self, window: WindowId) -> Result<bool> {
        Ok(self.desktop().minimized.contains(&window))
    }

    fn maximized_windows(&self, windows: &[WindowId]) -> Vec<WindowId> {
        let desktop = self.desktop();

        windows
            .iter()
            .filter(|window| desktop.maximized.contains(window))
            .copied()
            .collect()
    }

    fn unlock_foreground(&self) -> Result<()> {
        Ok(())
    }

    fn give_foreground_back(&self) -> Result<()> {
        Ok(())
    }

    fn focus(&self, window: WindowId) -> Result<()> {
        self.write_down(Asked::Focused(window));

        unless_refused(self.desktop().focus_refusal, ())
    }

    fn focus_fast(&self, window: WindowId) -> Result<()> {
        self.focus(window)?;

        if let Some(gate) = self.desktop().tells_arrival {
            gate.note_foreground(window);
        }

        Ok(())
    }

    fn client_windows(&self) -> Result<Vec<WindowId>> {
        let desktop = self.desktop();

        unless_refused(desktop.client_windows_refusal, desktop.client_windows)
    }

    fn maximize(&self, window: WindowId) -> Result<()> {
        self.write_down(Asked::Maximized(window));

        unless_refused(self.desktop().maximize_refusal, ())
    }

    fn apply_short_titles(&self, short: bool, suffix: Option<&str>) -> Result<ShortTitleReport> {
        self.write_down(Asked::ShortTitles {
            short,
            suffix: suffix.map(str::to_owned),
        });

        let desktop = self.desktop();

        unless_refused(desktop.short_titles_refusal, desktop.short_titles)
    }

    fn set_window_icon(&self, window: WindowId, icon: Option<&[u8]>) -> Result<()> {
        self.write_down(Asked::Icon {
            window,
            icon: icon.map(<[u8]>::to_vec),
        });

        unless_refused(self.desktop().icon_refusal, ())
    }

    fn forget_closed_windows(&self) {
        self.write_down(Asked::ClosedForgotten);
    }

    fn taskbar_combines(&self) -> Result<bool> {
        Ok(self.desktop().taskbar_combines)
    }

    fn set_window_group(&self, window: WindowId, group: Option<&str>) -> Result<()> {
        self.write_down(Asked::Group {
            window,
            group: group.map(str::to_owned),
        });

        Ok(())
    }
}

#[must_use]
pub fn directory() -> TempDir {
    TempDir::new().expect("a temporary directory")
}

#[must_use]
pub fn game_window(id: u64, nickname: &str) -> GameWindow {
    let title = format!("{nickname} - Dofus Retro v1.48.21");

    GameWindow::from_title(WindowId::from_raw(id), &title).expect("a game window")
}

#[must_use]
pub fn intact(settings: Settings) -> Loaded {
    Loaded {
        settings,
        failure: None,
        quarantined: None,
        quarantine_failure: None,
    }
}

#[must_use]
pub fn multifus(directory: &TempDir, loaded: Loaded) -> Multifus {
    Multifus::new(MultifusParams {
        store: ConfigStore::in_directory(directory.path()),
        loaded,
        version: "0.0.0".to_owned(),
        system: "test".to_owned(),
        keyboard: KeyLabels::new(),
        launch: Launch::ByHand,
        screen_saver: ScreenSaverView::Never,
        taskbar_combines: true,
    })
}

#[must_use]
pub fn app_state(directory: &TempDir, settings: Settings) -> AppState {
    Mutex::new(multifus(directory, intact(settings)))
}

#[must_use]
pub fn journalled(state: &AppState) -> Vec<JournalEvent> {
    hold(state)
        .snapshot()
        .journal
        .into_iter()
        .map(|entry| entry.event)
        .filter(|event| !matches!(event, JournalEvent::Started { .. }))
        .collect()
}
