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

use windows::core::w;
use windows::core::BOOL;
use windows::core::PCWSTR;
use windows::core::PWSTR;
use windows::Win32::Foundation::CloseHandle;
use windows::Win32::Foundation::GetLastError;
use windows::Win32::Foundation::ERROR_INVALID_WINDOW_HANDLE;
use windows::Win32::Foundation::HANDLE;
use windows::Win32::Foundation::HWND;
use windows::Win32::Foundation::LPARAM;
use windows::Win32::Foundation::WPARAM;
use windows::Win32::Storage::EnhancedStorage::PKEY_AppUserModel_ID;
use windows::Win32::System::Com::CoInitializeEx;
use windows::Win32::System::Com::CoTaskMemAlloc;
use windows::Win32::System::Com::StructuredStorage::PROPVARIANT;
use windows::Win32::System::Com::COINIT_APARTMENTTHREADED;
use windows::Win32::System::Power::PowerClearRequest;
use windows::Win32::System::Power::PowerCreateRequest;
use windows::Win32::System::Power::PowerRequestDisplayRequired;
use windows::Win32::System::Power::PowerSetRequest;
use windows::Win32::System::Registry::RegGetValueW;
use windows::Win32::System::Registry::HKEY_CURRENT_USER;
use windows::Win32::System::Registry::RRF_RT_REG_DWORD;
use windows::Win32::System::Threading::AttachThreadInput;
use windows::Win32::System::Threading::GetCurrentThreadId;
use windows::Win32::System::Threading::OpenProcess;
use windows::Win32::System::Threading::QueryFullProcessImageNameW;
use windows::Win32::System::Threading::POWER_REQUEST_CONTEXT_SIMPLE_STRING;
use windows::Win32::System::Threading::PROCESS_NAME_WIN32;
use windows::Win32::System::Threading::PROCESS_QUERY_LIMITED_INFORMATION;
use windows::Win32::System::Threading::REASON_CONTEXT;
use windows::Win32::System::Threading::REASON_CONTEXT_0;
use windows::Win32::System::Variant::VT_LPWSTR;
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
use windows::Win32::UI::Shell::PropertiesSystem::IPropertyStore;
use windows::Win32::UI::Shell::PropertiesSystem::SHGetPropertyStoreForWindow;
use windows::Win32::UI::WindowsAndMessaging::BringWindowToTop;
use windows::Win32::UI::WindowsAndMessaging::CreateIconFromResourceEx;
use windows::Win32::UI::WindowsAndMessaging::DestroyIcon;
use windows::Win32::UI::WindowsAndMessaging::DispatchMessageW;
use windows::Win32::UI::WindowsAndMessaging::EnumWindows;
use windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow;
use windows::Win32::UI::WindowsAndMessaging::GetSystemMetrics;
use windows::Win32::UI::WindowsAndMessaging::GetWindow;
use windows::Win32::UI::WindowsAndMessaging::GetWindowTextLengthW;
use windows::Win32::UI::WindowsAndMessaging::GetWindowTextW;
use windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId;
use windows::Win32::UI::WindowsAndMessaging::IsIconic;
use windows::Win32::UI::WindowsAndMessaging::IsWindow;
use windows::Win32::UI::WindowsAndMessaging::IsWindowVisible;
use windows::Win32::UI::WindowsAndMessaging::PeekMessageW;
use windows::Win32::UI::WindowsAndMessaging::SendMessageTimeoutW;
use windows::Win32::UI::WindowsAndMessaging::SetForegroundWindow;
use windows::Win32::UI::WindowsAndMessaging::ShowWindow;
use windows::Win32::UI::WindowsAndMessaging::ShowWindowAsync;
use windows::Win32::UI::WindowsAndMessaging::SystemParametersInfoW;
use windows::Win32::UI::WindowsAndMessaging::TranslateMessage;
use windows::Win32::UI::WindowsAndMessaging::GW_OWNER;
use windows::Win32::UI::WindowsAndMessaging::HICON;
use windows::Win32::UI::WindowsAndMessaging::ICON_BIG;
use windows::Win32::UI::WindowsAndMessaging::ICON_SMALL;
use windows::Win32::UI::WindowsAndMessaging::LR_DEFAULTCOLOR;
use windows::Win32::UI::WindowsAndMessaging::MSG;
use windows::Win32::UI::WindowsAndMessaging::PM_REMOVE;
use windows::Win32::UI::WindowsAndMessaging::SMTO_ABORTIFHUNG;
use windows::Win32::UI::WindowsAndMessaging::SM_CXICON;
use windows::Win32::UI::WindowsAndMessaging::SM_CXSMICON;
use windows::Win32::UI::WindowsAndMessaging::SPI_GETSCREENSAVEACTIVE;
use windows::Win32::UI::WindowsAndMessaging::SPI_GETSCREENSAVETIMEOUT;
use windows::Win32::UI::WindowsAndMessaging::SW_MAXIMIZE;
use windows::Win32::UI::WindowsAndMessaging::SW_RESTORE;
use windows::Win32::UI::WindowsAndMessaging::SYSTEM_PARAMETERS_INFO_ACTION;
use windows::Win32::UI::WindowsAndMessaging::SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS;
use windows::Win32::UI::WindowsAndMessaging::WM_SETICON;
use windows::Win32::UI::WindowsAndMessaging::WM_SETTEXT;
use windows::Win32::UI::WindowsAndMessaging::WNDENUMPROC;
use windows::UI::Notifications::KnownNotificationBindings;
use windows::UI::Notifications::Management::UserNotificationListener;
use windows::UI::Notifications::Management::UserNotificationListenerAccessStatus;
use windows::UI::Notifications::NotificationKinds;
use windows::UI::Notifications::UserNotification;

