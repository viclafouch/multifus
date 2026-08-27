use tempfile::TempDir;

use multifus_lib::app::journal::Launch;
use multifus_lib::app::view::ScreenSaverView;
use multifus_lib::app::Multifus;
use multifus_lib::app::MultifusParams;
use multifus_lib::config::ConfigStore;
use multifus_lib::platform::GameWindow;
use multifus_lib::platform::WindowId;

const CLIENT_TITLE_SUFFIX: &str = " - Dofus Retro v1.48.21";

pub fn title_of(nickname: &str) -> String {
    format!("{nickname}{CLIENT_TITLE_SUFFIX}")
}

pub fn opened(launch: Launch) -> (TempDir, Multifus) {
    let directory = TempDir::new().expect("a temporary directory");
    let state = reopened(&directory, launch);

    (directory, state)
}

pub fn reopened(directory: &TempDir, launch: Launch) -> Multifus {
    let store = ConfigStore::in_directory(directory.path());
    let loaded = store.load();

    Multifus::new(MultifusParams {
        store,
        loaded,
        version: "0.1.0".to_owned(),
        system: "test".to_owned(),
        launch,
        screen_saver: ScreenSaverView::Never,
        taskbar_combines: true,
    })
}

pub fn client(window: u64, nickname: &str) -> GameWindow {
    GameWindow::from_title(WindowId::from_raw(window), &title_of(nickname)).expect("a game window")
}

pub fn nicknames(state: &Multifus) -> Vec<String> {
    state
        .snapshot()
        .characters
        .into_iter()
        .map(|character| character.nickname)
        .collect()
}

pub fn in_cycle(state: &Multifus) -> Vec<String> {
    state
        .snapshot()
        .characters
        .into_iter()
        .filter(|character| character.online && !character.excluded)
        .map(|character| character.nickname)
        .collect()
}

pub fn paint_everything(state: &mut Multifus) {
    for painting in state.looks_to_paint() {
        state.remember_painted(&painting);
    }
}
