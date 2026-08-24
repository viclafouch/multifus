//! The Windows side of the boundary.
//!
//! Windows and their titles come from `EnumWindows`, focus from
//! `SetForegroundWindow` behind an `AttachThreadInput` attach, and toasts from
//! the WinRT `UserNotificationListener`, which also lets one be removed.

use std::collections::HashMap;
use std::collections::HashSet;
use std::ffi::c_void;
use std::iter::once;
use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::path::Path;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::sync::mpsc;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::MutexGuard;
use std::sync::PoisonError;
use std::thread;
use std::thread::JoinHandle;
use std::time::Duration;
use std::time::Instant;

use windows::core::BOOL;
use windows::core::PWSTR;
use windows::Win32::Foundation::CloseHandle;
use windows::Win32::Foundation::HANDLE;
use windows::Win32::Foundation::HWND;
use windows::Win32::Foundation::LPARAM;
use windows::Win32::System::Com::CoInitializeEx;
use windows::Win32::System::Com::COINIT_APARTMENTTHREADED;
use windows::Win32::System::Power::PowerClearRequest;
use windows::Win32::System::Power::PowerCreateRequest;
use windows::Win32::System::Power::PowerRequestDisplayRequired;
use windows::Win32::System::Power::PowerSetRequest;
use windows::Win32::System::Threading::AttachThreadInput;
use windows::Win32::System::Threading::GetCurrentThreadId;
use windows::Win32::System::Threading::OpenProcess;
use windows::Win32::System::Threading::QueryFullProcessImageNameW;
use windows::Win32::System::Threading::POWER_REQUEST_CONTEXT_SIMPLE_STRING;
use windows::Win32::System::Threading::PROCESS_NAME_WIN32;
use windows::Win32::System::Threading::PROCESS_QUERY_LIMITED_INFORMATION;
use windows::Win32::System::Threading::REASON_CONTEXT;
use windows::Win32::System::Threading::REASON_CONTEXT_0;
use windows::Win32::UI::Input::KeyboardAndMouse::SendInput;
use windows::Win32::UI::Input::KeyboardAndMouse::INPUT;
use windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0;
use windows::Win32::UI::Input::KeyboardAndMouse::INPUT_KEYBOARD;
use windows::Win32::UI::Input::KeyboardAndMouse::KEYBDINPUT;
use windows::Win32::UI::Input::KeyboardAndMouse::KEYBD_EVENT_FLAGS;
use windows::Win32::UI::Input::KeyboardAndMouse::KEYEVENTF_KEYUP;
use windows::Win32::UI::Input::KeyboardAndMouse::VIRTUAL_KEY;
use windows::Win32::UI::Input::KeyboardAndMouse::VK_CONTROL;
use windows::Win32::UI::Input::KeyboardAndMouse::VK_V;
use windows::Win32::UI::WindowsAndMessaging::BringWindowToTop;
use windows::Win32::UI::WindowsAndMessaging::DispatchMessageW;
use windows::Win32::UI::WindowsAndMessaging::EnumWindows;
use windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow;
use windows::Win32::UI::WindowsAndMessaging::GetWindowTextLengthW;
use windows::Win32::UI::WindowsAndMessaging::GetWindowTextW;
use windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId;
use windows::Win32::UI::WindowsAndMessaging::IsIconic;
use windows::Win32::UI::WindowsAndMessaging::IsWindow;
use windows::Win32::UI::WindowsAndMessaging::IsWindowVisible;
use windows::Win32::UI::WindowsAndMessaging::PeekMessageW;
use windows::Win32::UI::WindowsAndMessaging::SetForegroundWindow;
use windows::Win32::UI::WindowsAndMessaging::ShowWindow;
use windows::Win32::UI::WindowsAndMessaging::SystemParametersInfoW;
use windows::Win32::UI::WindowsAndMessaging::TranslateMessage;
use windows::Win32::UI::WindowsAndMessaging::MSG;
use windows::Win32::UI::WindowsAndMessaging::PM_REMOVE;
use windows::Win32::UI::WindowsAndMessaging::SPI_GETSCREENSAVEACTIVE;
use windows::Win32::UI::WindowsAndMessaging::SPI_GETSCREENSAVETIMEOUT;
use windows::Win32::UI::WindowsAndMessaging::SW_RESTORE;
use windows::Win32::UI::WindowsAndMessaging::SYSTEM_PARAMETERS_INFO_ACTION;
use windows::Win32::UI::WindowsAndMessaging::SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS;
use windows::UI::Notifications::KnownNotificationBindings;
use windows::UI::Notifications::Management::UserNotificationListener;
use windows::UI::Notifications::Management::UserNotificationListenerAccessStatus;
use windows::UI::Notifications::NotificationKinds;
use windows::UI::Notifications::UserNotification;