use crate::domain::extract_nickname;
use crate::domain::GameNotification;
use crate::platform::display::DisplayKeeper;
use crate::platform::display::ScreenSaverDelay;
use crate::platform::error::PlatformError;
use crate::platform::error::Result;
use crate::platform::notification::NotificationReport;
use crate::platform::notification::NotificationSink;
use crate::platform::notification::NotificationWatcher;
use crate::platform::paste::PasteSender;
use crate::platform::window::icon_image;
use crate::platform::window::matches_short_title;
use crate::platform::window::title_suffix;
use crate::platform::window::GameWindow;
use crate::platform::window::ShortTitleReport;
use crate::platform::window::WindowId;
use crate::platform::window::WindowManager;
use crate::platform::Authorization;

const DOFUS_EXECUTABLE: &str = "Dofus Retro.exe";

const PROCESS_PATH_UNITS: usize = 1024;

const CONTINUE_ENUMERATION: BOOL = BOOL(1);

const POLL_INTERVAL: Duration = Duration::from_millis(500);

const PUMP_INTERVAL: Duration = Duration::from_millis(25);

const TITLE_TIMEOUT_MS: u32 = 100;

const ICON_TIMEOUT_MS: u32 = 100;

const ICON_SMALL_SIDE: u32 = 16;

const ICON_BIG_SIDE: u32 = 32;

const ICON_RESOURCE_VERSION: u32 = 0x0003_0000;

const NO_ICON: usize = 0;

