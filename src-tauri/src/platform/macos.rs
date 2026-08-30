use std::cell::OnceCell;
use std::ffi::c_float;
use std::ffi::c_void;
use std::ffi::CStr;
use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::ptr;
use std::ptr::NonNull;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::AtomicI32;
use std::sync::atomic::Ordering;
use std::sync::mpsc;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::PoisonError;
use std::thread;
use std::thread::JoinHandle;
use std::time::Duration;

use block2::RcBlock;
use dispatch2::DispatchQueue;
use libc::pid_t;
use objc2::ffi::object_setClass;
use objc2::msg_send;
use objc2::rc::Retained;
use objc2::runtime::AnyClass;
use objc2::runtime::AnyObject;
use objc2::runtime::NSObjectProtocol;
use objc2::runtime::ProtocolObject;
use objc2::MainThreadMarker;
use objc2_app_kit::NSApplicationActivationOptions;
use objc2_app_kit::NSRunningApplication;
use objc2_app_kit::NSScreen;
use objc2_app_kit::NSWindowStyleMask;
use objc2_app_kit::NSWorkspace;
use objc2_app_kit::NSWorkspaceDidActivateApplicationNotification;
use objc2_application_services::kAXTrustedCheckOptionPrompt;
use objc2_application_services::AXError;
use objc2_application_services::AXIsProcessTrusted;
use objc2_application_services::AXIsProcessTrustedWithOptions;
use objc2_application_services::AXObserver;
use objc2_application_services::AXUIElement;
use objc2_application_services::AXValue;
use objc2_application_services::AXValueType;
use objc2_core_foundation::kCFBooleanFalse;
use objc2_core_foundation::kCFBooleanTrue;
use objc2_core_foundation::kCFPreferencesCurrentHost;
use objc2_core_foundation::kCFPreferencesCurrentUser;
use objc2_core_foundation::kCFRunLoopDefaultMode;
use objc2_core_foundation::CFArray;
use objc2_core_foundation::CFBoolean;
use objc2_core_foundation::CFDictionary;
use objc2_core_foundation::CFMachPort;
use objc2_core_foundation::CFNumber;
use objc2_core_foundation::CFPreferencesCopyValue;
use objc2_core_foundation::CFRetained;
use objc2_core_foundation::CFRunLoop;
use objc2_core_foundation::CFString;
use objc2_core_foundation::CFType;
use objc2_core_foundation::CGFloat;
use objc2_core_foundation::CGPoint;
use objc2_core_foundation::CGRect;
use objc2_core_foundation::CGSize;
use objc2_core_graphics::CGEvent;
use objc2_core_graphics::CGEventFlags;
use objc2_core_graphics::CGEventMask;
use objc2_core_graphics::CGEventSource;
use objc2_core_graphics::CGEventSourceStateID;
use objc2_core_graphics::CGEventTapLocation;
use objc2_core_graphics::CGEventTapOptions;
use objc2_core_graphics::CGEventTapPlacement;
use objc2_core_graphics::CGEventTapProxy;
use objc2_core_graphics::CGEventType;
use objc2_core_graphics::CGKeyCode;
use objc2_foundation::NSNotification;
use objc2_foundation::NSNotificationCenter;
use objc2_foundation::NSString;

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
use crate::platform::keyboard::KeyLabels;
use crate::platform::notification::NotificationReport;
use crate::platform::notification::NotificationSink;
use crate::platform::notification::NotificationWatcher;
use crate::platform::paste::PasteSender;
use crate::platform::window::GameWindow;
use crate::platform::window::ScreenFrame;
use crate::platform::window::ScreenPoint;
use crate::platform::window::ShortTitleReport;
use crate::platform::window::WindowId;
use crate::platform::window::WindowManager;
use crate::platform::Authorization;

const DOFUS_BUNDLE_ID: &str = "com.dofus.d1elauncher";

const NOTIFICATION_CENTRE_BUNDLE_ID: &str = "com.apple.notificationcenterui";

const AX_TITLE: &str = "AXTitle";
const AX_MAIN_WINDOW: &str = "AXMainWindow";
const AX_MINIMIZED: &str = "AXMinimized";
const AX_POSITION: &str = "AXPosition";
const AX_SIZE: &str = "AXSize";
const AX_WINDOWS: &str = "AXWindows";
const AX_CHILDREN: &str = "AXChildren";
const AX_ROLE: &str = "AXRole";
const AX_VALUE: &str = "AXValue";
const AX_FRONTMOST: &str = "AXFrontmost";
const AX_STATIC_TEXT_ROLE: &str = "AXStaticText";
const AX_CREATED_NOTIFICATION: &str = "AXCreated";

const MAX_BANNER_DEPTH: usize = 8;

const MAX_BANNER_TEXTS: usize = 4;

const STOP_CHECK_SECONDS: f64 = 0.25;

const CLICK_MASK: CGEventMask = (1 << CGEventType::LeftMouseDown.0)
    | (1 << CGEventType::LeftMouseUp.0)
    | (1 << CGEventType::RightMouseDown.0)
    | (1 << CGEventType::RightMouseUp.0);

const NOBODY: pid_t = -1;

fn accessibility_authorization() -> Authorization {
    // SAFETY: no argument, and the call has no invariant to uphold.
    if unsafe { AXIsProcessTrusted() } {
        Authorization::Granted
    } else {
        Authorization::Denied
    }
}

fn request_accessibility_authorization() -> Authorization {
    // SAFETY: both are constants of the framework, alive for the whole process.
    let prompt = unsafe { kAXTrustedCheckOptionPrompt };
    let Some(yes) = (unsafe { kCFBooleanTrue }) else {
        return accessibility_authorization();
    };

    let options = CFDictionary::from_slices(&[prompt], &[yes]);

    // SAFETY: the dictionary holds the key the function documents, with its boolean.
    if unsafe { AXIsProcessTrustedWithOptions(Some(options.as_opaque())) } {
        Authorization::Granted
    } else {
        Authorization::Denied
    }
}

fn ax_result(status: AXError, operation: &'static str) -> Result<()> {
    match status {
        AXError::Success => Ok(()),
        AXError::APIDisabled => Err(PlatformError::AuthorizationDenied),
        other => Err(PlatformError::system(
            operation,
            format!("AXError {}", other.0),
        )),
    }
}

fn attribute(element: &AXUIElement, name: &str) -> Result<Option<CFRetained<CFType>>> {
    let name = CFString::from_str(name);
    let mut value: *const CFType = ptr::null();

    // SAFETY: `value` is a live pointer for the duration of the call.
    let status = unsafe { element.copy_attribute_value(&name, NonNull::from(&mut value)) };

    match status {
        AXError::Success => {
            let Some(value) = NonNull::new(value.cast_mut()) else {
                return Ok(None);
            };

            // SAFETY: the Create rule applies, so this reference is ours to own.
            Ok(Some(unsafe { CFRetained::from_raw(value) }))
        }
        AXError::NoValue
        | AXError::AttributeUnsupported
        | AXError::InvalidUIElement
        | AXError::CannotComplete
        | AXError::NotImplemented => Ok(None),
        other => ax_result(other, "reading an accessibility attribute").map(|()| None),
    }
}

