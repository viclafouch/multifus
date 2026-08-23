//! The Windows side of the boundary.
//!
//! Windows and their titles come from `EnumWindows`, focus from
//! `SetForegroundWindow` behind an `AttachThreadInput` attach, and toasts from
//! the WinRT `UserNotificationListener`, which also lets one be removed.

use std::ffi::c_void;
use std::path::Path;

use windows::core::BOOL;
use windows::core::PWSTR;
use windows::Win32::Foundation::CloseHandle;
use windows::Win32::Foundation::HWND;
use windows::Win32::Foundation::LPARAM;
use windows::Win32::System::Threading::AttachThreadInput;
use windows::Win32::System::Threading::GetCurrentThreadId;
use windows::Win32::System::Threading::OpenProcess;
use windows::Win32::System::Threading::QueryFullProcessImageNameW;
use windows::Win32::System::Threading::PROCESS_NAME_WIN32;
use windows::Win32::System::Threading::PROCESS_QUERY_LIMITED_INFORMATION;
use windows::Win32::UI::WindowsAndMessaging::EnumWindows;
use windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow;
use windows::Win32::UI::WindowsAndMessaging::GetWindowTextLengthW;
use windows::Win32::UI::WindowsAndMessaging::GetWindowTextW;
use windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId;
use windows::Win32::UI::WindowsAndMessaging::IsIconic;
use windows::Win32::UI::WindowsAndMessaging::IsWindow;
use windows::Win32::UI::WindowsAndMessaging::IsWindowVisible;
use windows::Win32::UI::WindowsAndMessaging::SetForegroundWindow;
use windows::Win32::UI::WindowsAndMessaging::ShowWindow;
use windows::Win32::UI::WindowsAndMessaging::SW_RESTORE;

use crate::platform::display::DisplayKeeper;
use crate::platform::display::ScreenSaverDelay;
use crate::platform::error::PlatformError;
use crate::platform::error::Result;
use crate::platform::notification::NotificationSink;
use crate::platform::notification::NotificationWatcher;
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
        let _attached = AttachedInput::new();

        // Restoring belongs inside the attach: a window pulled out of the
        // taskbar and left behind has not been brought to the front.
        if unsafe { IsIconic(handle) }.as_bool() {
            let _ = unsafe { ShowWindow(handle, SW_RESTORE) };
        }

        if unsafe { SetForegroundWindow(handle) }.as_bool() {
            return Ok(());
        }

        Err(PlatformError::system(
            "SetForegroundWindow",
            "the system kept the focus where it was",
        ))
    }
}

/// Ties multifus's input queue to the foreground one for the length of a focus
/// call, `SetForegroundWindow` refusing a caller that is not already in front.
///
/// Never an injected Alt keystroke, which is Dracoon's way and sends a stray
/// key into the game.
struct AttachedInput {
    current: u32,
    foreground: u32,
}

impl AttachedInput {
    /// `None` when there is nothing to attach to, or when the system turned the
    /// attach down. Focus is then attempted bare rather than not at all.
    fn new() -> Option<Self> {
        let current = unsafe { GetCurrentThreadId() };
        let foreground = unsafe { GetWindowThreadProcessId(GetForegroundWindow(), None) };

        if foreground == 0 || foreground == current {
            return None;
        }

        unsafe { AttachThreadInput(current, foreground, true) }
            .as_bool()
            .then_some(Self {
                current,
                foreground,
            })
    }
}

impl Drop for AttachedInput {
    fn drop(&mut self) {
        // Two input queues left tied are paid for on the whole desktop and not
        // in multifus, so the detach leaves whatever the focus call did.
        let _ = unsafe { AttachThreadInput(self.current, self.foreground, false) };
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
pub struct UserNotificationWatcher;

impl UserNotificationWatcher {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl NotificationWatcher for UserNotificationWatcher {
    fn authorization(&self) -> Result<Authorization> {
        // `UserNotificationListener::GetAccessStatus`, the notification access
        // the user grants in the system settings.
        Err(PlatformError::not_implemented(
            "UserNotificationWatcher::authorization",
        ))
    }

    fn request_authorization(&self) -> Result<Authorization> {
        // `RequestAccessAsync`, awaited on the spot.
        Err(PlatformError::not_implemented(
            "UserNotificationWatcher::request_authorization",
        ))
    }

    fn start(&mut self, _sink: NotificationSink) -> Result<()> {
        Err(PlatformError::not_implemented(
            "UserNotificationWatcher::start",
        ))
    }

    fn stop(&mut self) -> Result<()> {
        Err(PlatformError::not_implemented(
            "UserNotificationWatcher::stop",
        ))
    }

    fn dismiss(&self, _nickname: &str) -> Result<()> {
        // The one thing Windows can do and macOS cannot: clearing the toasts of
        // a character once its window is in front.
        Err(PlatformError::not_implemented(
            "UserNotificationWatcher::dismiss",
        ))
    }
}

/// Keeps the display awake through a power request, the twin of the macOS
/// assertion: the handle belongs to the process and not to the calling thread.
#[derive(Debug, Default)]
pub struct PowerRequestDisplayKeeper;

impl PowerRequestDisplayKeeper {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl DisplayKeeper for PowerRequestDisplayKeeper {
    fn keep_awake(&mut self) -> Result<()> {
        // `PowerSetRequest` with `PowerRequestDisplayRequired`, on the handle
        // `PowerCreateRequest` minted in `new`.
        Err(PlatformError::not_implemented(
            "PowerRequestDisplayKeeper::keep_awake",
        ))
    }

    fn release(&mut self) -> Result<()> {
        // `PowerClearRequest`, same handle and same request kind.
        Err(PlatformError::not_implemented(
            "PowerRequestDisplayKeeper::release",
        ))
    }

    fn is_awake(&self) -> bool {
        // A plain boolean is honest here, unlike with `SetThreadExecutionState`:
        // the request outlives whichever thread raised it. See lot C.
        false
    }

    fn screen_saver_delay(&self) -> Result<ScreenSaverDelay> {
        // `SystemParametersInfo`, `SPI_GETSCREENSAVEACTIVE` then
        // `SPI_GETSCREENSAVETIMEOUT`, the first telling `Never` from a delay.
        Err(PlatformError::not_implemented(
            "PowerRequestDisplayKeeper::screen_saver_delay",
        ))
    }
}