const TASKBAR_ADVANCED_KEY: PCWSTR =
    w!(r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced");

const TASKBAR_GLOM_LEVEL: PCWSTR = w!("TaskbarGlomLevel");

const NEVER_COMBINE: u32 = 2;

type TitledWindow = (WindowId, String);

#[derive(Debug, Clone, Copy, Default)]
struct WindowIcons {
    small: usize,
    big: usize,
}

#[derive(Debug, Clone, Copy)]
enum IconSlot {
    Small,
    Big,
}

impl IconSlot {
    fn message(self) -> u32 {
        match self {
            Self::Small => ICON_SMALL,
            Self::Big => ICON_BIG,
        }
    }

    fn side(self) -> u32 {
        let (metric, fallback) = match self {
            Self::Small => (SM_CXSMICON, ICON_SMALL_SIDE),
            Self::Big => (SM_CXICON, ICON_BIG_SIDE),
        };

        // SAFETY: the call reads a system metric and writes nothing of ours.
        match u32::try_from(unsafe { GetSystemMetrics(metric) }) {
            Ok(0) | Err(_) => fallback,
            Ok(side) => side,
        }
    }

    fn of(self, icons: &mut WindowIcons) -> &mut usize {
        match self {
            Self::Small => &mut icons.small,
            Self::Big => &mut icons.big,
        }
    }
}

#[derive(Debug, Default)]
pub struct Win32WindowManager {
    short: AtomicBool,
    icons: Mutex<HashMap<WindowId, WindowIcons>>,
}

impl Win32WindowManager {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    fn shortens(&self) -> bool {
        self.short.load(Ordering::Relaxed)
    }

    fn paint_slot(
        &self,
        handle: HWND,
        window: WindowId,
        slot: IconSlot,
        icon: Option<&[u8]>,
    ) -> Result<()> {
        let fresh = match icon {
            Some(icon) => create_icon(icon, slot.side())?,
            None => NO_ICON,
        };

        match write_icon(handle, slot.message(), fresh) {
            Ok(()) => {
                destroy_icon(self.remember_slot(window, slot, fresh));

                Ok(())
            }
            Err(error) => {
                destroy_icon(fresh);

                Err(error)
            }
        }
    }

    fn remember_slot(&self, window: WindowId, slot: IconSlot, icon: usize) -> usize {
        let mut icons = self.icons.lock().unwrap_or_else(PoisonError::into_inner);
        let painted = icons.entry(window).or_default();

        std::mem::replace(slot.of(painted), icon)
    }
}

impl WindowManager for Win32WindowManager {
    fn authorization(&self) -> Result<Authorization> {
        Ok(Authorization::Granted)
    }

    fn request_authorization(&self) -> Result<Authorization> {
        Ok(Authorization::Granted)
    }

    fn game_windows(&self) -> Result<Vec<GameWindow>> {
        let mut windows: Vec<TitledWindow> = Vec::new();

        enumerate(Some(collect_titled_window), &mut windows)?;

        let short = self.shortens();

        Ok(windows
            .iter()
            .filter_map(|(id, title)| GameWindow::from_client_title(*id, title, short))
            .collect())
    }

    fn foreground_game_window(&self) -> Result<Option<GameWindow>> {
        let Some((id, title)) = titled_window(unsafe { GetForegroundWindow() }) else {
            return Ok(None);
        };

        Ok(GameWindow::from_client_title(id, &title, self.shortens()))
    }

    fn is_minimized(&self, window: WindowId) -> Result<bool> {
        let handle = live_game_window(window)?;

        Ok(unsafe { IsIconic(handle) }.as_bool())
    }

    fn focus(&self, window: WindowId) -> Result<()> {
        let handle = live_game_window(window)?;
        let _attached = AttachedInput::new(handle);

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

    fn client_windows(&self) -> Result<Vec<WindowId>> {
        let mut windows = Vec::new();

        enumerate(Some(collect_client_window), &mut windows)?;

        Ok(windows)
    }

    fn maximize(&self, window: WindowId) -> Result<()> {
        let handle = live_game_window(window)?;

        let _ = unsafe { ShowWindowAsync(handle, SW_MAXIMIZE) };

        Ok(())
    }

    fn apply_short_titles(&self, short: bool, suffix: Option<&str>) -> Result<Option<String>> {
        if !short && !self.shortens() {
            return Ok(None);
        }

        let mut windows: Vec<TitledWindow> = Vec::new();

        enumerate(Some(collect_titled_window), &mut windows)?;

        let written = write_titles(&windows, short, suffix);

        match &written {
            Ok(report) => self.short.store(report.on_screen, Ordering::Relaxed),
            Err(_) => self.short.store(true, Ordering::Relaxed),
        }

        written.map(|report| report.suffix)
    }

    fn set_window_icon(&self, window: WindowId, icon: Option<&[u8]>) -> Result<()> {
        let handle = live_game_window(window)?;

        let small = self.paint_slot(handle, window, IconSlot::Small, icon);
        let big = self.paint_slot(handle, window, IconSlot::Big, icon);

        small.and(big)
    }

    fn forget_closed_windows(&self) {
        let mut icons = self.icons.lock().unwrap_or_else(PoisonError::into_inner);
        let closed = icons
            .keys()
            .copied()
            .filter(|window| !is_live_window(*window))
            .collect::<Vec<_>>();

        for window in closed {
            let Some(painted) = icons.remove(&window) else {
                continue;
            };

            destroy_icon(painted.small);
            destroy_icon(painted.big);
        }
    }

    fn taskbar_combines(&self) -> Result<bool> {
        Ok(taskbar_glom_level() != Some(NEVER_COMBINE))
    }

    fn set_window_group(&self, window: WindowId, group: Option<&str>) -> Result<()> {
        let handle = live_game_window(window)?;

        enter_apartment();

        let store: IPropertyStore =
            unsafe { SHGetPropertyStoreForWindow(handle) }.map_err(|error| {
                PlatformError::system("SHGetPropertyStoreForWindow", error.to_string())
            })?;

        let value = application_id(group)?;

        // SAFETY: the value outlives both calls, and the store copies what it keeps.
        unsafe {
            store
                .SetValue(&PKEY_AppUserModel_ID, &value)
                .and_then(|()| store.Commit())
        }
        .map_err(|error| PlatformError::system("PKEY_AppUserModel_ID", error.to_string()))
    }
}

fn create_icon(icon: &[u8], side: u32) -> Result<usize> {
    let image = icon_image(icon, side).ok_or_else(|| {
        PlatformError::system("reading a portrait", "the icon holds no image to draw")
    })?;
    let side = i32::try_from(side).unwrap_or(i32::MAX);

    // SAFETY: the slice is alive for the call, and holds the image bits the directory points at.
    let created = unsafe {
        CreateIconFromResourceEx(
            image,
            true,
            ICON_RESOURCE_VERSION,
            side,
            side,
            LR_DEFAULTCOLOR,
        )
    };

    created
        .map(|icon| icon.0 as usize)
        .map_err(|error| PlatformError::system("CreateIconFromResourceEx", error.to_string()))
}

fn write_icon(handle: HWND, which: u32, icon: usize) -> Result<()> {
    // SAFETY: the handle answered `IsWindow`, and the icon is one the process created.
    let answered = unsafe {
        SendMessageTimeoutW(
            handle,
            WM_SETICON,
            WPARAM(which as usize),
            LPARAM(icon as isize),
            SMTO_ABORTIFHUNG,
            ICON_TIMEOUT_MS,
            None,
        )
    };

    if answered.0 != 0 {
        return Ok(());
    }

    if unsafe { GetLastError() } == ERROR_INVALID_WINDOW_HANDLE {
        return Err(PlatformError::WindowGone);
    }

    Err(PlatformError::system(
        "WM_SETICON",
        "the client did not take the icon in time",
    ))
}

fn destroy_icon(icon: usize) {
    if icon == NO_ICON {
        return;
    }

    // SAFETY: the handle comes from a `CreateIconFromResourceEx` that reported success.
    let _ = unsafe { DestroyIcon(HICON(icon as *mut c_void)) };
}

fn application_id(group: Option<&str>) -> Result<PROPVARIANT> {
    let Some(group) = group else {
        return Ok(PROPVARIANT::default());
    };

    let name: Vec<u16> = group.encode_utf16().chain(once(0)).collect();

    // SAFETY: the shell allocator owns the block from here, and `PropVariantClear` gives it back.
    let room = unsafe { CoTaskMemAlloc(size_of_val(name.as_slice())) }.cast::<u16>();

    if room.is_null() {
        return Err(PlatformError::system(
            "CoTaskMemAlloc",
            "no room for an application identifier",
        ));
    }

    let mut value = PROPVARIANT::default();

    // SAFETY: the block is as long as the name and freshly ours, and `VT_LPWSTR` is its tag.
    unsafe {
        std::ptr::copy_nonoverlapping(name.as_ptr(), room, name.len());

        let inner = &mut *value.Anonymous.Anonymous;

        inner.vt = VT_LPWSTR;
        inner.Anonymous.pwszVal = PWSTR(room);
    }

    Ok(value)
}

fn taskbar_glom_level() -> Option<u32> {
    let mut level = 0_u32;
    let mut length = u32::try_from(size_of::<u32>()).ok()?;

    // SAFETY: the pointer is to a live four-byte value, which is what a DWORD value writes.
    let read = unsafe {
        RegGetValueW(
            HKEY_CURRENT_USER,
            TASKBAR_ADVANCED_KEY,
            TASKBAR_GLOM_LEVEL,
            RRF_RT_REG_DWORD,
            None,
            Some(std::ptr::from_mut(&mut level).cast()),
            Some(&mut length),
        )
    };

    read.is_ok().then_some(level)
}

fn enter_apartment() {
    APARTMENT.with(|apartment| *apartment);
}

thread_local! {
    static APARTMENT: () = {
        // SAFETY: no argument crosses, and the apartment lasts as long as the thread.
        let _ = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };
    };
}

fn write_titles(
    windows: &[TitledWindow],
    short: bool,
    suffix: Option<&str>,
) -> Result<ShortTitleReport> {
    let mut report = ShortTitleReport::default();
    let mut failure = None;

    for (id, title) in windows {
        report.suffix = report
            .suffix
            .take()
            .or_else(|| title_suffix(title).map(str::to_owned));

        let written = if short {
            shorten(*id, title)
        } else {
            lengthen(*id, title, suffix)
        };

        match written {
            Ok(on_screen) => report.on_screen |= on_screen,
            Err(error) => {
                report.on_screen = true;
                failure = failure.or(Some(error));
            }
        }
    }

    failure.map_or(Ok(report), Err)
}

fn shorten(id: WindowId, title: &str) -> Result<bool> {
    if matches_short_title(title).is_some() {
        return Ok(true);
    }

    let Some(nickname) =
        extract_nickname(title).filter(|nickname| matches_short_title(nickname).is_some())
    else {
        return Ok(false);
    };

    set_window_title(window_handle(id), nickname)?;

    Ok(true)
}

fn lengthen(id: WindowId, title: &str, suffix: Option<&str>) -> Result<bool> {
    let Some(nickname) = matches_short_title(title) else {
        return Ok(false);
    };

    let Some(suffix) = suffix else {
        return Ok(true);
    };

    set_window_title(window_handle(id), &format!("{nickname}{suffix}"))?;

    Ok(false)
}

fn set_window_title(handle: HWND, title: &str) -> Result<()> {
    let text: Vec<u16> = title.encode_utf16().chain(once(0)).collect();

    let answered = unsafe {
        SendMessageTimeoutW(
            handle,
            WM_SETTEXT,
            WPARAM(0),
            LPARAM(text.as_ptr() as isize),
            SMTO_ABORTIFHUNG,
            TITLE_TIMEOUT_MS,
            None,
        )
    };

    if answered.0 != 0 {
        return Ok(());
    }

    if unsafe { GetLastError() } == ERROR_INVALID_WINDOW_HANDLE {
        return Err(PlatformError::WindowGone);
    }

    Err(PlatformError::system(
        "WM_SETTEXT",
        "the client did not take the title in time",
    ))
}

struct AttachedInput {
    current: u32,
    attached: Vec<u32>,
}

impl AttachedInput {
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
        for thread in &self.attached {
            let _ = unsafe { AttachThreadInput(self.current, *thread, false) };
        }
    }
}