use crate::domain::GameNotification;
use crate::platform::display::DisplayKeeper;
use crate::platform::display::ScreenSaverDelay;
use crate::platform::error::PlatformError;
use crate::platform::error::Result;
use crate::platform::notification::NotificationReport;
use crate::platform::notification::NotificationSink;
use crate::platform::notification::NotificationWatcher;
use crate::platform::paste::PasteSender;
use crate::platform::window::GameWindow;
use crate::platform::window::WindowId;
use crate::platform::window::WindowManager;
use crate::platform::Authorization;

/// The executable a Dofus Retro client runs under, read off a real one.
///
/// Compared by file name and never by path, which the installation moves.
const DOFUS_EXECUTABLE: &str = "Dofus Retro.exe";

/// Room for a process path, long paths included.
const PROCESS_PATH_UNITS: usize = 1024;

/// What an `EnumWindows` callback returns to be handed the next window.
const CONTINUE_ENUMERATION: BOOL = BOOL(1);

/// How long the watcher waits between two reads of the notification centre.
///
/// Shorter than the roster sweep on purpose: polling is the only route here, so
/// the whole delay of the AutoFocus is this number. See lot B of the plan.
const POLL_INTERVAL: Duration = Duration::from_millis(500);

/// How long the watcher sleeps between two turns at its message queue.
const PUMP_INTERVAL: Duration = Duration::from_millis(25);

/// Reads windows and changes focus through the Win32 window API.
///
/// A [`WindowId`] here carries an `HWND`, and a client can own several windows,
/// unlike macOS where one process is one client. Only the ones whose title
/// yields a nickname become a [`GameWindow`], which settles the difference.
#[derive(Debug, Default)]
pub struct Win32WindowManager;

impl Win32WindowManager {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl WindowManager for Win32WindowManager {
    fn authorization(&self) -> Result<Authorization> {
        // Reading a title and changing the focus need no authorization here. The
        // method stays on the interface because macOS does need one.
        Ok(Authorization::Granted)
    }

    fn request_authorization(&self) -> Result<Authorization> {
        Ok(Authorization::Granted)
    }

    fn game_windows(&self) -> Result<Vec<GameWindow>> {
        let mut windows: Vec<GameWindow> = Vec::new();
        let sink = std::ptr::from_mut(&mut windows) as isize;

        unsafe { EnumWindows(Some(collect_game_window), LPARAM(sink)) }
            .map_err(|error| PlatformError::system("EnumWindows", error.to_string()))?;

        Ok(windows)
    }

    fn foreground_game_window(&self) -> Result<Option<GameWindow>> {
        // The one window the system says is in front, put through the same
        // filter, so a shortcut costs no sweep.
        Ok(game_window(unsafe { GetForegroundWindow() }))
    }

    fn is_minimized(&self, window: WindowId) -> Result<bool> {
        let handle = live_game_window(window)?;

        Ok(unsafe { IsIconic(handle) }.as_bool())
    }