fn string_attribute(element: &AXUIElement, name: &str) -> Result<Option<String>> {
    Ok(attribute(element, name)?
        .and_then(|value| value.downcast::<CFString>().ok())
        .map(|text| text.to_string()))
}

fn bool_attribute(element: &AXUIElement, name: &str) -> Result<Option<bool>> {
    Ok(attribute(element, name)?
        .and_then(|value| value.downcast::<CFBoolean>().ok())
        .map(|flag| flag.value()))
}

fn element_attribute(element: &AXUIElement, name: &str) -> Result<Option<CFRetained<AXUIElement>>> {
    Ok(attribute(element, name)?.and_then(|value| value.downcast::<AXUIElement>().ok()))
}

fn element_array_attribute(
    element: &AXUIElement,
    name: &str,
) -> Result<Vec<CFRetained<AXUIElement>>> {
    let Some(value) = attribute(element, name)? else {
        return Ok(Vec::new());
    };

    let Ok(array) = value.downcast::<CFArray>() else {
        return Ok(Vec::new());
    };

    // SAFETY: those attributes hold CF types, and `downcast` checks each element.
    let array = unsafe { array.cast_unchecked::<CFType>() };

    Ok(array
        .to_vec()
        .into_iter()
        .filter_map(|item| item.downcast::<AXUIElement>().ok())
        .collect())
}

fn dofus_applications() -> Vec<Retained<NSRunningApplication>> {
    let bundle = NSString::from_str(DOFUS_BUNDLE_ID);

    NSRunningApplication::runningApplicationsWithBundleIdentifier(&bundle).to_vec()
}

fn windows_of(application: &AXUIElement) -> Result<Vec<CFRetained<AXUIElement>>> {
    let mut windows = Vec::new();

    if let Some(main_window) = element_attribute(application, AX_MAIN_WINDOW)? {
        windows.push(main_window);
    }

    windows.extend(element_array_attribute(application, AX_WINDOWS)?);

    Ok(windows)
}

fn window_titles(application: &AXUIElement) -> Result<Vec<String>> {
    let mut titles = Vec::new();

    for window in windows_of(application)? {
        titles.extend(string_attribute(&window, AX_TITLE)?);
    }

    Ok(titles)
}

fn client_window_element(application: &AXUIElement) -> Result<Option<CFRetained<AXUIElement>>> {
    for window in windows_of(application)? {
        let titled =
            string_attribute(&window, AX_TITLE)?.is_some_and(|title| !title.trim().is_empty());

        if titled {
            return Ok(Some(window));
        }
    }

    Ok(None)
}

fn game_window_element(
    id: WindowId,
    application: &AXUIElement,
) -> Result<Option<(CFRetained<AXUIElement>, String)>> {
    for window in windows_of(application)? {
        let Some(title) = string_attribute(&window, AX_TITLE)? else {
            continue;
        };

        if GameWindow::from_title(id, &title).is_some() {
            return Ok(Some((window, title)));
        }
    }

    Ok(None)
}

fn game_window(application: &NSRunningApplication) -> Result<Option<GameWindow>> {
    let Some(id) = client_id(application) else {
        return Ok(None);
    };

    // SAFETY: the call is valid for any pid, and this one is of a running application.
    let element = unsafe { AXUIElement::new_application(application.processIdentifier()) };

    for title in window_titles(&element)? {
        if let Some(window) = GameWindow::from_title(id, &title) {
            return Ok(Some(window));
        }
    }

    Ok(None)
}

fn client_id(application: &NSRunningApplication) -> Option<WindowId> {
    u64::try_from(application.processIdentifier())
        .ok()
        .map(WindowId::from_raw)
}

fn set_frontmost(application: &AXUIElement) -> Result<()> {
    let name = CFString::from_str(AX_FRONTMOST);

    // SAFETY: a constant of the framework, alive for the whole process.
    let Some(yes) = (unsafe { kCFBooleanTrue }) else {
        return Err(PlatformError::system(
            "focusing a client",
            "kCFBooleanTrue is missing",
        ));
    };

    // SAFETY: `AXFrontmost` takes a boolean, which is what is passed.
    let status = unsafe { application.set_attribute_value(&name, yes) };

    match status {
        AXError::InvalidUIElement | AXError::CannotComplete => Err(PlatformError::WindowGone),
        other => ax_result(other, "focusing a client"),
    }
}

fn live_application(
    window: WindowId,
) -> Result<(Retained<NSRunningApplication>, CFRetained<AXUIElement>)> {
    let pid = pid_t::try_from(window.raw()).map_err(|_| PlatformError::WindowGone)?;

    let Some(application) = NSRunningApplication::runningApplicationWithProcessIdentifier(pid)
    else {
        return Err(PlatformError::WindowGone);
    };

    if application.isTerminated() {
        return Err(PlatformError::WindowGone);
    }

    // SAFETY: the pid belongs to an application the system just reported as running.
    let element = unsafe { AXUIElement::new_application(pid) };

    Ok((application, element))
}

fn restore(window: &AXUIElement) -> Result<()> {
    if bool_attribute(window, AX_MINIMIZED)? != Some(true) {
        return Ok(());
    }

    let name = CFString::from_str(AX_MINIMIZED);

    // SAFETY: a constant of the framework, alive for the whole process.
    let Some(no) = (unsafe { kCFBooleanFalse }) else {
        return Err(PlatformError::system(
            "restoring a window",
            "kCFBooleanFalse is missing",
        ));
    };

    // SAFETY: `AXMinimized` takes a boolean, which is what is passed.
    let status = unsafe { window.set_attribute_value(&name, no) };

    match status {
        AXError::InvalidUIElement | AXError::CannotComplete => Err(PlatformError::WindowGone),
        other => ax_result(other, "restoring a window"),
    }
}

fn point_attribute(element: &AXUIElement, name: &str) -> Result<Option<CGPoint>> {
    let Some(value) = attribute(element, name)? else {
        return Ok(None);
    };

    let Ok(value) = value.downcast::<AXValue>() else {
        return Ok(None);
    };

    let mut point = CGPoint::ZERO;

    // SAFETY: the type asked for is the one `point` holds.
    let read = unsafe { value.value(AXValueType::CGPoint, NonNull::from(&mut point).cast()) };

    Ok(read.then_some(point))
}

fn size_attribute(element: &AXUIElement, name: &str) -> Result<Option<CGSize>> {
    let Some(value) = attribute(element, name)? else {
        return Ok(None);
    };

    let Ok(value) = value.downcast::<AXValue>() else {
        return Ok(None);
    };

    let mut size = CGSize::ZERO;

    // SAFETY: the type asked for is the one `size` holds.
    let read = unsafe { value.value(AXValueType::CGSize, NonNull::from(&mut size).cast()) };

    Ok(read.then_some(size))
}

fn matches_maximized_window(window: WindowId, areas: &WorkAreas) -> bool {
    let Ok((_, element)) = live_application(window) else {
        return false;
    };

    let Ok(Some(game_window)) = client_window_element(&element) else {
        return false;
    };

    let (Ok(Some(position)), Ok(Some(size))) = (
        point_attribute(&game_window, AX_POSITION),
        size_attribute(&game_window, AX_SIZE),
    ) else {
        return false;
    };

    let Some(area) = work_area_of(areas, position) else {
        return false;
    };

    matches_maximized(CGRect::new(position, size), area)
}

