use std::cell::Cell;
use std::cell::RefCell;
use std::collections::HashMap;
use std::collections::HashSet;
use std::ffi::c_void;
use std::iter::once;
use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::path::Path;
use std::process;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::sync::mpsc;
use std::sync::Arc;
use std::sync::LazyLock;
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
use windows::Win32::Foundation::LRESULT;
use windows::Win32::Foundation::POINT;
use windows::Win32::Foundation::RECT;
use windows::Win32::Foundation::WPARAM;
use windows::Win32::Graphics::Gdi::MonitorFromWindow;
use windows::Win32::Graphics::Gdi::MONITOR_DEFAULTTONEAREST;
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
use windows::Win32::UI::Accessibility::SetWinEventHook;
use windows::Win32::UI::Accessibility::UnhookWinEvent;
use windows::Win32::UI::Accessibility::HWINEVENTHOOK;
use windows::Win32::UI::HiDpi::GetDpiForMonitor;
use windows::Win32::UI::HiDpi::MDT_EFFECTIVE_DPI;
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
use windows::Win32::UI::WindowsAndMessaging::CallNextHookEx;
use windows::Win32::UI::WindowsAndMessaging::CreateIconFromResourceEx;
use windows::Win32::UI::WindowsAndMessaging::DestroyIcon;
use windows::Win32::UI::WindowsAndMessaging::DispatchMessageW;
use windows::Win32::UI::WindowsAndMessaging::EnumWindows;
use windows::Win32::UI::WindowsAndMessaging::GetAncestor;
use windows::Win32::UI::WindowsAndMessaging::GetClassLongPtrW;
use windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow;
use windows::Win32::UI::WindowsAndMessaging::GetMessageW;
use windows::Win32::UI::WindowsAndMessaging::GetSystemMetrics;
use windows::Win32::UI::WindowsAndMessaging::GetWindow;
use windows::Win32::UI::WindowsAndMessaging::GetWindowRect;
use windows::Win32::UI::WindowsAndMessaging::GetWindowTextLengthW;
use windows::Win32::UI::WindowsAndMessaging::GetWindowTextW;
use windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId;
use windows::Win32::UI::WindowsAndMessaging::IsIconic;
use windows::Win32::UI::WindowsAndMessaging::IsWindow;
use windows::Win32::UI::WindowsAndMessaging::IsWindowVisible;
use windows::Win32::UI::WindowsAndMessaging::IsZoomed;
use windows::Win32::UI::WindowsAndMessaging::PeekMessageW;
use windows::Win32::UI::WindowsAndMessaging::PostThreadMessageW;
use windows::Win32::UI::WindowsAndMessaging::SendMessageTimeoutW;
use windows::Win32::UI::WindowsAndMessaging::SetForegroundWindow;
use windows::Win32::UI::WindowsAndMessaging::SetWindowsHookExW;
use windows::Win32::UI::WindowsAndMessaging::ShowWindow;
use windows::Win32::UI::WindowsAndMessaging::ShowWindowAsync;
use windows::Win32::UI::WindowsAndMessaging::SystemParametersInfoW;
use windows::Win32::UI::WindowsAndMessaging::TranslateMessage;
use windows::Win32::UI::WindowsAndMessaging::UnhookWindowsHookEx;
use windows::Win32::UI::WindowsAndMessaging::WindowFromPoint;
use windows::Win32::UI::WindowsAndMessaging::CHILDID_SELF;
use windows::Win32::UI::WindowsAndMessaging::EVENT_SYSTEM_FOREGROUND;
use windows::Win32::UI::WindowsAndMessaging::GA_ROOT;
use windows::Win32::UI::WindowsAndMessaging::GCLP_HICON;
use windows::Win32::UI::WindowsAndMessaging::GCLP_HICONSM;
use windows::Win32::UI::WindowsAndMessaging::GET_CLASS_LONG_INDEX;
use windows::Win32::UI::WindowsAndMessaging::GW_OWNER;
use windows::Win32::UI::WindowsAndMessaging::HHOOK;
use windows::Win32::UI::WindowsAndMessaging::HICON;
use windows::Win32::UI::WindowsAndMessaging::ICON_BIG;
use windows::Win32::UI::WindowsAndMessaging::ICON_SMALL;
use windows::Win32::UI::WindowsAndMessaging::LLMHF_INJECTED;
use windows::Win32::UI::WindowsAndMessaging::LR_DEFAULTCOLOR;
use windows::Win32::UI::WindowsAndMessaging::MSG;
use windows::Win32::UI::WindowsAndMessaging::MSLLHOOKSTRUCT;
use windows::Win32::UI::WindowsAndMessaging::OBJID_WINDOW;
use windows::Win32::UI::WindowsAndMessaging::PM_REMOVE;
use windows::Win32::UI::WindowsAndMessaging::SMTO_ABORTIFHUNG;
use windows::Win32::UI::WindowsAndMessaging::SM_CXICON;
use windows::Win32::UI::WindowsAndMessaging::SM_CXSMICON;
use windows::Win32::UI::WindowsAndMessaging::SPI_GETSCREENSAVEACTIVE;
use windows::Win32::UI::WindowsAndMessaging::SPI_GETSCREENSAVETIMEOUT;
use windows::Win32::UI::WindowsAndMessaging::SPIF_SENDCHANGE;
use windows::Win32::UI::WindowsAndMessaging::SPI_GETFOREGROUNDLOCKTIMEOUT;
use windows::Win32::UI::WindowsAndMessaging::SPI_SETFOREGROUNDLOCKTIMEOUT;
use windows::Win32::UI::WindowsAndMessaging::SW_MAXIMIZE;
use windows::Win32::UI::WindowsAndMessaging::SW_RESTORE;
use windows::Win32::UI::WindowsAndMessaging::SYSTEM_PARAMETERS_INFO_ACTION;
use windows::Win32::UI::WindowsAndMessaging::SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS;
use windows::Win32::UI::WindowsAndMessaging::WH_MOUSE_LL;
use windows::Win32::UI::WindowsAndMessaging::WINEVENT_OUTOFCONTEXT;
use windows::Win32::UI::WindowsAndMessaging::WINEVENT_SKIPOWNPROCESS;
use windows::Win32::UI::WindowsAndMessaging::WM_APP;
use windows::Win32::UI::WindowsAndMessaging::WM_LBUTTONDOWN;
use windows::Win32::UI::WindowsAndMessaging::WM_LBUTTONUP;
use windows::Win32::UI::WindowsAndMessaging::WM_QUIT;
use windows::Win32::UI::WindowsAndMessaging::WM_RBUTTONDOWN;
use windows::Win32::UI::WindowsAndMessaging::WM_RBUTTONUP;
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
use crate::platform::click::ClickGate;
use crate::platform::click::ClickJudge;
use crate::platform::click::ClickReport;
use crate::platform::click::ClickSink;
use crate::platform::click::ClickWatcher;
use crate::platform::click::ClickedAt;
use crate::platform::click::Verdict;
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
use crate::platform::window::ScreenFrame;
use crate::platform::window::ScreenPoint;
use crate::platform::window::ShortTitleReport;
use crate::platform::window::WindowId;
use crate::platform::window::WindowManager;
use crate::platform::Authorization;