    fn focus(&self, window: WindowId) -> Result<()> {
        let handle = live_game_window(window)?;
        let _attached = AttachedInput::new(handle);

        // Restoring belongs inside the attach: a window pulled out of the
        // taskbar and left behind has not been brought to the front.
        if unsafe { IsIconic(handle) }.as_bool() {
            let _ = unsafe { ShowWindow(handle, SW_RESTORE) };
        }

        let _ = unsafe { BringWindowToTop(handle) };

        if unsafe { SetForegroundWindow(handle) }.as_bool() {
            return Ok(());
        }

        Err(PlatformError::system(
            "SetForegroundWindow",
            "the system kept the focus where it was",
        ))
    }
}

/// Ties multifus's input queue to the ones a focus call has to convince,
/// `SetForegroundWindow` refusing a caller that is not already in front.
///
/// Never an injected Alt keystroke, which is Dracoon's way and sends a stray
/// key into the game.
struct AttachedInput {
    current: u32,
    attached: Vec<u32>,
}

impl AttachedInput {
    /// The foreground thread **and** the target's own, and the second is not a
    /// belt: measured, attaching to the foreground alone leaves the focus where
    /// it was as soon as no keystroke of multifus is what asked for it.
    fn new(target: HWND) -> Self {
        let current = unsafe { GetCurrentThreadId() };
        let foreground = unsafe { GetWindowThreadProcessId(GetForegroundWindow(), None) };
        let owner = unsafe { GetWindowThreadProcessId(target, None) };
        let mut attached = Vec::new();

        for thread in [foreground, owner] {
            if thread == 0 || thread == current || attached.contains(&thread) {
                continue;
            }

            if unsafe { AttachThreadInput(current, thread, true) }.as_bool() {
                attached.push(thread);
            }
        }

        Self { current, attached }
    }
}

impl Drop for AttachedInput {
    fn drop(&mut self) {
        // Input queues left tied are paid for on the whole desktop and not in
        // multifus, so the detach leaves whatever the focus call did.
        for thread in &self.attached {
            let _ = unsafe { AttachThreadInput(self.current, *thread, false) };
        }
    }
}

/// Collects the game windows of the desktop, one call per window.
unsafe extern "system" fn collect_game_window(handle: HWND, lparam: LPARAM) -> BOOL {
    let windows = unsafe { &mut *(lparam.0 as *mut Vec<GameWindow>) };

    if let Some(window) = game_window(handle) {
        windows.push(window);
    }

    CONTINUE_ENUMERATION
}

/// Keeps a window only when a Dofus client draws it and its title has a nickname.
fn game_window(handle: HWND) -> Option<GameWindow> {
    if !unsafe { IsWindowVisible(handle) }.as_bool() {
        return None;
    }

    if !runs_dofus(handle) {
        return None;
    }

    GameWindow::from_title(window_id(handle), &window_title(handle))
}

/// The handle behind a token, once it is known to still be a client's.
fn live_game_window(window: WindowId) -> Result<HWND> {
    let handle = window_handle(window);

    // Windows recycles handles, so `IsWindow` alone can answer for a window that
    // is no longer the one this token was minted for. The executable settles it.
    if !unsafe { IsWindow(Some(handle)) }.as_bool() || !runs_dofus(handle) {
        return Err(PlatformError::WindowGone);
    }

    Ok(handle)
}

/// Whether a Dofus client owns this window.
///
/// The filter is on the process and never on the title alone: a browser tab
/// named `Something - Dofus Retro` would otherwise enter the roster.
fn runs_dofus(handle: HWND) -> bool {
    executable_name(handle).is_some_and(|name| name.eq_ignore_ascii_case(DOFUS_EXECUTABLE))
}

/// The file name of the executable behind a window, without its path.
fn executable_name(handle: HWND) -> Option<String> {
    let mut process_id = 0_u32;
    unsafe { GetWindowThreadProcessId(handle, Some(&mut process_id)) };

    let process =
        unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, process_id) }.ok()?;
    let mut buffer = [0_u16; PROCESS_PATH_UNITS];
    let mut length = buffer.len() as u32;
    let read = unsafe {
        QueryFullProcessImageNameW(
            process,
            PROCESS_NAME_WIN32,
            PWSTR(buffer.as_mut_ptr()),
            &mut length,
        )
    };
    let _ = unsafe { CloseHandle(process) };
    read.ok()?;

    let path = String::from_utf16_lossy(&buffer[..length as usize]);

    Path::new(&path)
        .file_name()
        .and_then(|name| name.to_str())
        .map(str::to_owned)
}