const MAXIMIZED_SLACK: CGFloat = 2.0;

fn matches_maximized(frame: CGRect, area: CGRect) -> bool {
    let sides = [
        (frame.origin.x, area.origin.x),
        (frame.origin.y, area.origin.y),
        (frame.size.width, area.size.width),
        (frame.size.height, area.size.height),
    ];

    sides
        .into_iter()
        .all(|(worn, wanted)| (worn - wanted).abs() <= MAXIMIZED_SLACK)
}

fn set_position(window: &AXUIElement, mut position: CGPoint) -> Result<()> {
    // SAFETY: the pointer is to a live `CGPoint`, which is the type named.
    let value = unsafe { AXValue::new(AXValueType::CGPoint, NonNull::from(&mut position).cast()) };

    set_window_value(window, AX_POSITION, value.as_deref(), "moving a window")
}

fn set_size(window: &AXUIElement, mut size: CGSize) -> Result<()> {
    // SAFETY: the pointer is to a live `CGSize`, which is the type named.
    let value = unsafe { AXValue::new(AXValueType::CGSize, NonNull::from(&mut size).cast()) };

    set_window_value(window, AX_SIZE, value.as_deref(), "resizing a window")
}

fn set_window_value(
    window: &AXUIElement,
    name: &str,
    value: Option<&AXValue>,
    operation: &'static str,
) -> Result<()> {
    let Some(value) = value else {
        return Err(PlatformError::system(
            operation,
            "AXValueCreate returned nothing",
        ));
    };

    let name = CFString::from_str(name);

    // SAFETY: the attribute takes the structure that was just encoded into it.
    let status = unsafe { window.set_attribute_value(&name, value) };

    match status {
        AXError::InvalidUIElement | AXError::CannotComplete => Err(PlatformError::WindowGone),
        other => ax_result(other, operation),
    }
}

struct WorkAreas {
    screens: Vec<(CGRect, CGRect)>,
    main: Option<CGRect>,
}

fn work_areas() -> Option<WorkAreas> {
    on_main_thread(|marker| {
        let screens = NSScreen::screens(marker);
        let flip = screens.firstObject()?.frame().size.height;

        Some(WorkAreas {
            screens: screens
                .iter()
                .map(|screen| {
                    (
                        flipped(screen.frame(), flip),
                        flipped(screen.visibleFrame(), flip),
                    )
                })
                .collect(),
            main: NSScreen::mainScreen(marker).map(|screen| flipped(screen.visibleFrame(), flip)),
        })
    })
    .flatten()
}

fn work_area_of(areas: &WorkAreas, position: CGPoint) -> Option<CGRect> {
    areas
        .screens
        .iter()
        .find(|(frame, _)| holds(*frame, position))
        .map(|(_, visible)| *visible)
        .or(areas.main)
}

fn work_area(position: CGPoint) -> Option<CGRect> {
    work_area_of(&work_areas()?, position)
}

fn flipped(frame: CGRect, flip: CGFloat) -> CGRect {
    CGRect::new(
        CGPoint::new(frame.origin.x, flip - frame.max().y),
        frame.size,
    )
}

fn holds(frame: CGRect, corner: CGPoint) -> bool {
    let (min, max) = (frame.min(), frame.max());

    corner.x >= min.x && corner.x < max.x && corner.y >= min.y && corner.y < max.y
}

fn on_main_thread<T: Send>(work: impl FnOnce(MainThreadMarker) -> T + Send) -> Option<T> {
    if let Some(marker) = MainThreadMarker::new() {
        return Some(work(marker));
    }

    let mut done = None;

    DispatchQueue::main().exec_sync(|| {
        done = catch_unwind(AssertUnwindSafe(|| {
            let marker = MainThreadMarker::new().expect("the main queue runs on the main thread");

            work(marker)
        }))
        .ok();
    });

    done
}

const POSING_A_PANEL: &str = "posing a window as a panel";

const NS_PANEL: &CStr = c"NSPanel";

const NS_WINDOW: &CStr = c"NSWindow";

fn matches_a_kind_of(worn: &AnyClass, wanted: &AnyClass) -> bool {
    let mut climbed = Some(worn);

    while let Some(step) = climbed {
        if std::ptr::eq(step, wanted) {
            return true;
        }

        climbed = step.superclass();
    }

    false
}

#[must_use]
pub fn matches_frontmost() -> bool {
    NSRunningApplication::currentApplication().isActive()
}

pub fn hold_back_activation(ns_window: *mut c_void) -> Result<()> {
    if MainThreadMarker::new().is_none() {
        return Err(PlatformError::system(
            POSING_A_PANEL,
            "AppKit answers on the main thread only",
        ));
    }

    let Some(window) = NonNull::new(ns_window.cast::<AnyObject>()) else {
        return Err(PlatformError::system(
            POSING_A_PANEL,
            "the window has no handle",
        ));
    };

    let Some(panel) = AnyClass::get(NS_PANEL) else {
        return Err(PlatformError::system(POSING_A_PANEL, "NSPanel is missing"));
    };

    let Some(plain) = AnyClass::get(NS_WINDOW) else {
        return Err(PlatformError::system(POSING_A_PANEL, "NSWindow is missing"));
    };

    if panel.instance_size() > plain.instance_size() {
        return Err(PlatformError::system(
            POSING_A_PANEL,
            "NSPanel holds room of its own, over what NSWindow holds",
        ));
    }

    // SAFETY: the handle names the window Tauri has just built, alive for this call.
    let worn = unsafe { window.as_ref() }.class();

    if !matches_a_kind_of(worn, plain) {
        return Err(PlatformError::system(
            POSING_A_PANEL,
            "the handle names something that is not a window of AppKit",
        ));
    }

    // SAFETY: the window is an NSWindow, and NSPanel asks for no more room than one.
    unsafe { object_setClass(window.as_ptr(), panel) };

    // SAFETY: the three selectors are NSWindow's own, and the mask is the window's.
    unsafe {
        let worn: usize = msg_send![window.as_ptr(), styleMask];
        let _: () = msg_send![
            window.as_ptr(),
            setStyleMask: worn | NSWindowStyleMask::NonactivatingPanel.0
        ];
        let _: () = msg_send![window.as_ptr(), setHidesOnDeactivate: false];
        let _: () = msg_send![window.as_ptr(), setBecomesKeyOnlyIfNeeded: true];
    }

    Ok(())
}

#[derive(Debug, Default)]
pub struct AccessibilityWindowManager;

impl AccessibilityWindowManager {
    #[must_use]
    pub fn new(_short_titles: bool) -> Self {
        Self
    }
}

impl WindowManager for AccessibilityWindowManager {
    fn authorization(&self) -> Result<Authorization> {
        Ok(accessibility_authorization())
    }

    fn request_authorization(&self) -> Result<Authorization> {
        Ok(request_accessibility_authorization())
    }

    fn game_windows(&self) -> Result<Vec<GameWindow>> {
        if !accessibility_authorization().is_granted() {
            return Err(PlatformError::AuthorizationDenied);
        }

        let mut windows = Vec::new();

        for application in dofus_applications() {
            if let Some(window) = game_window(&application)? {
                windows.push(window);
            }
        }

        Ok(windows)
    }