unsafe extern "system" fn collect_titled_window(handle: HWND, lparam: LPARAM) -> BOOL {
    let windows = unsafe { &mut *(lparam.0 as *mut Vec<TitledWindow>) };

    if let Some(window) = titled_window(handle) {
        windows.push(window);
    }

    CONTINUE_ENUMERATION
}

fn enumerate<T>(collect: WNDENUMPROC, into: &mut Vec<T>) -> Result<()> {
    let sink = std::ptr::from_mut(into) as isize;

    unsafe { EnumWindows(collect, LPARAM(sink)) }
        .map_err(|error| PlatformError::system("EnumWindows", error.to_string()))
}

unsafe extern "system" fn collect_client_window(handle: HWND, lparam: LPARAM) -> BOOL {
    let windows = unsafe { &mut *(lparam.0 as *mut Vec<WindowId>) };

    if is_client_window(handle) {
        windows.push(window_id(handle));
    }

    CONTINUE_ENUMERATION
}

fn is_client_window(handle: HWND) -> bool {
    if !unsafe { IsWindowVisible(handle) }.as_bool() || !is_unowned(handle) {
        return false;
    }

    if !runs_dofus(handle) {
        return false;
    }

    !window_title(handle).trim().is_empty()
}

fn titled_window(handle: HWND) -> Option<TitledWindow> {
    if !unsafe { IsWindowVisible(handle) }.as_bool() || !is_unowned(handle) {
        return None;
    }

    if !runs_dofus(handle) {
        return None;
    }

    let title = window_title(handle);

    if title.trim().is_empty() {
        return None;
    }

    Some((window_id(handle), title))
}

