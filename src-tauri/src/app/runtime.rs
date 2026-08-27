use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::sync::Condvar;
use std::sync::LazyLock;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::sync::TryLockError;
use std::thread;
use std::time::Duration;

use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;
use tauri::RunEvent;
use tauri_plugin_opener::OpenerExt;

use crate::app::journal::JournalEvent;
use crate::app::journal::Outcome;
use crate::app::journal::Work;
use crate::app::main_window;
use crate::app::portraits;
use crate::app::relay;
use crate::app::state::hold;
use crate::app::state::lock;
use crate::app::state::windows;
use crate::app::state::AppState;
use crate::app::state::Decision;
use crate::app::state::Multifus;
use crate::app::state::Painting;
use crate::app::state::ScanChange;
use crate::app::state::TracedWindow;
use crate::app::state::WatcherState;
use crate::app::tray;
use crate::app::view::Screen;
use crate::app::view::Snapshot;
use crate::app::walk;
use crate::domain::GameNotification;
use crate::platform::NotificationReport;
use crate::platform::NotificationSink;
use crate::platform::NotificationWatcher;
use crate::platform::PlatformError;
use crate::platform::PlatformNotificationWatcher;
use crate::platform::WindowId;
use crate::platform::WindowManager;

const SCAN_INTERVAL: Duration = Duration::from_secs(1);

static NEXT_TURN: LazyLock<(Mutex<bool>, Condvar)> =
    LazyLock::new(|| (Mutex::new(false), Condvar::new()));

#[cfg(target_os = "macos")]
const AUTHORIZATION_SETTINGS_URL: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

#[cfg(target_os = "windows")]
const AUTHORIZATION_SETTINGS_URL: &str = "ms-settings:privacy-notifications";

pub const SNAPSHOT_EVENT: &str = "multifus://snapshot";

pub const NAVIGATE_EVENT: &str = "multifus://navigate";

pub fn start(app: AppHandle) {
    let spawned = thread::Builder::new()
        .name("multifus-window-scan".to_owned())
        .spawn({
            let app = app.clone();

            move || loop {
                if catch_unwind(AssertUnwindSafe(|| tick(&app))).is_err() {
                    lock(&app).log_unless_repeated(JournalEvent::Panicked { work: Work::Scan });
                }

                wait_for_next_turn();
            }
        });

    if let Err(error) = spawned {
        lock(&app).log(JournalEvent::ScanFailed {
            detail: error.to_string(),
        });
    }
}

fn wait_for_next_turn() {
    let (asked, alarm) = &*NEXT_TURN;
    let mut guard = asked.lock().unwrap_or_else(PoisonError::into_inner);

    if !*guard {
        let (waited, _) = alarm
            .wait_timeout(guard, SCAN_INTERVAL)
            .unwrap_or_else(PoisonError::into_inner);

        guard = waited;
    }

    *guard = false;
}

pub fn wake() {
    let (asked, alarm) = &*NEXT_TURN;

    *asked.lock().unwrap_or_else(PoisonError::into_inner) = true;

    alarm.notify_one();
}

struct Turn<'a> {
    windows: &'a dyn WindowManager,
    state: &'a AppState,
}

impl<'a> Turn<'a> {
    fn of(app: &'a AppHandle) -> Self {
        Self {
            windows: windows(app),
            state: app.state::<AppState>().inner(),
        }
    }

    fn hold(&self) -> MutexGuard<'_, Multifus> {
        hold(self.state)
    }
}

fn tick(app: &AppHandle) {
    let turn = Turn::of(app);

    let renamed = apply_short_titles(&turn);
    let changed = scan(app);
    let maximized = maximize_new_clients(&turn);
    let painted = apply_window_icons(&turn);
    let regrouped = follow_taskbar(&turn);

    let walk_stopped = walk::refresh(app);

    if changed || maximized || renamed || painted || regrouped || walk_stopped {
        emit_snapshot(app);
    }
}

fn scan(app: &AppHandle) -> bool {
    let change = refresh_windows(&Turn::of(app));
    let listening_changed = follow_authorization(app);

    relay::run::announce(app, &change);

    let display_changed = relay::run::follow_display(app);

    change.changed || listening_changed || display_changed
}