    fn window_at(&self, at: ScreenPoint) -> Result<Option<WindowId>> {
        // SAFETY: the system-wide element needs no argument and is always valid.
        let system = unsafe { AXUIElement::new_system_wide() };
        let mut found: *const AXUIElement = ptr::null();

        // SAFETY: `found` is a live pointer for the duration of the call.
        let status = unsafe {
            system.copy_element_at_position(
                at.x as c_float,
                at.y as c_float,
                NonNull::from(&mut found),
            )
        };

        let Some(found) = NonNull::new(found.cast_mut()).filter(|_| status == AXError::Success)
        else {
            return Ok(None);
        };

        // SAFETY: the Create rule applies, so this reference is ours to own.
        let found = unsafe { CFRetained::from_raw(found) };
        let mut pid: pid_t = NOBODY;

        // SAFETY: `pid` is a live pointer for the duration of the call.
        let status = unsafe { found.pid(NonNull::from(&mut pid)) };

        if status != AXError::Success {
            return Ok(None);
        }

        Ok(u64::try_from(pid).ok().map(WindowId::from_raw))
    }

    fn window_frame(&self, window: WindowId) -> Result<Option<ScreenFrame>> {
        let (_, element) = live_application(window)?;

        let Some(game_window) = client_window_element(&element)? else {
            return Ok(None);
        };

        let (Some(position), Some(size)) = (
            point_attribute(&game_window, AX_POSITION)?,
            size_attribute(&game_window, AX_SIZE)?,
        ) else {
            return Ok(None);
        };

        Ok(Some(ScreenFrame {
            origin: ScreenPoint {
                x: position.x,
                y: position.y,
            },
            width: size.width,
            height: size.height,
        }))
    }

    fn foreground_game_window(&self) -> Result<Option<GameWindow>> {
        if !accessibility_authorization().is_granted() {
            return Err(PlatformError::AuthorizationDenied);
        }

        for application in dofus_applications() {
            if application.isActive() {
                return game_window(&application);
            }
        }

        Ok(None)
    }

    fn is_minimized(&self, window: WindowId) -> Result<bool> {
        let (_, element) = live_application(window)?;

        let Some((game_window, _)) = game_window_element(window, &element)? else {
            return Err(PlatformError::WindowGone);
        };

        Ok(bool_attribute(&game_window, AX_MINIMIZED)? == Some(true))
    }

    fn focus(&self, window: WindowId) -> Result<()> {
        let (application, element) = live_application(window)?;

        if let Some((game_window, _)) = game_window_element(window, &element)? {
            restore(&game_window)?;
        }

        if application.activateWithOptions(NSApplicationActivationOptions::ActivateAllWindows) {
            return Ok(());
        }

        set_frontmost(&element)
    }

    fn focus_fast(&self, window: WindowId) -> Result<()> {
        let (application, element) = live_application(window)?;

        let client = match element_attribute(&element, AX_MAIN_WINDOW)? {
            Some(main_window) => Some(main_window),
            None => client_window_element(&element)?,
        };

        if let Some(client) = client {
            restore(&client)?;
        }

        if application.activateWithOptions(NSApplicationActivationOptions::ActivateAllWindows) {
            return Ok(());
        }

        set_frontmost(&element)
    }

    fn client_windows(&self) -> Result<Vec<WindowId>> {
        if !accessibility_authorization().is_granted() {
            return Err(PlatformError::AuthorizationDenied);
        }

        let mut clients = Vec::new();

        for application in dofus_applications() {
            let pid = application.processIdentifier();
            let Ok(raw) = u64::try_from(pid) else {
                continue;
            };

            // SAFETY: the call is valid for any pid, and this one is of a running application.
            let element = unsafe { AXUIElement::new_application(pid) };

            if client_window_element(&element)?.is_some() {
                clients.push(WindowId::from_raw(raw));
            }
        }

        Ok(clients)
    }

    fn maximized_windows(&self, windows: &[WindowId]) -> Vec<WindowId> {
        let Some(areas) = work_areas() else {
            return Vec::new();
        };

        windows
            .iter()
            .filter(|window| matches_maximized_window(**window, &areas))
            .copied()
            .collect()
    }

    fn maximize(&self, window: WindowId) -> Result<()> {
        let (_, element) = live_application(window)?;

        let Some(game_window) = client_window_element(&element)? else {
            return Err(PlatformError::WindowGone);
        };

        let Some(position) = point_attribute(&game_window, AX_POSITION)? else {
            return Err(PlatformError::system(
                "maximizing a window",
                "the window has no position",
            ));
        };

        let Some(area) = work_area(position) else {
            return Err(PlatformError::system(
                "maximizing a window",
                "the system reports no screen",
            ));
        };

        set_position(&game_window, area.origin)?;
        set_size(&game_window, area.size)
    }

    fn apply_short_titles(&self, _short: bool, _suffix: Option<&str>) -> Result<ShortTitleReport> {
        Ok(ShortTitleReport::default())
    }

    fn set_window_icon(&self, _window: WindowId, _icon: Option<&[u8]>) -> Result<()> {
        Ok(())
    }

    fn forget_closed_windows(&self) {}

    fn taskbar_combines(&self) -> Result<bool> {
        Ok(false)
    }

    fn set_window_group(&self, _window: WindowId, _group: Option<&str>) -> Result<()> {
        Ok(())
    }
}

#[derive(Debug, Default)]
pub struct MouseTapClickWatcher {
    listening: Mutex<Option<TapListening>>,
}

#[derive(Debug)]
struct TapListening {
    running: Arc<AtomicBool>,
    run_loop: LiveRunLoop,
    thread: JoinHandle<()>,
}

#[derive(Debug)]
struct LiveRunLoop(CFRetained<CFRunLoop>);

// SAFETY: stopping a run loop from another thread is what CFRunLoop documents as safe.
unsafe impl Send for LiveRunLoop {}

impl MouseTapClickWatcher {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }
}

impl ClickWatcher for MouseTapClickWatcher {
    fn start(&self, gate: Arc<ClickGate>, sink: ClickSink) -> Result<()> {
        let mut listening = self
            .listening
            .lock()
            .unwrap_or_else(PoisonError::into_inner);

        if listening.is_some() {
            return Ok(());
        }

        if !accessibility_authorization().is_granted() {
            return Err(PlatformError::AuthorizationDenied);
        }

        let running = Arc::new(AtomicBool::new(true));
        let (told, ready) = mpsc::channel();

        let thread = thread::Builder::new()
            .name("multifus-clicks".to_owned())
            .spawn({
                let running = Arc::clone(&running);

                move || watch_clicks(&gate, &sink, &running, &told)
            })
            .map_err(|error| PlatformError::system("starting the click tap", error.to_string()))?;

        let outcome = ready.recv().unwrap_or_else(|_| {
            Err(PlatformError::system(
                "starting the click tap",
                "the click thread stopped before it was listening",
            ))
        });

        match outcome {
            Ok(run_loop) => {
                *listening = Some(TapListening {
                    running,
                    run_loop,
                    thread,
                });

                Ok(())
            }
            Err(error) => {
                drop(thread.join());

                Err(error)
            }
        }
    }

    fn stop(&self) {
        let taken = self
            .listening
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .take();

        let Some(listening) = taken else {
            return;
        };

        listening.running.store(false, Ordering::Relaxed);
        listening.run_loop.0.stop();

        drop(listening.thread.join());
    }
}