fn is_unowned(handle: HWND) -> bool {
    unsafe { GetWindow(handle, GW_OWNER) }.map_or(true, |owner| owner.is_invalid())
}

fn is_live_window(window: WindowId) -> bool {
    unsafe { IsWindow(Some(window_handle(window))) }.as_bool()
}

fn live_game_window(window: WindowId) -> Result<HWND> {
    let handle = window_handle(window);

    if !unsafe { IsWindow(Some(handle)) }.as_bool() || !runs_dofus(handle) {
        return Err(PlatformError::WindowGone);
    }

    Ok(handle)
}

fn runs_dofus(handle: HWND) -> bool {
    executable_name(handle).is_some_and(|name| name.eq_ignore_ascii_case(DOFUS_EXECUTABLE))
}

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

        listening.thread.join().map_err(|_| {
            PlatformError::system("stopping the toast watcher", "the watcher thread panicked")
        })
    }

    fn dismiss(&self, nickname: &str) -> Result<()> {
        table(&self.toasts).to_dismiss.push(nickname.to_owned());

        Ok(())
    }
}

impl Drop for UserNotificationWatcher {
    fn drop(&mut self) {
        drop(self.stop());
    }
}

#[derive(Debug)]
struct Listening {
    running: Arc<AtomicBool>,
    thread: JoinHandle<()>,
}