/// The title of a window, sized by what the system says it holds.
fn window_title(handle: HWND) -> String {
    let length = unsafe { GetWindowTextLengthW(handle) };

    if length <= 0 {
        return String::new();
    }

    let mut buffer = vec![0_u16; length as usize + 1];
    let written = unsafe { GetWindowTextW(handle, &mut buffer) };

    String::from_utf16_lossy(&buffer[..written as usize])
}

fn window_id(handle: HWND) -> WindowId {
    WindowId::from_raw(handle.0 as usize as u64)
}

fn window_handle(window: WindowId) -> HWND {
    HWND(window.raw() as usize as *mut c_void)
}

/// Hears game notifications through the WinRT `UserNotificationListener`, the
/// official route, independent of whether banners are displayed.
#[derive(Debug, Default)]
pub struct UserNotificationWatcher {
    listening: Option<Listening>,
    toasts: Arc<Mutex<ToastTable>>,
}

impl UserNotificationWatcher {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }
}

impl NotificationWatcher for UserNotificationWatcher {
    fn authorization(&self) -> Result<Authorization> {
        Ok(granted(listener()?.GetAccessStatus()))
    }

    fn request_authorization(&self) -> Result<Authorization> {
        // Awaited on the spot. The system grants this to a plain executable
        // without ever showing a dialog, which the measurements recorded.
        Ok(granted(
            listener()?
                .RequestAccessAsync()
                .and_then(|request| request.join()),
        ))
    }

    fn start(&mut self, sink: NotificationSink) -> Result<()> {
        self.stop()?;

        let running = Arc::new(AtomicBool::new(true));
        let toasts = Arc::clone(&self.toasts);
        let (ready_sender, ready_receiver) = mpsc::channel();

        let thread = thread::Builder::new()
            .name("multifus-toast-watcher".to_owned())
            .spawn({
                let running = Arc::clone(&running);

                move || watch(&sink, &running, &toasts, &ready_sender)
            })
            .map_err(|error| {
                PlatformError::system("starting the toast watcher", error.to_string())
            })?;

        // The thread says how the setup went before it starts polling, so that a
        // denied access comes back to the caller instead of dying in silence.
        let outcome = ready_receiver.recv().unwrap_or_else(|_| {
            Err(PlatformError::system(
                "starting the toast watcher",
                "the watcher thread stopped before it was listening",
            ))
        });

        match outcome {
            Ok(()) => {
                self.listening = Some(Listening { running, thread });

                Ok(())
            }
            Err(error) => {
                drop(thread.join());

                Err(error)
            }
        }
    }

    fn stop(&mut self) -> Result<()> {
        let Some(listening) = self.listening.take() else {
            return Ok(());
        };

        listening.running.store(false, Ordering::Relaxed);

        // Joining is what makes the promise of the interface true: once `stop`
        // returns, the sink will not be called again.
        listening.thread.join().map_err(|_| {
            PlatformError::system("stopping the toast watcher", "the watcher thread panicked")
        })
    }

    fn dismiss(&self, nickname: &str) -> Result<()> {
        // Queued rather than done here: the listener belongs to the watcher's
        // apartment, and this is called from whichever thread focused a window.
        table(&self.toasts).to_dismiss.push(nickname.to_owned());

        Ok(())
    }
}

impl Drop for UserNotificationWatcher {
    fn drop(&mut self) {
        // No watcher thread survives the application. A failure here reaches
        // nobody, and that is not a swallowed one: the process is ending.
        drop(self.stop());
    }
}

/// A watcher thread and the flag that stops it.
#[derive(Debug)]
struct Listening {
    running: Arc<AtomicBool>,
    thread: JoinHandle<()>,
}

/// What the watcher remembers of the toasts the platform still holds.
///
/// Shared between the polling thread and whoever calls `dismiss`, so it carries
/// the pending dismissals rather than a second lock for them.
#[derive(Debug, Default)]
struct ToastTable {
    reported: HashSet<u32>,
    by_nickname: HashMap<String, Vec<u32>>,
    to_dismiss: Vec<String>,
}