impl Drop for MouseTapClickWatcher {
    fn drop(&mut self) {
        self.stop();
    }
}

struct WatchedClicks {
    gate: Arc<ClickGate>,
    sink: ClickSink,
    judge: ClickJudge,
    front: Arc<AtomicI32>,
    tap: OnceCell<CFRetained<CFMachPort>>,
}

impl WatchedClicks {
    fn verdict_of(&self, kind: CGEventType, event: &CGEvent) -> Verdict {
        match kind {
            CGEventType::LeftMouseDown => self.judge.press(&self.gate, self.window_clicked(event)),
            CGEventType::LeftMouseUp => self.judge.release(&self.gate, &self.sink),
            CGEventType::RightMouseDown => self.judge.press_right(&self.gate),
            CGEventType::RightMouseUp => self.judge.release_right(),
            CGEventType::TapDisabledByTimeout | CGEventType::TapDisabledByUserInput => {
                self.resume();

                Verdict::Pass
            }
            _ => Verdict::Pass,
        }
    }

    fn window_clicked(&self, event: &CGEvent) -> Option<ClickedAt> {
        let window = self.window_in_front()?;
        let at = CGEvent::location(Some(event));

        Some(ClickedAt {
            window,
            at: ScreenPoint { x: at.x, y: at.y },
        })
    }

    fn window_in_front(&self) -> Option<WindowId> {
        u64::try_from(self.front.load(Ordering::Acquire))
            .ok()
            .map(WindowId::from_raw)
    }

    fn resume(&self) {
        let Some(tap) = self.tap.get() else {
            return;
        };

        CGEvent::tap_enable(tap, true);

        if CGEvent::tap_is_enabled(tap) {
            (self.sink)(ClickReport::ListeningResumed);
        } else {
            (self.sink)(ClickReport::ListeningLost);
        }
    }
}

struct ForegroundWatch {
    centre: Retained<NSNotificationCenter>,
    observer: Retained<ProtocolObject<dyn NSObjectProtocol>>,
}

impl Drop for ForegroundWatch {
    fn drop(&mut self) {
        // SAFETY: the observer is the one this centre handed out, and nothing else holds it.
        unsafe { self.centre.removeObserver(self.observer.as_ref()) };
    }
}

fn watch_clicks(
    gate: &Arc<ClickGate>,
    sink: &ClickSink,
    running: &AtomicBool,
    told: &mpsc::Sender<Result<LiveRunLoop>>,
) {
    let front = Arc::new(AtomicI32::new(active_client_pid()));
    let watched = WatchedClicks {
        gate: Arc::clone(gate),
        sink: Arc::clone(sink),
        judge: ClickJudge::default(),
        front: Arc::clone(&front),
        tap: OnceCell::new(),
    };
    let refcon: *mut c_void = ptr::from_ref(&watched).cast_mut().cast();

    let tap = match create_tap(refcon) {
        Ok(tap) => tap,
        Err(error) => {
            drop(told.send(Err(error)));

            return;
        }
    };

    let Some(source) = CFMachPort::new_run_loop_source(None, Some(&tap), 0) else {
        drop(told.send(Err(PlatformError::system(
            "CFMachPortCreateRunLoopSource",
            "the tap gave no source to listen on",
        ))));

        return;
    };

    let Some(run_loop) = CFRunLoop::current() else {
        drop(told.send(Err(PlatformError::system(
            "starting the click tap",
            "this thread has no run loop",
        ))));

        return;
    };

    drop(watched.tap.set(tap.clone()));

    // SAFETY: a constant of the framework, alive for the whole process.
    let mode = unsafe { kCFRunLoopDefaultMode };

    run_loop.add_source(Some(&source), mode);
    CGEvent::tap_enable(&tap, true);

    let watching = watch_foreground(gate, sink, &front);

    if told.send(Ok(LiveRunLoop(run_loop.clone()))).is_ok() {
        while running.load(Ordering::Relaxed) {
            CFRunLoop::run_in_mode(mode, STOP_CHECK_SECONDS, false);
        }
    }

    drop(watching);

    CGEvent::tap_enable(&tap, false);
    run_loop.remove_source(Some(&source), mode);
}

fn create_tap(refcon: *mut c_void) -> Result<CFRetained<CFMachPort>> {
    // SAFETY: the callback has the signature the API documents, and `refcon` outlives the tap.
    let tap = unsafe {
        CGEvent::tap_create(
            CGEventTapLocation::SessionEventTap,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::Default,
            CLICK_MASK,
            Some(on_mouse_event),
            refcon,
        )
    };

    tap.ok_or_else(|| {
        PlatformError::system(
            "CGEventTapCreate",
            "the system refused to hand Multifus the clicks",
        )
    })
}

fn watch_foreground(
    gate: &Arc<ClickGate>,
    sink: &ClickSink,
    front: &Arc<AtomicI32>,
) -> ForegroundWatch {
    let told = RcBlock::new({
        let gate = Arc::clone(gate);
        let sink = Arc::clone(sink);
        let front = Arc::clone(front);

        move |_: NonNull<NSNotification>| {
            drop(catch_unwind(AssertUnwindSafe(|| {
                report_foreground(&gate, &sink, &front);
            })));
        }
    });

    let centre = NSWorkspace::sharedWorkspace().notificationCenter();

    // SAFETY: both the name and the block are the ones the API documents, retired on drop.
    let observer = unsafe {
        centre.addObserverForName_object_queue_usingBlock(
            Some(NSWorkspaceDidActivateApplicationNotification),
            None,
            None,
            &told,
        )
    };

    ForegroundWatch { centre, observer }
}

fn report_foreground(gate: &ClickGate, sink: &ClickSink, front: &AtomicI32) {
    let Some(pid) = frontmost_pid() else {
        return;
    };

    front.store(pid, Ordering::Release);

    let Ok(raw) = u64::try_from(pid) else {
        return;
    };

    let window = WindowId::from_raw(raw);

    gate.note_foreground(window);

    (sink)(ClickReport::Foreground { window });
}

fn frontmost_pid() -> Option<pid_t> {
    NSWorkspace::sharedWorkspace()
        .frontmostApplication()
        .map(|application| application.processIdentifier())
}

fn active_client_pid() -> pid_t {
    dofus_applications()
        .into_iter()
        .find(|application| application.isActive())
        .map_or(NOBODY, |application| application.processIdentifier())
}

unsafe extern "C-unwind" fn on_mouse_event(
    _proxy: CGEventTapProxy,
    kind: CGEventType,
    event: NonNull<CGEvent>,
    refcon: *mut c_void,
) -> *mut CGEvent {
    if refcon.is_null() {
        return event.as_ptr();
    }

    // SAFETY: `refcon` is what `watch_clicks` registered, alive until the tap is torn down.
    let watched: &WatchedClicks = unsafe { &*refcon.cast::<WatchedClicks>() };

    // SAFETY: the system hands a live event to its callback.
    let clicked: &CGEvent = unsafe { event.as_ref() };

    match catch_unwind(AssertUnwindSafe(|| watched.verdict_of(kind, clicked))) {
        Ok(Verdict::Eat) => ptr::null_mut(),
        _ => event.as_ptr(),
    }
}