#[derive(Debug, Default)]
struct ToastTable {
    reported: HashSet<u32>,
    by_nickname: HashMap<String, Vec<u32>>,
    to_dismiss: Vec<String>,
}

impl ToastTable {
    fn retain(&mut self, live: &HashSet<u32>) {
        self.reported.retain(|id| live.contains(id));

        for ids in self.by_nickname.values_mut() {
            ids.retain(|id| live.contains(id));
        }

        self.by_nickname.retain(|_, ids| !ids.is_empty());
    }
}

fn table(toasts: &Mutex<ToastTable>) -> MutexGuard<'_, ToastTable> {
    toasts.lock().unwrap_or_else(PoisonError::into_inner)
}

fn listener() -> Result<UserNotificationListener> {
    UserNotificationListener::Current()
        .map_err(|error| PlatformError::system("UserNotificationListener", error.to_string()))
}

fn granted(status: windows::core::Result<UserNotificationListenerAccessStatus>) -> Authorization {
    if status.is_ok_and(|status| status == UserNotificationListenerAccessStatus::Allowed) {
        Authorization::Granted
    } else {
        Authorization::Denied
    }
}

fn watch(
    sink: &NotificationSink,
    running: &AtomicBool,
    toasts: &Mutex<ToastTable>,
    ready: &mpsc::Sender<Result<()>>,
) {
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

fn wait(running: &AtomicBool) {
    let deadline = Instant::now() + POLL_INTERVAL;

    while running.load(Ordering::Relaxed) && Instant::now() < deadline {
        pump();

        thread::sleep(PUMP_INTERVAL);
    }
}

fn pump() {
    let mut message = MSG::default();

    while unsafe { PeekMessageW(&mut message, None, 0, 0, PM_REMOVE) }.as_bool() {
        unsafe {
            let _ = TranslateMessage(&message);
            DispatchMessageW(&message);
        }
    }
}

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

    for notification in fresh {
        drop(catch_unwind(AssertUnwindSafe(|| {
            sink(NotificationReport::Heard(notification));
        })));
    }

    Ok(())
}

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
        drop(listener.RemoveNotification(id));
    }
}

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

const POWER_REQUEST_REASON: &str = "Multifus relay";

const REASON_CONTEXT_VERSION: u32 = 0;

const READ_ONLY: SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS = SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS(0);

#[derive(Debug, Default)]
pub struct PowerRequestDisplayKeeper {
    held: Option<HANDLE>,
}

// SAFETY: a power request belongs to the process, so any thread may raise or clear it.
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

        // SAFETY: the handle comes from a successful call, and moving it out avoids a double close.
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
        drop(self.release());
    }
}

const PASTE_EVENTS: usize = 4;

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

        // SAFETY: the slice is alive for the call, and sized as the structure expects.
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

fn power_request() -> Result<HANDLE> {
    let mut reason: Vec<u16> = POWER_REQUEST_REASON.encode_utf16().chain(once(0)).collect();
    let context = REASON_CONTEXT {
        Version: REASON_CONTEXT_VERSION,
        Flags: POWER_REQUEST_CONTEXT_SIMPLE_STRING,
        Reason: REASON_CONTEXT_0 {
            SimpleReasonString: PWSTR(reason.as_mut_ptr()),
        },
    };

    // SAFETY: the reason string is alive for the call, which is all the system reads.
    unsafe { PowerCreateRequest(&context) }
        .map_err(|error| PlatformError::system("holding the display awake", error.to_string()))
}

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

fn system_parameter(action: SYSTEM_PARAMETERS_INFO_ACTION) -> Option<u32> {
    let mut value = 0_u32;

    // SAFETY: the pointer is to a live four-byte value, what both actions write.
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