impl ToastTable {
    /// Forgets every toast the platform has let go, without which the table
    /// grows for a whole evening of play.
    fn retain(&mut self, live: &HashSet<u32>) {
        self.reported.retain(|id| live.contains(id));

        for ids in self.by_nickname.values_mut() {
            ids.retain(|id| live.contains(id));
        }

        self.by_nickname.retain(|_, ids| !ids.is_empty());
    }
}

/// A poisoned table is still a usable one: the watcher would rather keep
/// listening with a table it cannot trust than stop hearing the game.
fn table(toasts: &Mutex<ToastTable>) -> MutexGuard<'_, ToastTable> {
    toasts.lock().unwrap_or_else(PoisonError::into_inner)
}

/// The listener of this session, which any thread may ask for.
fn listener() -> Result<UserNotificationListener> {
    UserNotificationListener::Current()
        .map_err(|error| PlatformError::system("UserNotificationListener", error.to_string()))
}

/// The three values of the system, read as the two the boundary has.
///
/// `Denied` and `Unspecified` are not repaired the same way, the first being
/// unaskable again, but neither lets multifus hear anything.
fn granted(status: windows::core::Result<UserNotificationListenerAccessStatus>) -> Authorization {
    if status.is_ok_and(|status| status == UserNotificationListenerAccessStatus::Allowed) {
        Authorization::Granted
    } else {
        Authorization::Denied
    }
}

/// Sets the apartment up, then polls until the flag says to stop.
fn watch(
    sink: &NotificationSink,
    running: &AtomicBool,
    toasts: &Mutex<ToastTable>,
    ready: &mpsc::Sender<Result<()>>,
) {
    // The listener answers a thread that is not in a single-threaded apartment
    // with a COM error, and that is the trap which cost Dracoon dearly.
    let apartment = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };

    if apartment.is_err() {
        drop(ready.send(Err(PlatformError::system(
            "CoInitializeEx",
            apartment.message(),
        ))));

        return;
    }

    let listener = match listener() {
        Ok(listener) => listener,
        Err(error) => {
            drop(ready.send(Err(error)));

            return;
        }
    };

    if !granted(listener.GetAccessStatus()).is_granted() {
        drop(ready.send(Err(PlatformError::AuthorizationDenied)));

        return;
    }

    drop(ready.send(Ok(())));

    while running.load(Ordering::Relaxed) {
        dismiss_queued(&listener, toasts);
        drop(poll(&listener, sink, toasts));

        wait(running);
    }
}

/// Waits out the interval, pumping, and looks at the stop flag far more often
/// than the poll needs so that `stop` does not sit through a whole one.
fn wait(running: &AtomicBool) {
    let deadline = Instant::now() + POLL_INTERVAL;

    while running.load(Ordering::Relaxed) && Instant::now() < deadline {
        pump();

        thread::sleep(PUMP_INTERVAL);
    }
}

/// Serves the apartment's message queue.
///
/// An apartment that never pumps stops being served, and the watcher then hears
/// its first toast and no other. Measured: the probe pumped and kept hearing.
fn pump() {
    let mut message = MSG::default();

    while unsafe { PeekMessageW(&mut message, None, 0, 0, PM_REMOVE) }.as_bool() {
        unsafe {
            let _ = TranslateMessage(&message);
            DispatchMessageW(&message);
        }
    }
}

/// Reads what the platform holds and reports the toasts not seen before.
fn poll(
    listener: &UserNotificationListener,
    sink: &NotificationSink,
    toasts: &Mutex<ToastTable>,
) -> Result<()> {
    let current = listener
        .GetNotificationsAsync(NotificationKinds::Toast)
        .and_then(|request| request.join())
        .map_err(|error| PlatformError::system("GetNotificationsAsync", error.to_string()))?;

    let mut live = HashSet::new();
    let mut fresh = Vec::new();

    {
        let mut table = table(toasts);

        for toast in &current {
            let Ok(id) = toast.Id() else {
                continue;
            };

            live.insert(id);

            if !table.reported.insert(id) {
                continue;
            }

            let Some(notification) = read(&toast) else {
                continue;
            };

            let Some(nickname) = notification.nickname() else {
                continue;
            };

            table
                .by_nickname
                .entry(nickname.to_owned())
                .or_default()
                .push(id);
            fresh.push(notification);
        }

        table.retain(&live);
    }

    // Outside the lock: the sink focuses a window, and the core answers a focus
    // by dismissing, which would want this very table back.
    for notification in fresh {
        // A panic in the core would otherwise take this thread with it, and the
        // watcher would go quiet for the rest of the evening without saying so.
        drop(catch_unwind(AssertUnwindSafe(|| {
            sink(NotificationReport::Heard(notification));
        })));
    }

    Ok(())
}