#[derive(Debug, Default)]
pub struct BannerNotificationWatcher {
    listening: Option<Listening>,
}

#[derive(Debug)]
struct Listening {
    running: Arc<AtomicBool>,
    thread: JoinHandle<()>,
}

impl BannerNotificationWatcher {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }
}

impl NotificationWatcher for BannerNotificationWatcher {
    fn authorization(&self) -> Result<Authorization> {
        Ok(accessibility_authorization())
    }

    fn request_authorization(&self) -> Result<Authorization> {
        Ok(request_accessibility_authorization())
    }

    fn start(&mut self, sink: NotificationSink) -> Result<()> {
        self.stop()?;

        if !accessibility_authorization().is_granted() {
            return Err(PlatformError::AuthorizationDenied);
        }

        let pid = notification_centre_pid()?;
        let running = Arc::new(AtomicBool::new(true));
        let (ready_sender, ready_receiver) = mpsc::channel();

        let thread = thread::Builder::new()
            .name("multifus-banner-watcher".to_owned())
            .spawn({
                let running = Arc::clone(&running);

                move || watch(pid, sink, &running, &ready_sender)
            })
            .map_err(|error| {
                PlatformError::system("starting the banner watcher", error.to_string())
            })?;

        let outcome = ready_receiver.recv().unwrap_or_else(|_| {
            Err(PlatformError::system(
                "starting the banner watcher",
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
            PlatformError::system("stopping the banner watcher", "the watcher thread panicked")
        })
    }

    fn dismiss(&self, _nickname: &str) -> Result<()> {
        Ok(())
    }
}

impl Drop for BannerNotificationWatcher {
    fn drop(&mut self) {
        drop(self.stop());
    }
}

fn notification_centre_pid() -> Result<pid_t> {
    let bundle = NSString::from_str(NOTIFICATION_CENTRE_BUNDLE_ID);

    NSRunningApplication::runningApplicationsWithBundleIdentifier(&bundle)
        .firstObject()
        .map(|application| application.processIdentifier())
        .ok_or_else(|| {
            PlatformError::system(
                "finding the notification centre",
                format!("{NOTIFICATION_CENTRE_BUNDLE_ID} is not running"),
            )
        })
}

fn watch(
    pid: pid_t,
    sink: NotificationSink,
    running: &AtomicBool,
    ready: &mpsc::Sender<Result<()>>,
) {
    let refcon: *mut c_void = ptr::from_ref(&sink).cast_mut().cast();

    let observer = match create_observer(pid, refcon) {
        Ok(observer) => observer,
        Err(error) => {
            drop(ready.send(Err(error)));

            return;
        }
    };

    // SAFETY: the observer was just created and is alive for the whole body.
    let source = unsafe { observer.run_loop_source() };

    let Some(run_loop) = CFRunLoop::current() else {
        drop(ready.send(Err(PlatformError::system(
            "starting the banner watcher",
            "this thread has no run loop",
        ))));

        return;
    };

    // SAFETY: a constant of the framework, alive for the whole process.
    let mode = unsafe { kCFRunLoopDefaultMode };

    run_loop.add_source(Some(&source), mode);

    if ready.send(Ok(())).is_ok() {
        while running.load(Ordering::Relaxed) {
            CFRunLoop::run_in_mode(mode, STOP_CHECK_SECONDS, false);
        }
    }

    run_loop.remove_source(Some(&source), mode);
}

fn create_observer(pid: pid_t, refcon: *mut c_void) -> Result<CFRetained<AXObserver>> {
    let mut observer: *mut AXObserver = ptr::null_mut();

    // SAFETY: the callback has the signature the API documents, and `observer` is live.
    let status =
        unsafe { AXObserver::create(pid, Some(on_banner_created), NonNull::from(&mut observer)) };

    ax_result(status, "creating the banner observer")?;

    let observer = NonNull::new(observer).ok_or_else(|| {
        PlatformError::system(
            "creating the banner observer",
            "the system returned nothing",
        )
    })?;

    // SAFETY: `AXObserverCreate` follows the Create rule, so this is ours.
    let observer = unsafe { CFRetained::from_raw(observer) };

    // SAFETY: the pid is the notification centre's, just reported as running.
    let application = unsafe { AXUIElement::new_application(pid) };
    let notification = CFString::from_str(AX_CREATED_NOTIFICATION);

    // SAFETY: `refcon` points at the sink, which outlives the observer.
    let status = unsafe { observer.add_notification(&application, &notification, refcon) };

    ax_result(status, "observing the banners")?;

    Ok(observer)
}

unsafe extern "C-unwind" fn on_banner_created(
    _observer: NonNull<AXObserver>,
    element: NonNull<AXUIElement>,
    _notification: NonNull<CFString>,
    refcon: *mut c_void,
) {
    if refcon.is_null() {
        return;
    }

    // SAFETY: `refcon` is the sink `watch` registered, dropped after the observer.
    let sink: &NotificationSink = unsafe { &*refcon.cast::<NotificationSink>() };

    // SAFETY: the system hands a live element to its callback.
    let element: &AXUIElement = unsafe { element.as_ref() };

    let read = catch_unwind(AssertUnwindSafe(|| read_banner(element)));

    let report = match read {
        Ok(report) => report,
        Err(_) => Some(NotificationReport::Unreadable {
            detail: "reading the banner panicked".to_owned(),
        }),
    };

    drop(catch_unwind(AssertUnwindSafe(|| {
        if let Some(report) = report {
            sink(report);
        }
    })));
}

#[derive(Debug, Default)]
struct Walk {
    texts: Vec<String>,
    refusal: Option<String>,
}

impl Walk {
    fn note(&mut self, error: &PlatformError) {
        if self.refusal.is_none() {
            self.refusal = Some(error.to_string());
        }
    }
}

fn read_banner(element: &AXUIElement) -> Option<NotificationReport> {
    let mut walk = Walk::default();

    collect_static_texts(element, 0, &mut walk);

    let found = walk
        .texts
        .iter()
        .position(|text| extract_nickname(text).is_some());

    let Some(title) = found else {
        return walk
            .refusal
            .map(|detail| NotificationReport::Unreadable { detail });
    };

    let body = walk.texts.get(title + 1).cloned().unwrap_or_default();

    Some(NotificationReport::Heard(GameNotification::new(
        walk.texts.swap_remove(title),
        body,
    )))
}

fn collect_static_texts(element: &AXUIElement, depth: usize, walk: &mut Walk) {
    if depth > MAX_BANNER_DEPTH || walk.texts.len() >= MAX_BANNER_TEXTS {
        return;
    }

    match string_attribute(element, AX_ROLE) {
        Ok(Some(role)) if role == AX_STATIC_TEXT_ROLE => {
            match string_attribute(element, AX_VALUE) {
                Ok(Some(text)) => walk.texts.push(text),
                Ok(None) => {}
                Err(error) => walk.note(&error),
            }

            return;
        }
        Ok(_) => {}
        Err(error) => {
            walk.note(&error);

            return;
        }
    }

    match element_array_attribute(element, AX_CHILDREN) {
        Ok(children) => {
            for child in children {
                collect_static_texts(&child, depth + 1, walk);
            }
        }
        Err(error) => walk.note(&error),
    }
}

type IOReturn = i32;
type IOPMAssertionID = u32;
type IOPMAssertionLevel = u32;

const IO_RETURN_SUCCESS: IOReturn = 0;
const IO_PM_ASSERTION_LEVEL_ON: IOPMAssertionLevel = 255;

const PREVENT_USER_IDLE_DISPLAY_SLEEP: &str = "PreventUserIdleDisplaySleep";

const ASSERTION_NAME: &str = "Multifus relay";

const SCREEN_SAVER_DOMAIN: &str = "com.apple.screensaver";
const SCREEN_SAVER_IDLE_TIME: &str = "idleTime";

#[link(name = "IOKit", kind = "framework")]
extern "C" {
    fn IOPMAssertionCreateWithName(
        assertion_type: &CFString,
        assertion_level: IOPMAssertionLevel,
        assertion_name: &CFString,
        assertion_id: *mut IOPMAssertionID,
    ) -> IOReturn;

    fn IOPMAssertionRelease(assertion_id: IOPMAssertionID) -> IOReturn;
}

#[derive(Debug, Default)]
pub struct PowerAssertionDisplayKeeper {
    held: Option<IOPMAssertionID>,
}

impl PowerAssertionDisplayKeeper {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }
}

impl DisplayKeeper for PowerAssertionDisplayKeeper {
    fn keep_awake(&mut self) -> Result<()> {
        if self.held.is_some() {
            return Ok(());
        }

        let kind = CFString::from_str(PREVENT_USER_IDLE_DISPLAY_SLEEP);
        let name = CFString::from_str(ASSERTION_NAME);
        let mut id: IOPMAssertionID = 0;

        // SAFETY: both strings are alive for the call, and `id` is a live pointer.
        let status =
            unsafe { IOPMAssertionCreateWithName(&kind, IO_PM_ASSERTION_LEVEL_ON, &name, &mut id) };

        if status != IO_RETURN_SUCCESS {
            return Err(PlatformError::system(
                "holding the display awake",
                format!("IOReturn {status}"),
            ));
        }

        self.held = Some(id);

        Ok(())
    }