fn maximize_new_clients(turn: &Turn) -> bool {
    if !turn.hold().maximizes_on_launch() {
        turn.hold().forget_client_windows();

        return false;
    }

    let client_windows = match turn.windows.client_windows() {
        Ok(client_windows) => client_windows,
        Err(PlatformError::AuthorizationDenied) => return false,
        Err(error) => {
            return turn
                .hold()
                .log_unless_repeated(JournalEvent::ClientMaximizeFailed {
                    detail: error.to_string(),
                })
        }
    };

    let appeared = turn.hold().take_appeared_client_windows(&client_windows);
    let mut written = false;

    for window in appeared {
        let filled = turn.windows.maximize(window);
        let mut state = turn.hold();

        written |= match filled {
            Ok(()) => {
                state.remember_client_window(window);
                state.log(JournalEvent::ClientMaximized);

                true
            }
            Err(error) => state.log_unless_repeated(JournalEvent::ClientMaximizeFailed {
                detail: error.to_string(),
            }),
        };
    }

    written
}

fn apply_short_titles(turn: &Turn) -> bool {
    let (short, suffix) = {
        let state = turn.hold();

        (state.shortens_titles(), state.client_title_suffix())
    };

    let written = turn.windows.apply_short_titles(short, suffix.as_deref());

    match written {
        Ok(report) => {
            let mut state = turn.hold();

            state.remember_short_titles(report.on_screen);

            if let Some(learned) = report.suffix {
                state.learn_title_suffix(learned);
            }

            false
        }
        Err(PlatformError::AuthorizationDenied) | Err(PlatformError::WindowGone) => false,
        Err(error) => turn
            .hold()
            .log_unless_repeated(JournalEvent::ShortTitlesFailed {
                detail: error.to_string(),
            }),
    }
}

fn follow_taskbar(turn: &Turn) -> bool {
    match turn.windows.taskbar_combines() {
        Ok(combines) => turn.hold().set_taskbar_combines(combines),
        Err(_) => false,
    }
}

fn apply_window_icons(turn: &Turn) -> bool {
    turn.windows.forget_closed_windows();

    let looks = {
        let mut state = turn.hold();

        state.forget_closed_windows();

        state.looks_to_paint()
    };

    let mut written = false;

    for painting in looks {
        let painted = paint_window(turn, &painting);
        let mut state = turn.hold();

        match painted {
            Ok(()) => state.remember_painted(&painting),
            Err(PlatformError::WindowGone) => state.forget_window(&painting.nickname),
            Err(PlatformError::AuthorizationDenied) => {}
            Err(error) => {
                written |= state.log_unless_repeated(JournalEvent::WindowIconFailed {
                    detail: error.to_string(),
                });
            }
        }
    }

    written
}

fn paint_window(turn: &Turn, painting: &Painting) -> Result<(), PlatformError> {
    let (wore_portrait, was_ungrouped) = {
        let state = turn.hold();

        (
            state.wore_portrait(&painting.nickname),
            state.was_ungrouped(&painting.nickname),
        )
    };
    let Painting { window, look, .. } = painting;

    if look.portrait.is_some() || wore_portrait {
        turn.windows
            .set_window_icon(*window, look.portrait.map(portraits::icon_of))?;
    }

    if look.ungrouped || was_ungrouped {
        turn.windows.set_window_group(
            *window,
            look.ungrouped.then(|| group_of(*window)).as_deref(),
        )?;
    }

    Ok(())
}

fn group_of(window: WindowId) -> String {
    format!("{GROUP_PREFIX}{}", window.raw())
}

const GROUP_PREFIX: &str = "multifus.window.";

pub fn on_run_event(app: &AppHandle, event: RunEvent) {
    if matches!(event, RunEvent::Exit) {
        let turn = Turn::of(app);

        give_titles_back(&turn);
        give_icons_back(&turn);
        give_groups_back(&turn);

        return;
    }

    main_window::show_on_dock_click(app, event);
}