const DOFUS_EXECUTABLE: &str = "Dofus Retro.exe";

const PROCESS_PATH_UNITS: usize = 1024;

const CONTINUE_ENUMERATION: BOOL = BOOL(1);

const MINIMUM_REST: Duration = Duration::from_millis(100);

const REST_PER_READ: u32 = 10;

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

    fn class_index(self) -> GET_CLASS_LONG_INDEX {
        match self {
            Self::Small => GCLP_HICONSM,
            Self::Big => GCLP_HICON,
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
    foreground_lock: Mutex<Option<u32>>,
}

impl Win32WindowManager {
    #[must_use]
    pub fn new(short_titles: bool) -> Self {
        let manager = Self::default();

        manager.short.store(short_titles, Ordering::Relaxed);

        manager
    }

    fn shortens(&self) -> bool {
        self.short.load(Ordering::Relaxed)
    }

    fn foreground_lock(&self) -> MutexGuard<'_, Option<u32>> {
        self.foreground_lock
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
    }

    fn paint_slot(
        &self,
        handle: HWND,
        window: WindowId,
        slot: IconSlot,
        icon: Option<&[u8]>,
    ) -> Result<()> {
        let ours = match icon {
            Some(icon) => create_icon(icon, slot.side())?,
            None => NO_ICON,
        };
        let written = match ours {
            NO_ICON => class_icon(handle, slot),
            _ => ours,
        };

        match write_icon(handle, slot.message(), written) {
            Ok(()) => {
                destroy_icon(self.remember_slot(window, slot, ours));

                Ok(())
            }
            Err(error) => {
                destroy_icon(ours);

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

    fn window_at(&self, at: ScreenPoint) -> Result<Option<WindowId>> {
        Ok(root_window_at(POINT {
            x: at.x as i32,
            y: at.y as i32,
        }))
    }

    fn window_frame(&self, window: WindowId) -> Result<Option<ScreenFrame>> {
        let handle = live_game_window(window)?;
        let mut rect = RECT::default();

        // SAFETY: `rect` is a live pointer for the duration of the call.
        unsafe { GetWindowRect(handle, &raw mut rect) }
            .map_err(|error| PlatformError::system("reading a window frame", error.to_string()))?;

        Ok(Some(logical_frame(rect, window_scale(handle))))
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

    fn maximized_windows(&self, windows: &[WindowId]) -> Vec<WindowId> {
        windows
            .iter()
            .filter(|window| match live_game_window(**window) {
                Ok(handle) => unsafe { IsZoomed(handle) }.as_bool(),
                Err(_) => false,
            })
            .copied()
            .collect()
    }

    fn unlock_foreground(&self) -> Result<()> {
        let Some(held) = system_parameter(SPI_GETFOREGROUNDLOCKTIMEOUT) else {
            return Err(PlatformError::system(
                "reading the foreground lock",
                "the system did not say how long it holds the foreground",
            ));
        };

        *self.foreground_lock() = Some(held);

        write_foreground_lock(0)
    }

    fn give_foreground_back(&self) -> Result<()> {
        let Some(held) = self.foreground_lock().take() else {
            return Ok(());
        };

        write_foreground_lock(held)
    }

    fn focus(&self, window: WindowId) -> Result<()> {
        let handle = live_game_window(window)?;

        if unsafe { IsIconic(handle) }.as_bool() {
            let _ = unsafe { ShowWindow(handle, SW_RESTORE) };
        }

        brought_to_front(handle)
    }

    fn focus_fast(&self, window: WindowId) -> Result<()> {
        let handle = window_handle(window);

        if unsafe { IsIconic(handle) }.as_bool() {
            let _ = unsafe { ShowWindowAsync(handle, SW_RESTORE) };
        }

        brought_to_front(handle)
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

    fn apply_short_titles(&self, short: bool, suffix: Option<&str>) -> Result<ShortTitleReport> {
        if !short && !self.shortens() {
            return Ok(ShortTitleReport::default());
        }

        let mut windows: Vec<TitledWindow> = Vec::new();

        enumerate(Some(collect_titled_window), &mut windows)?;

        let written = write_titles(&windows, short, suffix);

        match &written {
            Ok(report) => self.short.store(report.on_screen, Ordering::Relaxed),
            Err(_) => self.short.store(true, Ordering::Relaxed),
        }

        written
    }

    fn set_window_icon(&self, window: WindowId, icon: Option<&[u8]>) -> Result<()> {
        let handle = live_game_window(window)?;

        let small = self.paint_slot(handle, window, IconSlot::Small, icon);
        let big = self.paint_slot(handle, window, IconSlot::Big, icon);

        small.and(big)
    }

    fn forget_closed_windows(&self) {
        forget_the_processes();

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

fn class_icon(handle: HWND, slot: IconSlot) -> usize {
    // SAFETY: the handle answered `IsWindow`, and a class index only reads what the class holds.
    unsafe { GetClassLongPtrW(handle, slot.class_index()) }
}

fn write_icon(handle: HWND, which: u32, icon: usize) -> Result<()> {
    // SAFETY: the handle answered `IsWindow`, and the icon outlives the window that takes it.
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
    registry_dword(TASKBAR_ADVANCED_KEY, TASKBAR_GLOM_LEVEL)
}

fn registry_dword(key: PCWSTR, value: PCWSTR) -> Option<u32> {
    let mut read_value = 0_u32;
    let mut length = u32::try_from(size_of::<u32>()).ok()?;

    // SAFETY: the pointer is to a live four-byte value, which is what a DWORD value writes.
    let read = unsafe {
        RegGetValueW(
            HKEY_CURRENT_USER,
            key,
            value,
            RRF_RT_REG_DWORD,
            None,
            Some(std::ptr::from_mut(&mut read_value).cast()),
            Some(&mut length),
        )
    };

    read.is_ok().then_some(read_value)
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

static DOFUS_PROCESSES: LazyLock<Mutex<HashMap<u32, bool>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn brought_to_front(handle: HWND) -> Result<()> {
    if raised(handle) {
        return Ok(());
    }

    let _attached = AttachedInput::new(handle);

    if raised(handle) {
        return Ok(());
    }

    Err(PlatformError::system(
        "SetForegroundWindow",
        "the system kept the focus where it was",
    ))
}

fn raised(handle: HWND) -> bool {
    let _ = unsafe { BringWindowToTop(handle) };

    unsafe { SetForegroundWindow(handle) }.as_bool()
}

fn write_foreground_lock(seconds: u32) -> Result<()> {
    // SAFETY: this action reads its value from the pointer itself, and writes nothing.
    unsafe {
        SystemParametersInfoW(
            SPI_SETFOREGROUNDLOCKTIMEOUT,
            0,
            Some(seconds as usize as *mut c_void),
            SPIF_SENDCHANGE,
        )
    }
    .map_err(|error| PlatformError::system("writing the foreground lock", error.to_string()))
}

fn runs_dofus(handle: HWND) -> bool {
    let mut process = 0_u32;
    unsafe { GetWindowThreadProcessId(handle, Some(&mut process)) };

    if process == 0 {
        return false;
    }

    let mut known = DOFUS_PROCESSES
        .lock()
        .unwrap_or_else(PoisonError::into_inner);

    if let Some(answer) = known.get(&process) {
        return *answer;
    }

    let answer =
        executable_name(handle).is_some_and(|name| name.eq_ignore_ascii_case(DOFUS_EXECUTABLE));

    known.insert(process, answer);

    answer
}

fn forget_the_processes() {
    DOFUS_PROCESSES
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
        .clear();
}

const DOTS_PER_INCH: f64 = 96.0;

fn window_scale(handle: HWND) -> f64 {
    // SAFETY: the handle names a window the caller has just found alive.
    let screen = unsafe { MonitorFromWindow(handle, MONITOR_DEFAULTTONEAREST) };
    let mut across = 0_u32;
    let mut down = 0_u32;

    // SAFETY: the monitor comes from the call above, and both counts are live.
    let read =
        unsafe { GetDpiForMonitor(screen, MDT_EFFECTIVE_DPI, &raw mut across, &raw mut down) };

    if read.is_err() || across == 0 {
        return 1.0;
    }

    f64::from(across) / DOTS_PER_INCH
}

#[must_use]
pub fn matches_frontmost() -> bool {
    let mut owner = 0_u32;
    unsafe { GetWindowThreadProcessId(GetForegroundWindow(), Some(&mut owner)) };

    owner != 0 && owner == process::id()
}

fn logical_frame(rect: RECT, scale: f64) -> ScreenFrame {
    ScreenFrame {
        origin: ScreenPoint {
            x: f64::from(rect.left) / scale,
            y: f64::from(rect.top) / scale,
        },
        width: f64::from(rect.right - rect.left) / scale,
        height: f64::from(rect.bottom - rect.top) / scale,
    }
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

const DESKTOP_KEY: PCWSTR = w!("Control Panel\\Desktop");

const LOW_LEVEL_HOOKS_TIMEOUT: PCWSTR = w!("LowLevelHooksTimeout");

const DEFAULT_HOOKS_TIMEOUT_MS: u64 = 300;

const REHOOK_MESSAGE: u32 = WM_APP + 1;

const EAT_THE_CLICK: LRESULT = LRESULT(1);

struct Watched {
    gate: Arc<ClickGate>,
    sink: ClickSink,
    judge: ClickJudge,
}

thread_local! {
    static WATCHED: RefCell<Option<Watched>> = const { RefCell::new(None) };
    static HOOK_BUDGET: Cell<Duration> =
        const { Cell::new(Duration::from_millis(DEFAULT_HOOKS_TIMEOUT_MS)) };
}

#[derive(Debug, Default)]
pub struct MouseHookClickWatcher {
    hooked: Mutex<Option<Hooked>>,
}

#[derive(Debug)]
struct Hooked {
    thread: u32,
    handle: JoinHandle<()>,
}

impl MouseHookClickWatcher {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }
}

impl ClickWatcher for MouseHookClickWatcher {
    fn start(&self, gate: Arc<ClickGate>, sink: ClickSink) -> Result<()> {
        let mut hooked = self.hooked.lock().unwrap_or_else(PoisonError::into_inner);

        if hooked.is_some() {
            return Ok(());
        }

        let (told, listening) = mpsc::channel::<Result<u32>>();

        let handle = thread::Builder::new()
            .name("multifus-clicks".to_owned())
            .spawn(move || {
                listen(&gate, &sink, &told);
            })
            .map_err(|error| PlatformError::system("the click thread", error.to_string()))?;

        match listening.recv() {
            Ok(Ok(thread)) => {
                *hooked = Some(Hooked { thread, handle });

                Ok(())
            }
            Ok(Err(error)) => {
                drop(handle.join());

                Err(error)
            }
            Err(error) => Err(PlatformError::system("the click thread", error.to_string())),
        }
    }

    fn stop(&self) {
        let taken = self
            .hooked
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .take();

        let Some(hooked) = taken else {
            return;
        };

        let _ = unsafe { PostThreadMessageW(hooked.thread, WM_QUIT, WPARAM(0), LPARAM(0)) };

        drop(hooked.handle.join());
    }
}

impl Drop for MouseHookClickWatcher {
    fn drop(&mut self) {
        self.stop();
    }
}

fn listen(gate: &Arc<ClickGate>, sink: &ClickSink, told: &mpsc::Sender<Result<u32>>) {
    HOOK_BUDGET.set(low_level_hooks_timeout());

    WATCHED.with_borrow_mut(|watched| {
        *watched = Some(Watched {
            gate: Arc::clone(gate),
            sink: Arc::clone(sink),
            judge: ClickJudge::default(),
        });
    });

    let mouse = match hook_mouse() {
        Ok(mouse) => mouse,
        Err(error) => {
            drop(told.send(Err(error)));

            return;
        }
    };

    let foreground = hook_foreground();

    drop(told.send(Ok(unsafe { GetCurrentThreadId() })));

    if let Some(last) = pump_hooks(mouse, sink) {
        let _ = unsafe { UnhookWindowsHookEx(last) };
    }

    if let Some(foreground) = foreground {
        let _ = unsafe { UnhookWinEvent(foreground) };
    }

    WATCHED.with_borrow_mut(|watched| {
        *watched = None;
    });
}

fn pump_hooks(mouse: HHOOK, sink: &ClickSink) -> Option<HHOOK> {
    let mut hook = mouse;
    let mut message = MSG::default();

    while unsafe { GetMessageW(&mut message, None, 0, 0) }.0 > 0 {
        let _ = unsafe { TranslateMessage(&message) };
        unsafe { DispatchMessageW(&message) };

        if message.message != REHOOK_MESSAGE {
            continue;
        }

        let _ = unsafe { UnhookWindowsHookEx(hook) };

        let rehooked = hook_mouse();

        let Ok(rehooked) = rehooked else {
            (sink)(ClickReport::ListeningLost);

            return None;
        };

        (sink)(ClickReport::ListeningResumed);

        hook = rehooked;
    }

    Some(hook)
}

fn hook_mouse() -> Result<HHOOK> {
    unsafe { SetWindowsHookExW(WH_MOUSE_LL, Some(on_mouse), None, 0) }
        .map_err(|error| PlatformError::system("SetWindowsHookExW", error.to_string()))
}

fn hook_foreground() -> Option<HWINEVENTHOOK> {
    let hook = unsafe {
        SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_SYSTEM_FOREGROUND,
            None,
            Some(on_foreground),
            0,
            0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS,
        )
    };

    (!hook.0.is_null()).then_some(hook)
}

fn low_level_hooks_timeout() -> Duration {
    let milliseconds = registry_dword(DESKTOP_KEY, LOW_LEVEL_HOOKS_TIMEOUT)
        .map_or(DEFAULT_HOOKS_TIMEOUT_MS, u64::from);

    Duration::from_millis(milliseconds)
}

unsafe extern "system" fn on_mouse(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    let message = u32::try_from(wparam.0).ok().filter(|message| {
        matches!(
            *message,
            WM_LBUTTONDOWN | WM_LBUTTONUP | WM_RBUTTONDOWN | WM_RBUTTONUP
        )
    });

    if let Some(message) = message.filter(|_| code >= 0) {
        let started = Instant::now();
        let verdict = verdict_of(lparam, message);

        rehook_if_overrun(started);

        if matches!(verdict, Verdict::Eat) {
            return EAT_THE_CLICK;
        }
    }

    unsafe { CallNextHookEx(None, code, wparam, lparam) }
}

fn verdict_of(lparam: LPARAM, message: u32) -> Verdict {
    // SAFETY: for a mouse message the system points lparam at one of these, alive for the call.
    let event = unsafe { &*(lparam.0 as *const MSLLHOOKSTRUCT) };

    if event.flags & LLMHF_INJECTED != 0 {
        return Verdict::Pass;
    }

    WATCHED.with_borrow(|watched| {
        let Some(watched) = watched.as_ref() else {
            return Verdict::Pass;
        };

        match message {
            WM_LBUTTONDOWN => watched.judge.press(&watched.gate, clicked_at(event.pt)),
            WM_LBUTTONUP => watched.judge.release(&watched.gate, &watched.sink),
            WM_RBUTTONDOWN => watched.judge.press_right(&watched.gate),
            WM_RBUTTONUP => watched.judge.release_right(),
            _ => Verdict::Pass,
        }
    })
}

fn clicked_at(point: POINT) -> Option<ClickedAt> {
    root_window_at(point).map(|window| ClickedAt {
        window,
        at: ScreenPoint {
            x: f64::from(point.x),
            y: f64::from(point.y),
        },
    })
}

fn root_window_at(point: POINT) -> Option<WindowId> {
    let clicked = unsafe { WindowFromPoint(point) };

    if clicked.is_invalid() {
        return None;
    }

    let root = unsafe { GetAncestor(clicked, GA_ROOT) };

    (!root.is_invalid()).then(|| window_id(root))
}

fn rehook_if_overrun(started: Instant) {
    if started.elapsed() < HOOK_BUDGET.get() {
        return;
    }

    let thread = unsafe { GetCurrentThreadId() };

    let _ = unsafe { PostThreadMessageW(thread, REHOOK_MESSAGE, WPARAM(0), LPARAM(0)) };
}

unsafe extern "system" fn on_foreground(
    _hook: HWINEVENTHOOK,
    _event: u32,
    handle: HWND,
    object: i32,
    child: i32,
    _thread: u32,
    _time: u32,
) {
    if object != OBJID_WINDOW.0 || !u32::try_from(child).is_ok_and(|child| child == CHILDID_SELF) {
        return;
    }

    WATCHED.with_borrow(|watched| {
        let Some(watched) = watched.as_ref() else {
            return;
        };

        let window = window_id(handle);

        watched.gate.note_foreground(window);

        (watched.sink)(ClickReport::Foreground { window });
    });
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
        let read_cost = poll(&listener, sink, toasts).unwrap_or_default();

        dismiss_queued(&listener, toasts);
        wait(running, read_cost);
    }
}

fn wait(running: &AtomicBool, read_cost: Duration) {
    let deadline = Instant::now() + MINIMUM_REST.max(read_cost * REST_PER_READ);

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
) -> Result<Duration> {
    let started = Instant::now();
    let current = listener
        .GetNotificationsAsync(NotificationKinds::Toast)
        .and_then(|request| request.join())
        .map_err(|error| PlatformError::system("GetNotificationsAsync", error.to_string()))?;
    let read_cost = started.elapsed();

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

    Ok(read_cost)
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

#[cfg(test)]
mod tests {
    use windows::core::PCWSTR;
    use windows::Win32::UI::WindowsAndMessaging::CreateWindowExW;
    use windows::Win32::UI::WindowsAndMessaging::DefWindowProcW;
    use windows::Win32::UI::WindowsAndMessaging::DestroyWindow;
    use windows::Win32::UI::WindowsAndMessaging::LoadIconW;
    use windows::Win32::UI::WindowsAndMessaging::RegisterClassW;
    use windows::Win32::UI::WindowsAndMessaging::UnregisterClassW;
    use windows::Win32::UI::WindowsAndMessaging::IDI_APPLICATION;
    use windows::Win32::UI::WindowsAndMessaging::WINDOW_EX_STYLE;
    use windows::Win32::UI::WindowsAndMessaging::WM_GETICON;
    use windows::Win32::UI::WindowsAndMessaging::WNDCLASSW;
    use windows::Win32::UI::WindowsAndMessaging::WS_OVERLAPPEDWINDOW;

    use super::*;

    const PAINTED_CLASS: PCWSTR = w!("MultifusPaintedWindow");

    struct PaintedWindow {
        handle: HWND,
        class_icon: usize,
    }

    impl PaintedWindow {
        fn open() -> Self {
            // SAFETY: the class icon is a system one, and the class name is ours alone.
            let class_icon = unsafe { LoadIconW(None, IDI_APPLICATION) }.expect("a system icon");
            let class = WNDCLASSW {
                lpfnWndProc: Some(answer_like_any_window),
                lpszClassName: PAINTED_CLASS,
                hIcon: class_icon,
                ..WNDCLASSW::default()
            };

            // SAFETY: the class lives for the call, and the window is destroyed on drop.
            let handle = unsafe {
                RegisterClassW(&class);

                CreateWindowExW(
                    WINDOW_EX_STYLE::default(),
                    PAINTED_CLASS,
                    PAINTED_CLASS,
                    WS_OVERLAPPEDWINDOW,
                    0,
                    0,
                    16,
                    16,
                    None,
                    None,
                    None,
                    None,
                )
            }
            .expect("a window of our own");

            Self {
                handle,
                class_icon: class_icon.0 as usize,
            }
        }

        fn id(&self) -> WindowId {
            WindowId::from_raw(self.handle.0 as usize as u64)
        }

        fn worn(&self, slot: IconSlot) -> usize {
            let mut answer = 0_usize;

            // SAFETY: the window is alive, and `WM_GETICON` only reads what it wears.
            unsafe {
                SendMessageTimeoutW(
                    self.handle,
                    WM_GETICON,
                    WPARAM(slot.message() as usize),
                    LPARAM(0),
                    SMTO_ABORTIFHUNG,
                    ICON_TIMEOUT_MS,
                    Some(&mut answer),
                );
            }

            answer
        }
    }

    impl Drop for PaintedWindow {
        fn drop(&mut self) {
            // SAFETY: both handles are ours, and nothing reads them after this.
            unsafe {
                let _ = DestroyWindow(self.handle);
                let _ = UnregisterClassW(PAINTED_CLASS, None);
            }
        }
    }

    extern "system" fn answer_like_any_window(
        handle: HWND,
        message: u32,
        wide: WPARAM,
        long: LPARAM,
    ) -> LRESULT {
        // SAFETY: the window is one of ours, and the default handler owns every message we skip.
        unsafe { DefWindowProcW(handle, message, wide, long) }
    }

    fn portrait() -> &'static [u8] {
        include_bytes!("../../icons/portraits/iop_m.ico").as_slice()
    }

    #[test]
    fn a_window_given_its_icon_back_wears_the_one_its_class_holds() {
        let window = PaintedWindow::open();
        let manager = Win32WindowManager::new(false);

        for slot in [IconSlot::Small, IconSlot::Big] {
            let held = class_icon(window.handle, slot);

            manager
                .paint_slot(window.handle, window.id(), slot, Some(portrait()))
                .expect("a portrait the window takes");

            let painted = window.worn(slot);

            assert_ne!(painted, NO_ICON, "{slot:?} wears the portrait");
            assert_ne!(painted, held, "{slot:?} left the icon of its class");

            manager
                .paint_slot(window.handle, window.id(), slot, None)
                .expect("an icon the window takes back");

            assert_eq!(
                window.worn(slot),
                held,
                "{slot:?} wears the icon of its class again, and not nothing"
            );
        }
    }

    #[test]
    fn a_window_reads_the_icon_of_its_class_in_both_slots() {
        let window = PaintedWindow::open();

        assert_eq!(
            class_icon(window.handle, IconSlot::Big),
            window.class_icon,
            "the big slot reads the icon the class was registered with"
        );
        assert_ne!(
            class_icon(window.handle, IconSlot::Small),
            NO_ICON,
            "a class with no small icon still holds the one the system drew for it"
        );
    }
}