    fn release(&mut self) -> Result<()> {
        let Some(id) = self.held.take() else {
            return Ok(());
        };

        // SAFETY: the token comes from a successful call, and moving it out avoids a double free.
        let status = unsafe { IOPMAssertionRelease(id) };

        if status != IO_RETURN_SUCCESS {
            return Err(PlatformError::system(
                "letting the display sleep again",
                format!("IOReturn {status}"),
            ));
        }

        Ok(())
    }

    fn is_awake(&self) -> bool {
        self.held.is_some()
    }

    fn screen_saver_delay(&self) -> Result<ScreenSaverDelay> {
        Ok(screen_saver_delay())
    }
}

impl Drop for PowerAssertionDisplayKeeper {
    fn drop(&mut self) {
        drop(self.release());
    }
}

const PASTE_KEY: CGKeyCode = 9;

const PRESS_TO_RELEASE: Duration = Duration::from_millis(10);

#[derive(Debug, Default)]
pub struct CoreGraphicsPasteSender;

impl CoreGraphicsPasteSender {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl PasteSender for CoreGraphicsPasteSender {
    fn send_paste_combination(&self) -> Result<()> {
        if !accessibility_authorization().is_granted() {
            return Err(PlatformError::AuthorizationDenied);
        }

        let source = CGEventSource::new(CGEventSourceStateID::Private);
        let source = source.as_deref();

        let press = keyboard_event(source, true)?;
        let release = keyboard_event(source, false)?;

        CGEvent::set_flags(Some(&press), CGEventFlags::MaskCommand);
        CGEvent::set_flags(Some(&release), CGEventFlags::MaskCommand);

        CGEvent::post(CGEventTapLocation::HIDEventTap, Some(&press));
        thread::sleep(PRESS_TO_RELEASE);
        CGEvent::post(CGEventTapLocation::HIDEventTap, Some(&release));

        Ok(())
    }
}

fn keyboard_event(source: Option<&CGEventSource>, key_down: bool) -> Result<CFRetained<CGEvent>> {
    CGEvent::new_keyboard_event(source, PASTE_KEY, key_down).ok_or_else(|| {
        PlatformError::system(
            "posting the paste combination",
            "CGEventCreateKeyboardEvent returned nothing",
        )
    })
}

fn screen_saver_delay() -> ScreenSaverDelay {
    let key = CFString::from_str(SCREEN_SAVER_IDLE_TIME);
    let domain = CFString::from_str(SCREEN_SAVER_DOMAIN);

    // SAFETY: both are constants of the framework, alive for the whole process.
    let user = unsafe { kCFPreferencesCurrentUser };
    let host = unsafe { kCFPreferencesCurrentHost };

    let Some(value) = CFPreferencesCopyValue(&key, &domain, user, host) else {
        return ScreenSaverDelay::Unknown;
    };

    let Ok(number) = value.downcast::<CFNumber>() else {
        return ScreenSaverDelay::Unknown;
    };

    match number.as_i64() {
        Some(0) => ScreenSaverDelay::Never,
        Some(seconds) => match u64::try_from(seconds) {
            Ok(seconds) => ScreenSaverDelay::After(Duration::from_secs(seconds)),
            Err(_) => ScreenSaverDelay::Unknown,
        },
        None => ScreenSaverDelay::Unknown,
    }
}

const KEY_POSITIONS: [(&str, u16); 37] = [
    ("KeyA", 0x00),
    ("KeyS", 0x01),
    ("KeyD", 0x02),
    ("KeyF", 0x03),
    ("KeyH", 0x04),
    ("KeyG", 0x05),
    ("KeyZ", 0x06),
    ("KeyX", 0x07),
    ("KeyC", 0x08),
    ("KeyV", 0x09),
    ("KeyB", 0x0b),
    ("KeyQ", 0x0c),
    ("KeyW", 0x0d),
    ("KeyE", 0x0e),
    ("KeyR", 0x0f),
    ("KeyY", 0x10),
    ("KeyT", 0x11),
    ("Equal", 0x18),
    ("Minus", 0x1b),
    ("BracketRight", 0x1e),
    ("KeyO", 0x1f),
    ("KeyU", 0x20),
    ("BracketLeft", 0x21),
    ("KeyI", 0x22),
    ("KeyP", 0x23),
    ("KeyL", 0x25),
    ("KeyJ", 0x26),
    ("Quote", 0x27),
    ("KeyK", 0x28),
    ("Semicolon", 0x29),
    ("Backslash", 0x2a),
    ("Comma", 0x2b),
    ("Slash", 0x2c),
    ("KeyN", 0x2d),
    ("KeyM", 0x2e),
    ("Period", 0x2f),
    ("Backquote", 0x32),
];

const KEY_ACTION_DISPLAY: u16 = 3;

const NO_DEAD_KEYS: u32 = 1;

const LONGEST_LABEL: usize = 4;

#[must_use]
pub fn key_labels() -> KeyLabels {
    let Some(layout) = KeyboardLayout::current() else {
        return KeyLabels::new();
    };

    KEY_POSITIONS
        .iter()
        .filter_map(|(code, position)| {
            let printed = layout.printed(*position)?;

            Some(((*code).to_owned(), printed))
        })
        .collect()
}

struct KeyboardLayout {
    source: *mut c_void,
    data: *const u8,
    keyboard: u32,
}

impl KeyboardLayout {
    fn current() -> Option<Self> {
        // SAFETY: the source is retained by the copy, and released by `Drop`.
        let source = unsafe { TISCopyCurrentKeyboardLayoutInputSource() };

        if source.is_null() {
            return None;
        }

        // SAFETY: the source is alive, and the key is the framework's own constant.
        let data = unsafe { TISGetInputSourceProperty(source, kTISPropertyUnicodeKeyLayoutData) };

        if data.is_null() {
            // SAFETY: the copy above handed over one reference, and nothing else holds it.
            unsafe { CFRelease(source) };

            return None;
        }

        // SAFETY: the property gives a CFData that lives as long as the source.
        let bytes = unsafe { CFDataGetBytePtr(data) };

        if bytes.is_null() {
            // SAFETY: the copy above handed over one reference, and nothing else holds it.
            unsafe { CFRelease(source) };

            return None;
        }

        Some(Self {
            source,
            data: bytes,
            keyboard: keyboard_type(),
        })
    }