fn give_icons_back(turn: &Turn) {
    let posed = turn.hold().portraits_to_give_back();
    let given = give_back(turn, posed, |windows, window| {
        windows.set_window_icon(window, None)
    });

    turn.hold().forget_portraits(&given);
}

fn give_groups_back(turn: &Turn) {
    let posed = turn.hold().groups_to_give_back();
    let given = give_back(turn, posed, |windows, window| {
        windows.set_window_group(window, None)
    });

    turn.hold().forget_groups(&given);
}

fn give_back(
    turn: &Turn,
    posed: Vec<TracedWindow>,
    hand: impl Fn(&dyn WindowManager, WindowId) -> Result<(), PlatformError>,
) -> Vec<String> {
    posed
        .into_iter()
        .filter(|(_, window)| hand(turn.windows, *window).is_ok())
        .map(|(nickname, _)| nickname)
        .collect()
}

fn give_titles_back(turn: &Turn) {
    let suffix = turn.hold().client_title_suffix();
    let given = turn.windows.apply_short_titles(false, suffix.as_deref());

    if let Ok(report) = given {
        turn.hold().remember_short_titles(report.on_screen);
    }
}

fn refresh_windows(turn: &Turn) -> ScanChange {
    let outcome = turn.windows.game_windows();

    let mut state = turn.hold();

    match outcome {
        Ok(windows) => state.apply_windows(&windows),
        Err(PlatformError::AuthorizationDenied) => state.apply_denied(),
        Err(error) => {
            state.log_unless_repeated(JournalEvent::ScanFailed {
                detail: error.to_string(),
            });

            ScanChange {
                changed: true,
                ..ScanChange::default()
            }
        }
    }
}

fn follow_authorization(app: &AppHandle) -> bool {
    let (granted, listening) = {
        let state = lock(app);

        (state.is_granted(), state.is_listening())
    };

    match (granted, listening) {
        (true, false) => start_listening(app),
        (false, true) => stop_listening(app),
        _ => false,
    }
}

fn start_listening(app: &AppHandle) -> bool {
    let outcome = {
        let sink_app = app.clone();
        let sink: NotificationSink = Box::new(move |report| on_report(&sink_app, report));

        watcher(app).start(sink)
    };

    let mut state = lock(app);

    match outcome {
        Ok(()) => state.set_listening(true),
        Err(PlatformError::AuthorizationDenied) => state.set_granted(false),
        Err(error) => {
            state.log_unless_repeated(JournalEvent::ListeningFailed {
                detail: error.to_string(),
            });

            state.set_listening(false)
        }
    }
}

fn stop_listening(app: &AppHandle) -> bool {
    let outcome = watcher(app).stop();

    let mut state = lock(app);

    if let Err(error) = outcome {
        state.log_unless_repeated(JournalEvent::ListeningFailed {
            detail: error.to_string(),
        });
    }

    state.set_listening(false)
}

fn on_report(app: &AppHandle, report: NotificationReport) {
    match report {
        NotificationReport::Heard(notification) => on_notification(app, notification),
        NotificationReport::Unreadable { detail } => on_unreadable(app, detail),
    }
}

fn on_notification(app: &AppHandle, notification: GameNotification) {
    let Some(nickname) = notification.nickname().map(str::to_owned) else {
        return;
    };

    relay::run::offer(app, &notification, &nickname);
    dismiss(app, &nickname);

    let kind = notification.kind();
    let decision = lock(app).decide(&nickname, kind);

    let outcome = match decision {
        Decision::Ignored(Outcome::KindUnknown) if notification.matches_blank_body() => {
            Outcome::BodyUnread
        }
        Decision::Ignored(outcome) => outcome,
        Decision::Focus(window) => focus(windows(app), window),
        Decision::FocusUnlessMinimized(window) => focus_unless_minimized(windows(app), window),
    };

    lock(app).log(JournalEvent::Notification {
        nickname,
        notification_kind: kind,
        outcome,
    });

    emit_snapshot(app);
}

fn on_unreadable(app: &AppHandle, detail: String) {
    let written = lock(app).log_unless_repeated(JournalEvent::NotificationUnreadable { detail });

    if written {
        emit_snapshot(app);
    }
}