/// Takes off the screen the toasts of the characters `dismiss` named.
fn dismiss_queued(listener: &UserNotificationListener, toasts: &Mutex<ToastTable>) {
    let queued: Vec<u32> = {
        let mut table = table(toasts);
        let nicknames = std::mem::take(&mut table.to_dismiss);

        nicknames
            .iter()
            .filter_map(|nickname| table.by_nickname.remove(nickname))
            .flatten()
            .collect()
    };

    for id in queued {
        // Never `ClearNotifications`, which wipes every application's, including
        // the ones multifus has never read.
        drop(listener.RemoveNotification(id));
    }
}

/// Reads a toast as the title and body pair the core expects.
///
/// The first text element is the title, the ones after it make the body, which
/// the measurements saw on a real private message.
fn read(toast: &UserNotification) -> Option<GameNotification> {
    let elements = toast
        .Notification()
        .and_then(|notification| notification.Visual())
        .and_then(|visual| visual.GetBinding(&KnownNotificationBindings::ToastGeneric()?))
        .and_then(|binding| binding.GetTextElements())
        .ok()?;

    let lines: Vec<String> = elements
        .into_iter()
        .filter_map(|element| element.Text().ok())
        .map(|text| text.to_string())
        .collect();

    let (title, body) = lines.split_first()?;

    Some(GameNotification::new(title, body.join("\n")))
}

/// What `powercfg /requests` shows next to multifus, the twin of the name
/// `pmset -g assertions` shows on macOS.
const POWER_REQUEST_REASON: &str = "multifus relay";

/// The only version a `REASON_CONTEXT` has. Written here rather than pulled from
/// `Win32_System_SystemServices`, a whole feature for one zero.
const REASON_CONTEXT_VERSION: u32 = 0;

/// The update flags of a read of the system settings, which changes nothing.
const READ_ONLY: SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS = SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS(0);

/// Keeps the display awake through a power request, the twin of the macOS
/// assertion: the request belongs to the process and not to the thread that
/// raised it, unlike `SetThreadExecutionState`.
#[derive(Debug, Default)]
pub struct PowerRequestDisplayKeeper {
    /// The request currently raised, `None` when the machine may sleep.
    held: Option<HANDLE>,
}

// SAFETY: a power request belongs to the process, so any thread may raise, clear
// or close it, and the relay calls this keeper from whichever thread it runs on.
unsafe impl Send for PowerRequestDisplayKeeper {}
// SAFETY: same reason, and the shared methods only read a boolean.
unsafe impl Sync for PowerRequestDisplayKeeper {}

impl PowerRequestDisplayKeeper {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }
}

impl DisplayKeeper for PowerRequestDisplayKeeper {
    fn keep_awake(&mut self) -> Result<()> {
        if self.held.is_some() {
            return Ok(());
        }

        let request = power_request()?;

        // SAFETY: the handle comes from a call that reported success.
        let raised = unsafe { PowerSetRequest(request, PowerRequestDisplayRequired) };

        if let Err(error) = raised {
            let _ = unsafe { CloseHandle(request) };

            return Err(PlatformError::system(
                "holding the display awake",
                error.to_string(),
            ));
        }

        self.held = Some(request);

        Ok(())
    }

    fn release(&mut self) -> Result<()> {
        let Some(request) = self.held.take() else {
            return Ok(());
        };

        // SAFETY: the handle comes from a call that reported success, and taking
        // it out of the field is what stops it being cleared twice. Closing it
        // frees the request whatever the clear answered, so nothing is reported.
        let _ = unsafe { PowerClearRequest(request, PowerRequestDisplayRequired) };
        let _ = unsafe { CloseHandle(request) };

        Ok(())
    }

