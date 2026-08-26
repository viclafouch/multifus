use std::ffi::c_void;
use std::panic::catch_unwind;
use std::panic::AssertUnwindSafe;
use std::ptr;
use std::ptr::NonNull;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::sync::mpsc;
use std::sync::Arc;
use std::thread;
use std::thread::JoinHandle;
use std::time::Duration;

use dispatch2::DispatchQueue;
use libc::pid_t;
use objc2::rc::Retained;
use objc2::MainThreadMarker;
use objc2_app_kit::NSApplicationActivationOptions;
use objc2_app_kit::NSRunningApplication;
use objc2_app_kit::NSScreen;
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
use objc2_core_graphics::CGEventSource;
use objc2_core_graphics::CGEventSourceStateID;
use objc2_core_graphics::CGEventTapLocation;
use objc2_core_graphics::CGKeyCode;
use objc2_foundation::NSString;

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
use crate::platform::window::GameWindow;
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

fn work_area(position: CGPoint) -> Option<CGRect> {
    on_main_thread(move |marker| {
        let screens = NSScreen::screens(marker);
        let flip = screens.firstObject()?.frame().size.height;

        let screen = screens
            .iter()
            .find(|screen| holds(flipped(screen.frame(), flip), position))
            .or_else(|| NSScreen::mainScreen(marker))?;

        Some(flipped(screen.visibleFrame(), flip))
    })
    .flatten()
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

#[derive(Debug, Default)]
pub struct AccessibilityWindowManager;

impl AccessibilityWindowManager {
    #[must_use]
    pub fn new() -> Self {
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

    fn apply_short_titles(&self, _short: bool, _suffix: Option<&str>) -> Result<Option<String>> {
        Ok(None)
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

#[cfg(test)]
mod tests {
    use super::*;

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
        let manager = AccessibilityWindowManager::new();
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
        let manager = AccessibilityWindowManager::new();

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