fn dismiss(app: &AppHandle, nickname: &str) {
    let state = app.state::<WatcherState>();

    let watcher = match state.inner().try_lock() {
        Ok(watcher) => watcher,
        Err(TryLockError::Poisoned(poisoned)) => poisoned.into_inner(),
        Err(TryLockError::WouldBlock) => return,
    };

    drop(watcher.dismiss(nickname));
}

fn focus(windows: &dyn WindowManager, window: WindowId) -> Outcome {
    match windows.focus(window) {
        Ok(()) => Outcome::Focused,
        Err(error) => refused(&error),
    }
}

fn focus_unless_minimized(windows: &dyn WindowManager, window: WindowId) -> Outcome {
    match windows.is_minimized(window) {
        Ok(true) => Outcome::LeftMinimized,
        Ok(false) => focus(windows, window),
        Err(error) => refused(&error),
    }
}

fn refused(error: &PlatformError) -> Outcome {
    match error {
        PlatformError::WindowGone => Outcome::NoWindow,
        other => Outcome::FocusFailed {
            detail: other.to_string(),
        },
    }
}

pub fn request_authorization(app: &AppHandle) {
    let asked = windows(app).request_authorization();

    let (granted, failure) = match asked {
        Ok(authorization) => (authorization.is_granted(), None),
        Err(error) => (false, Some(error.to_string())),
    };

    {
        let mut state = lock(app);

        state.log(JournalEvent::AuthorizationRequested { granted, failure });
        state.set_granted(granted);
    }

    follow_authorization(app);
}

pub fn navigate(app: &AppHandle, screen: Screen) {
    drop(app.emit(NAVIGATE_EVENT, screen));
}

pub fn open_authorization_settings(app: &AppHandle) {
    let opened = app
        .opener()
        .open_url(AUTHORIZATION_SETTINGS_URL, None::<&str>);

    if let Err(error) = opened {
        lock(app).log(JournalEvent::OpenFailed {
            detail: error.to_string(),
        });

        emit_snapshot(app);
    }
}

pub fn refresh(app: &AppHandle) {
    scan(app);
}

pub fn emit_snapshot(app: &AppHandle) -> Snapshot {
    let snapshot = lock(app).snapshot();

    if let Err(error) = app.emit(SNAPSHOT_EVENT, snapshot.clone()) {
        lock(app).log_unless_repeated(JournalEvent::SnapshotFailed {
            detail: error.to_string(),
        });
    }

    tray::refresh(app);

    snapshot
}