    fn printed(&self, position: u16) -> Option<String> {
        let mut dead = 0_u32;
        let mut written = 0_usize;
        let mut letters = [0_u16; LONGEST_LABEL];

        // SAFETY: the layout outlives the call, and the buffer is as long as it says.
        let failed = unsafe {
            UCKeyTranslate(
                self.data,
                position,
                KEY_ACTION_DISPLAY,
                0,
                self.keyboard,
                NO_DEAD_KEYS,
                &raw mut dead,
                LONGEST_LABEL,
                &raw mut written,
                letters.as_mut_ptr(),
            )
        } != 0;

        if failed || written == 0 {
            return None;
        }

        let printed = String::from_utf16_lossy(&letters[..written]);

        printed
            .chars()
            .all(|letter| !letter.is_control() && !letter.is_whitespace())
            .then(|| printed.to_uppercase())
    }
}

impl Drop for KeyboardLayout {
    fn drop(&mut self) {
        // SAFETY: the copy handed over one reference, and this is its only release.
        unsafe { CFRelease(self.source) };
    }
}

fn keyboard_type() -> u32 {
    let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState);

    CGEventSource::keyboard_type(source.as_deref())
}

#[link(name = "Carbon", kind = "framework")]
extern "C" {
    static kTISPropertyUnicodeKeyLayoutData: *const c_void;

    fn TISCopyCurrentKeyboardLayoutInputSource() -> *mut c_void;

    fn TISGetInputSourceProperty(source: *mut c_void, key: *const c_void) -> *mut c_void;

    fn UCKeyTranslate(
        layout: *const u8,
        position: u16,
        action: u16,
        modifiers: u32,
        keyboard: u32,
        options: u32,
        dead: *mut u32,
        longest: usize,
        written: *mut usize,
        letters: *mut u16,
    ) -> i32;
}

#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    fn CFDataGetBytePtr(data: *mut c_void) -> *const u8;

    fn CFRelease(value: *mut c_void);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn area() -> CGRect {
        CGRect::new(CGPoint::new(0.0, 25.0), CGSize::new(1440.0, 875.0))
    }

    #[test]
    fn a_window_that_covers_the_work_area_is_filled() {
        assert!(matches_maximized(area(), area()));
    }

    #[test]
    fn a_window_a_hair_off_the_work_area_is_still_filled() {
        let worn = CGRect::new(CGPoint::new(1.0, 26.0), CGSize::new(1439.0, 874.0));

        assert!(
            matches_maximized(worn, area()),
            "the system rounds, and two points of slack are not a small window"
        );
    }

    #[test]
    fn a_window_that_leaves_room_on_any_side_is_not_filled() {
        let short = CGRect::new(area().origin, CGSize::new(1440.0, 700.0));
        let narrow = CGRect::new(area().origin, CGSize::new(1000.0, 875.0));
        let moved = CGRect::new(CGPoint::new(40.0, 25.0), area().size);

        assert!(!matches_maximized(short, area()));
        assert!(!matches_maximized(narrow, area()));
        assert!(!matches_maximized(moved, area()));
    }

    #[test]
    fn a_window_on_the_screen_it_sits_on_is_measured_against_that_screen() {
        let left = CGRect::new(CGPoint::new(0.0, 0.0), CGSize::new(1440.0, 900.0));
        let right = CGRect::new(CGPoint::new(1440.0, 0.0), CGSize::new(1920.0, 1080.0));
        let areas = WorkAreas {
            screens: vec![(left, left), (right, right)],
            main: Some(left),
        };

        assert_eq!(
            work_area_of(&areas, CGPoint::new(1500.0, 10.0)),
            Some(right)
        );
        assert_eq!(work_area_of(&areas, CGPoint::new(10.0, 10.0)), Some(left));
        assert_eq!(
            work_area_of(&areas, CGPoint::new(-4000.0, 10.0)),
            Some(left),
            "a window nobody's screen holds falls back to the main one"
        );
    }

    #[test]
    fn a_watcher_that_never_listened_stops_without_complaining() {
        let mut watcher = BannerNotificationWatcher::new();

        assert_eq!(watcher.stop(), Ok(()));
        assert_eq!(watcher.stop(), Ok(()));
    }

    #[test]
    fn dismissing_a_notification_is_a_silent_success() {
        let watcher = BannerNotificationWatcher::new();

        assert_eq!(watcher.dismiss("Alpha"), Ok(()));
    }

    #[test]
    fn the_two_implementations_answer_the_same_authorization() {
        let manager = AccessibilityWindowManager::new(false);
        let watcher = BannerNotificationWatcher::new();

        assert_eq!(manager.authorization(), watcher.authorization());
    }

    #[test]
    fn the_display_is_held_and_let_go_again() {
        let mut keeper = PowerAssertionDisplayKeeper::new();

        assert!(!keeper.is_awake());

        assert_eq!(keeper.keep_awake(), Ok(()));
        assert!(keeper.is_awake());

        assert_eq!(keeper.release(), Ok(()));
        assert!(!keeper.is_awake());
    }

    #[test]
    fn holding_twice_and_letting_go_twice_are_both_harmless() {
        let mut keeper = PowerAssertionDisplayKeeper::new();

        assert_eq!(keeper.keep_awake(), Ok(()));
        assert_eq!(keeper.keep_awake(), Ok(()));
        assert!(keeper.is_awake());

        assert_eq!(keeper.release(), Ok(()));
        assert_eq!(keeper.release(), Ok(()));
        assert!(!keeper.is_awake());
    }

    #[test]
    fn the_screen_saver_setting_is_read_rather_than_assumed() {
        let keeper = PowerAssertionDisplayKeeper::new();

        assert!(keeper.screen_saver_delay().is_ok());
    }

    #[test]
    fn enumerating_without_the_authorization_is_not_an_empty_roster() {
        let manager = AccessibilityWindowManager::new(false);

        if manager.authorization() == Ok(Authorization::Denied) {
            assert_eq!(
                manager.game_windows(),
                Err(PlatformError::AuthorizationDenied)
            );
            assert_eq!(
                manager.foreground_game_window(),
                Err(PlatformError::AuthorizationDenied)
            );
        }
    }
}