    fn is_awake(&self) -> bool {
        self.held.is_some()
    }

    fn screen_saver_delay(&self) -> Result<ScreenSaverDelay> {
        Ok(screen_saver_delay())
    }
}

impl Drop for PowerRequestDisplayKeeper {
    fn drop(&mut self) {
        // No hold survives the keeper, and a failure here reaches nobody: the
        // request dies with the process whatever the system answered.
        drop(self.release());
    }
}

/// How many events one paste puts into the input stream: `Control` and `V`, down
/// then up.
const PASTE_EVENTS: usize = 4;

/// Lays `Control+V` on the system through `SendInput`.
///
/// Never measured on a real client, unlike the macOS half. The four questions of
/// `docs/plan.md`, temps 1, are entire on this system.
#[derive(Debug, Default)]
pub struct SendInputPasteSender;

impl SendInputPasteSender {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl PasteSender for SendInputPasteSender {
    fn send_paste_combination(&self) -> Result<()> {
        let events: [INPUT; PASTE_EVENTS] = [
            key_event(VK_CONTROL, true),
            key_event(VK_V, true),
            key_event(VK_V, false),
            key_event(VK_CONTROL, false),
        ];

        // SAFETY: the slice is alive for the call and the size is that of the
        // structure the system expects.
        let sent = unsafe {
            SendInput(
                &events,
                i32::try_from(size_of::<INPUT>()).unwrap_or(i32::MAX),
            )
        };

        if sent as usize != PASTE_EVENTS {
            return Err(PlatformError::system(
                "posting the paste combination",
                format!("SendInput took {sent} of {PASTE_EVENTS} events"),
            ));
        }

        Ok(())
    }
}

/// One half of one key of the combination.
fn key_event(key: VIRTUAL_KEY, key_down: bool) -> INPUT {
    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: key,
                dwFlags: if key_down {
                    KEYBD_EVENT_FLAGS(0)
                } else {
                    KEYEVENTF_KEYUP
                },
                ..KEYBDINPUT::default()
            },
        },
    }
}

/// Mints the request a hold is raised on, named so that `powercfg /requests`
/// says which application is keeping the display on.
fn power_request() -> Result<HANDLE> {
    let mut reason: Vec<u16> = POWER_REQUEST_REASON.encode_utf16().chain(once(0)).collect();
    let context = REASON_CONTEXT {
        Version: REASON_CONTEXT_VERSION,
        Flags: POWER_REQUEST_CONTEXT_SIMPLE_STRING,
        Reason: REASON_CONTEXT_0 {
            SimpleReasonString: PWSTR(reason.as_mut_ptr()),
        },
    };

    // SAFETY: the reason string is alive for the call, which is all the system
    // reads of it.
    unsafe { PowerCreateRequest(&context) }
        .map_err(|error| PlatformError::system("holding the display awake", error.to_string()))
}

/// Reads what the screen saver of this machine is set to. Whether it starts at
/// all is asked first, a timeout alone not telling a delay from `Never`.
fn screen_saver_delay() -> ScreenSaverDelay {
    let Some(active) = system_parameter(SPI_GETSCREENSAVEACTIVE) else {
        return ScreenSaverDelay::Unknown;
    };

    if active == 0 {
        return ScreenSaverDelay::Never;
    }

    match system_parameter(SPI_GETSCREENSAVETIMEOUT) {
        Some(0) => ScreenSaverDelay::Never,
        Some(seconds) => ScreenSaverDelay::After(Duration::from_secs(u64::from(seconds))),
        None => ScreenSaverDelay::Unknown,
    }
}

/// Reads one setting of the system, `None` when it refuses to answer.
fn system_parameter(action: SYSTEM_PARAMETERS_INFO_ACTION) -> Option<u32> {
    let mut value = 0_u32;

    // SAFETY: the pointer is to a live four-byte value, which is what both the
    // screen saver actions write.
    unsafe {
        SystemParametersInfoW(
            action,
            0,
            Some(std::ptr::from_mut(&mut value).cast()),
            READ_ONLY,
        )
    }
    .ok()?;

    Some(value)
}