fn watcher(app: &AppHandle) -> MutexGuard<'_, PlatformNotificationWatcher> {
    app.state::<WatcherState>()
        .inner()
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use super::*;
    use crate::config::Settings;
    use crate::config::Traces;
    use crate::domain::Character;
    use crate::domain::Class;
    use crate::domain::Gender;
    use crate::domain::Roster;
    use crate::platform::ShortTitleReport;
    use crate::test_doubles::app_state;
    use crate::test_doubles::directory;
    use crate::test_doubles::game_window;
    use crate::test_doubles::journalled;
    use crate::test_doubles::Asked;
    use crate::test_doubles::Desktop;
    use crate::test_doubles::FakeWindowManager;

    fn turn<'a>(windows: &'a FakeWindowManager, state: &'a AppState) -> Turn<'a> {
        Turn { windows, state }
    }

    fn alpha_and_bravo() -> Roster {
        Roster::from_characters(vec![
            Character::new("Alpha")
                .with_gender(Gender::Male)
                .with_class(Class::Iop),
            Character::new("Bravo")
                .with_gender(Gender::Female)
                .with_class(Class::Eniripsa),
        ])
    }

    fn nicknames(state: &AppState) -> Vec<String> {
        hold(state)
            .connected()
            .into_iter()
            .map(|character| character.nickname)
            .collect()
    }

    fn traced(nicknames: &[&str]) -> HashSet<String> {
        nicknames
            .iter()
            .map(|nickname| (*nickname).to_owned())
            .collect()
    }

    #[test]
    fn a_scan_turns_the_windows_on_screen_into_connected_characters() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha"), game_window(2, "Bravo")],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        let change = refresh_windows(&turn);

        assert!(change.changed);
        assert_eq!(nicknames(&state), vec!["Alpha", "Bravo"]);

        windows.show(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            ..Desktop::default()
        });

        refresh_windows(&turn);

        assert_eq!(
            nicknames(&state),
            vec!["Alpha"],
            "a character whose window is gone is not connected any more"
        );
    }

    #[test]
    fn an_authorization_taken_away_takes_every_character_offline() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha"), game_window(2, "Bravo")],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);

        assert_eq!(nicknames(&state), vec!["Alpha", "Bravo"]);
        assert!(hold(&state).is_granted());

        windows.show(Desktop {
            scan_refusal: Some(PlatformError::AuthorizationDenied),
            ..Desktop::default()
        });

        refresh_windows(&turn);

        assert!(!hold(&state).is_granted());
        assert!(
            nicknames(&state).is_empty(),
            "Multifus cannot see a window any more, so it says it sees nobody"
        );
        assert_eq!(
            hold(&state).snapshot().characters.len(),
            2,
            "the characters themselves are kept, only their windows are lost"
        );
    }

    #[test]
    fn a_scan_that_breaks_is_written_down_once_and_not_at_every_turn() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            scan_refusal: Some(PlatformError::system("scanning", "the system said no")),
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);
        refresh_windows(&turn);
        refresh_windows(&turn);

        let said = journalled(&state)
            .into_iter()
            .filter(|event| matches!(event, JournalEvent::ScanFailed { .. }))
            .count();

        assert_eq!(said, 1);
    }

    #[test]
    fn the_clients_already_open_at_launch_are_left_the_size_they_were() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                maximize_on_launch: true,
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![WindowId::from_raw(1), WindowId::from_raw(2)],
            ..Desktop::default()
        });

        maximize_new_clients(&turn(&windows, &state));

        assert_eq!(windows.asked(), Vec::new());
    }

    #[test]
    fn a_client_that_opens_while_playing_is_filled_once_and_never_again() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                maximize_on_launch: true,
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![WindowId::from_raw(1)],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        maximize_new_clients(&turn);

        windows.show(Desktop {
            client_windows: vec![WindowId::from_raw(1), WindowId::from_raw(2)],
            ..Desktop::default()
        });

        maximize_new_clients(&turn);
        maximize_new_clients(&turn);

        assert_eq!(
            windows.asked(),
            vec![Asked::Maximized(WindowId::from_raw(2))]
        );
    }

    #[test]
    fn nothing_is_filled_when_the_setting_is_off() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            client_windows: vec![WindowId::from_raw(1)],
            ..Desktop::default()
        });

        maximize_new_clients(&turn(&windows, &state));

        assert_eq!(windows.asked(), Vec::new());
    }

    #[test]
    fn the_short_titles_are_asked_with_the_suffix_the_client_taught() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                short_titles: true,
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            short_titles: ShortTitleReport {
                on_screen: true,
                suffix: Some(" - Dofus Retro v1.48.21".to_owned()),
            },
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        apply_short_titles(&turn);

        assert_eq!(
            windows.asked(),
            vec![Asked::ShortTitles {
                short: true,
                suffix: None,
            }]
        );

        apply_short_titles(&turn);

        assert_eq!(
            windows.asked().last(),
            Some(&Asked::ShortTitles {
                short: true,
                suffix: Some(" - Dofus Retro v1.48.21".to_owned()),
            }),
            "what one turn learns, the next one hands back"
        );
    }

    #[test]
    fn a_window_that_goes_while_its_title_is_written_is_not_worth_a_line() {
        let directory = directory();
        let state = app_state(&directory, Settings::default());
        let windows = FakeWindowManager::showing(Desktop {
            short_titles_refusal: Some(PlatformError::WindowGone),
            ..Desktop::default()
        });

        apply_short_titles(&turn(&windows, &state));

        assert_eq!(journalled(&state), Vec::new());
    }

    #[test]
    fn the_class_head_is_posed_and_the_taskbar_button_set_apart() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                ungroup_taskbar: true,
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);
        apply_window_icons(&turn);

        let posed = windows.asked();

        assert!(
            posed.iter().any(|asked| matches!(
                asked,
                Asked::Icon {
                    window,
                    icon: Some(_)
                } if *window == WindowId::from_raw(1)
            )),
            "{posed:?}"
        );
        assert!(
            posed.contains(&Asked::Group {
                window: WindowId::from_raw(1),
                group: Some("multifus.window.1".to_owned()),
            }),
            "{posed:?}"
        );

        apply_window_icons(&turn);

        assert_eq!(
            &windows.asked()[posed.len()..],
            [Asked::ClosedForgotten],
            "a window that already wears its head is only asked to forget the closed ones"
        );
    }

    #[test]
    fn a_window_gone_while_it_is_painted_is_forgotten_rather_than_chased() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                traces: Traces {
                    portraits: traced(&["Alpha"]),
                    ..Traces::default()
                },
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            icon_refusal: Some(PlatformError::WindowGone),
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);
        apply_window_icons(&turn);

        assert!(!hold(&state).wore_portrait("Alpha"));
        assert!(!journalled(&state)
            .iter()
            .any(|event| matches!(event, JournalEvent::WindowIconFailed { .. })));
    }

    #[test]
    fn what_multifus_posed_it_gives_back_when_it_quits() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                short_titles: true,
                traces: Traces {
                    portraits: traced(&["Alpha"]),
                    ungrouped: traced(&["Alpha"]),
                    short_titles: true,
                },
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);

        give_titles_back(&turn);
        give_icons_back(&turn);
        give_groups_back(&turn);

        assert!(windows.asked().contains(&Asked::ShortTitles {
            short: false,
            suffix: None,
        }));
        assert!(windows.asked().contains(&Asked::Icon {
            window: WindowId::from_raw(1),
            icon: None,
        }));
        assert!(windows.asked().contains(&Asked::Group {
            window: WindowId::from_raw(1),
            group: None,
        }));

        let state = hold(&state);

        assert!(!state.wore_portrait("Alpha"));
        assert!(!state.was_ungrouped("Alpha"));
    }

    #[test]
    fn a_trace_the_system_refuses_to_give_back_is_kept_for_the_next_launch() {
        let directory = directory();
        let state = app_state(
            &directory,
            Settings {
                roster: alpha_and_bravo(),
                traces: Traces {
                    portraits: traced(&["Alpha"]),
                    ..Traces::default()
                },
                ..Settings::default()
            },
        );
        let windows = FakeWindowManager::showing(Desktop {
            game_windows: vec![game_window(1, "Alpha")],
            icon_refusal: Some(PlatformError::system("giving the icon back", "busy")),
            ..Desktop::default()
        });
        let turn = turn(&windows, &state);

        refresh_windows(&turn);
        give_icons_back(&turn);

        assert!(hold(&state).wore_portrait("Alpha"));
    }

    #[test]
    fn a_focus_tells_a_window_that_is_gone_from_one_that_says_no() {
        let windows = FakeWindowManager::showing(Desktop {
            focus_refusal: Some(PlatformError::WindowGone),
            ..Desktop::default()
        });

        assert_eq!(
            focus(windows.as_ref(), WindowId::from_raw(1)),
            Outcome::NoWindow
        );

        windows.show(Desktop::default());

        assert_eq!(
            focus(windows.as_ref(), WindowId::from_raw(1)),
            Outcome::Focused
        );
    }

    #[test]
    fn a_minimized_window_is_left_alone_when_the_player_asked_for_it() {
        let windows = FakeWindowManager::showing(Desktop {
            minimized: vec![WindowId::from_raw(1)],
            ..Desktop::default()
        });

        assert_eq!(
            focus_unless_minimized(windows.as_ref(), WindowId::from_raw(1)),
            Outcome::LeftMinimized
        );
        assert_eq!(
            focus_unless_minimized(windows.as_ref(), WindowId::from_raw(2)),
            Outcome::Focused
        );
        assert_eq!(
            windows.asked(),
            vec![Asked::Focused(WindowId::from_raw(2))],
            "a window left minimized is never touched"
        );
    }
}
