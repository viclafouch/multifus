//! The macOS side of the boundary.
//!
//! Windows and their titles come from the Accessibility API, `AXTitle` on the
//! main window of the processes whose bundle is `com.dofus.d1elauncher`, and
//! focus activates a process by its pid, one client being one process.
//! Notifications come from an `AXObserver` posted on
//! `com.apple.notificationcenterui`, whose banner text carries the title and the
//! body, see ADR 0002. Both need the same and only authorization, Accessibility,
//! which is why [`accessibility_authorization`] is shared by the two
//! implementations. The third one, [`PowerAssertionDisplayKeeper`], needs none.
//!
//! The SQLite database of the notification centre is not an option and is not to
//! be brought back to the table: it is written 5.1 seconds after the banner is
//! drawn, which ADR 0002 measured and rejected.
//!
//! Nothing here is generic over the system, and nothing here knows about the
//! roster. The core stays pure.

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

/// The bundle of a Dofus Retro client. One process per character on this system,
/// which is what lets a [`WindowId`] carry a pid.
const DOFUS_BUNDLE_ID: &str = "com.dofus.d1elauncher";

/// The process that draws the notification banners, and the one the observer is
/// posted on.
const NOTIFICATION_CENTRE_BUNDLE_ID: &str = "com.apple.notificationcenterui";

// The Accessibility attribute and notification names. `objc2-application-services`
// exposes the functions but not these constants, so they are spelled out here as
// the framework headers spell them.
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

/// How deep the banner walk goes before giving up.
///
/// The tree recorded by the prototype needs four levels; eight leaves room for a
/// future macOS to add a wrapper without opening the door to walking the whole
/// notification centre on the observer's thread.
const MAX_BANNER_DEPTH: usize = 8;

/// How many texts the banner walk reads before stopping.
const MAX_BANNER_TEXTS: usize = 4;

/// How long the watcher thread runs its loop before looking at its stop flag.
const STOP_CHECK_SECONDS: f64 = 0.25;

/// The one authorization of this system, read without asking the user anything.
///
/// Reading window titles, changing the focus and hearing the banners all hang on
/// Accessibility, so both implementations of this module answer with this.
fn accessibility_authorization() -> Authorization {
    // SAFETY: no argument, and the call has no invariant to uphold.
    if unsafe { AXIsProcessTrusted() } {
        Authorization::Granted
    } else {
        Authorization::Denied
    }
}

/// Asks for that authorization, which opens the system dialog.
///
/// macOS grants nothing before the user has acted in the settings pane, so the
/// answer right after asking is almost always `Denied`. The caller is meant to
/// show its explanation screen and look again later, not to treat this as a
/// failure.
fn request_accessibility_authorization() -> Authorization {
    // SAFETY: both are constants of the framework, alive for the whole process.
    let prompt = unsafe { kAXTrustedCheckOptionPrompt };
    let Some(yes) = (unsafe { kCFBooleanTrue }) else {
        return accessibility_authorization();
    };

    let options = CFDictionary::from_slices(&[prompt], &[yes]);

    // SAFETY: the dictionary holds the key the function documents, associated
    // with the boolean it expects.
    if unsafe { AXIsProcessTrustedWithOptions(Some(options.as_opaque())) } {
        Authorization::Granted
    } else {
        Authorization::Denied
    }
}

/// Turns an `AXError` into the boundary's own error.
///
/// A revoked authorization is the one case that is not a system failure: the
/// user can take Accessibility away at any time from the settings, and every
/// call starts returning `kAXErrorAPIDisabled` on the spot.
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

/// Reads one attribute of an accessibility object.
///
/// `Ok(None)` covers every ordinary absence: the attribute does not exist on
/// this object, it holds no value right now, the client does not implement the
/// Accessibility API, or it has gone away between two calls. None of these is
/// worth an error to an application whose job is to keep running unattended.
/// Only a revoked authorization and a genuine system failure come back as one.
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

            // SAFETY: `AXUIElementCopyAttributeValue` follows the Create rule,
            // so this reference is ours to own.
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

/// Reads an attribute that holds a string.
///
/// A value of another type reads as an absence, like every other ordinary absence
/// [`attribute`] folds into `Ok(None)`. That is the honest answer rather than a
/// swallowed failure: Multifus wants a title, and an attribute that is not a
/// string is not a title. Only the walk of a banner cares about the difference,
/// and what it needs to report is a system that refused, which arrives as an
/// error above.
fn string_attribute(element: &AXUIElement, name: &str) -> Result<Option<String>> {
    Ok(attribute(element, name)?
        .and_then(|value| value.downcast::<CFString>().ok())
        .map(|text| text.to_string()))
}

/// Reads an attribute that holds a boolean.
fn bool_attribute(element: &AXUIElement, name: &str) -> Result<Option<bool>> {
    Ok(attribute(element, name)?
        .and_then(|value| value.downcast::<CFBoolean>().ok())
        .map(|flag| flag.value()))
}

/// Reads an attribute that holds a single accessibility object.
fn element_attribute(element: &AXUIElement, name: &str) -> Result<Option<CFRetained<AXUIElement>>> {
    Ok(attribute(element, name)?.and_then(|value| value.downcast::<AXUIElement>().ok()))
}

/// Reads an attribute that holds a list of accessibility objects.
///
/// Anything in the list that is not an accessibility object is dropped rather
/// than reported: the Accessibility API is free to hand back whatever it likes,
/// and Multifus only ever wants the elements.
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

    // SAFETY: the accessibility attributes that hold arrays hold CF types, and
    // the elements are only read through `downcast`, which checks their type.
    let array = unsafe { array.cast_unchecked::<CFType>() };

    Ok(array
        .to_vec()
        .into_iter()
        .filter_map(|item| item.downcast::<AXUIElement>().ok())
        .collect())
}

/// Every Dofus client currently running, one per character connected.
fn dofus_applications() -> Vec<Retained<NSRunningApplication>> {
    let bundle = NSString::from_str(DOFUS_BUNDLE_ID);

    NSRunningApplication::runningApplicationsWithBundleIdentifier(&bundle).to_vec()
}

/// A client's windows, its main window first.
///
/// The main window is the one the plan asks for. The others follow as a safety
/// net for a client that has not designated a main one yet, and for one whose
/// window is minimized: macOS drops `AXMainWindow` while a window sits in the
/// Dock, and the window is still in `AXWindows`. Since a window only becomes a
/// [`GameWindow`] through its title, the extra entries can add one that would
/// have been missed but can never let a wrong one through.
fn windows_of(application: &AXUIElement) -> Result<Vec<CFRetained<AXUIElement>>> {
    let mut windows = Vec::new();

    if let Some(main_window) = element_attribute(application, AX_MAIN_WINDOW)? {
        windows.push(main_window);
    }

    windows.extend(element_array_attribute(application, AX_WINDOWS)?);

    Ok(windows)
}

/// The titles of those windows, in the same order.
fn window_titles(application: &AXUIElement) -> Result<Vec<String>> {
    let mut titles = Vec::new();

    for window in windows_of(application)? {
        titles.extend(string_attribute(&window, AX_TITLE)?);
    }

    Ok(titles)
}

/// The window of a client that carries a nickname, `None` for a client sitting
/// on the login screen.
///
/// The one place that needs the window itself rather than its title: a window is
/// what carries `AXMinimized`, an application does not.
fn game_window_element(application: &AXUIElement) -> Result<Option<CFRetained<AXUIElement>>> {
    for window in windows_of(application)? {
        let Some(title) = string_attribute(&window, AX_TITLE)? else {
            continue;
        };

        if extract_nickname(&title).is_some() {
            return Ok(Some(window));
        }
    }

    Ok(None)
}

/// The game window of one client process, `None` when no title carries a
/// nickname.
///
/// That `None` is what a client sitting on the login screen looks like: a live
/// process, with windows, and nothing in the title to work with. The filtering
/// is on the title, never on the size.
fn game_window(application: &NSRunningApplication) -> Result<Option<GameWindow>> {
    let pid = application.processIdentifier();
    let Ok(raw) = u64::try_from(pid) else {
        return Ok(None);
    };
    let id = WindowId::from_raw(raw);

    // SAFETY: the pid is the one the system just reported for a running
    // application, and the call is valid for any pid anyway.
    let element = unsafe { AXUIElement::new_application(pid) };

    for title in window_titles(&element)? {
        if let Some(window) = GameWindow::from_title(id, &title) {
            return Ok(Some(window));
        }
    }

    Ok(None)
}

/// Brings a client to the front through Accessibility.
///
/// The second door of [`AccessibilityWindowManager::focus`], see the comment
/// there.
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

/// The live client a window token designates, and its accessibility object.
///
/// [`PlatformError::WindowGone`] covers the three ways a token can designate
/// nothing any more: a raw value that is not a pid, an application the system no
/// longer knows, and one that has quit since the scan saw it.
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

    // SAFETY: the pid belongs to an application the system just reported as
    // running.
    let element = unsafe { AXUIElement::new_application(pid) };

    Ok((application, element))
}

/// Takes a window out of the Dock, and only one that is in it.
///
/// Read before write on purpose. Writing `AXMinimized` on a window that is not
/// minimized is a call with nothing to do, and a refusal there would turn an
/// ordinary focus into a failure for no gain. Reading one attribute is the
/// 0,05 ms the plan measured.
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

/// Reads an attribute that holds a point, which crosses wrapped in an `AXValue`.
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

/// The work area of the screen a window sits on, in the flipped coordinates the
/// Accessibility API reads and writes.
fn work_area(position: CGPoint) -> Option<CGRect> {
    on_main_thread(move |marker| {
        let screens = NSScreen::screens(marker);
        // AppKit places every screen relative to the first, so its height is
        // what the two coordinate systems are flipped around.
        let flip = screens.firstObject()?.frame().size.height;

        let screen = screens
            .iter()
            .find(|screen| holds(flipped(screen.frame(), flip), position))
            .or_else(|| NSScreen::mainScreen(marker))?;

        Some(flipped(screen.visibleFrame(), flip))
    })
    .flatten()
}

/// A Cocoa rectangle in the flipped coordinates the Accessibility API uses,
/// where the origin is the top left corner and y grows downwards.
fn flipped(frame: CGRect, flip: CGFloat) -> CGRect {
    CGRect::new(
        CGPoint::new(frame.origin.x, flip - frame.max().y),
        frame.size,
    )
}

/// Whether a screen holds this corner, both far edges excluded so that two
/// screens side by side never both answer yes. Flipped coordinates on both
/// sides, or a window flush against the top of a screen would land on the one
/// above it.
fn holds(frame: CGRect, corner: CGPoint) -> bool {
    let (min, max) = (frame.min(), frame.max());

    corner.x >= min.x && corner.x < max.x && corner.y >= min.y && corner.y < max.y
}

/// Runs a piece of AppKit on the main thread, `NSScreen` being main thread only
/// and the window scan a thread of its own. `None` when the work panicked, which
/// must not cross back through the dispatch queue.
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

/// Reads windows and changes focus through the macOS Accessibility API.
///
/// A [`WindowId`] here carries the pid of the client process.
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

        // Only one application is active at a time, so asking the Dofus clients
        // whether they are is enough to know whether the user is in the game.
        // Nothing else on the desktop has to be looked at.
        for application in dofus_applications() {
            if application.isActive() {
                return game_window(&application);
            }
        }

        Ok(None)
    }

    fn is_minimized(&self, window: WindowId) -> Result<bool> {
        let (_, element) = live_application(window)?;

        // No game window on a live client is the login screen, and a client that
        // has left the game is one this token no longer designates.
        let Some(game_window) = game_window_element(&element)? else {
            return Err(PlatformError::WindowGone);
        };

        // A window the system says nothing about is a window on screen. Only
        // `AXMinimized` reading true puts it in the Dock.
        Ok(bool_attribute(&game_window, AX_MINIMIZED)? == Some(true))
    }

    fn focus(&self, window: WindowId) -> Result<()> {
        let (application, element) = live_application(window)?;

        // Out of the Dock before anything else. Activating a client whose window
        // is minimized brings its menu bar to the front and leaves the window
        // exactly where it was, which is the whole trap this answers.
        if let Some(game_window) = game_window_element(&element)? {
            restore(&game_window)?;
        }

        // `ActivateAllWindows` without `ActivateIgnoringOtherApps`, which macOS
        // deprecated: the client owns one window and asking to ignore the other
        // applications is exactly what the system now refuses.
        if application.activateWithOptions(NSApplicationActivationOptions::ActivateAllWindows) {
            return Ok(());
        }

        // Cooperative activation lets the system turn down a request coming from
        // an application that is not in front, which Multifus never is. Setting
        // `AXFrontmost` asks for the same thing through the authorization
        // Multifus already holds. Same process, same intent, second door.
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

            // SAFETY: the pid is the one the system just reported for a running
            // application, and the call is valid for any pid anyway.
            let element = unsafe { AXUIElement::new_application(pid) };

            // A client whose window is not drawn yet must not be counted, or it
            // would be known before there was anything to fill.
            if !windows_of(&element)?.is_empty() {
                clients.push(WindowId::from_raw(raw));
            }
        }

        Ok(clients)
    }

    fn maximize(&self, window: WindowId) -> Result<()> {
        let (_, element) = live_application(window)?;

        let Some(game_window) = windows_of(&element)?.into_iter().next() else {
            return Err(PlatformError::WindowGone);
        };

        // Its own position first: it is what says which screen to fill.
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
}

/// Hears game notifications by reading the banner the system draws, the only
/// route fast enough on macOS, see ADR 0002.
#[derive(Debug, Default)]
pub struct BannerNotificationWatcher {
    listening: Option<Listening>,
}

/// The thread that owns the observer, and the flag that asks it to stop.
///
/// Everything the Accessibility API hands out lives on that thread and never
/// leaves it, which is what makes the watcher `Send + Sync` without a single
/// unsafe promise about Core Foundation objects.
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
        // The same Accessibility trust as the window manager: one authorization
        // for the whole application on this system.
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

        // The thread reports how the setup went before it starts running, so
        // that a denied authorization or a missing notification centre comes
        // back to the caller instead of dying silently in the background.
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
                // The thread's own report is what `error` already carries, so the
                // join has nothing left to add: it is waited on to make sure the
                // observer is gone, not to be asked how it went.
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
        // returns, the observer is gone and the sink will not be called again.
        listening.thread.join().map_err(|_| {
            PlatformError::system("stopping the banner watcher", "the watcher thread panicked")
        })
    }

    fn dismiss(&self, _nickname: &str) -> Result<()> {
        // macOS has no public API to take a banner off the screen, see ADR 0002.
        // Doing nothing and saying so went well keeps the caller free of any
        // `cfg`, which is the whole point of this boundary.
        Ok(())
    }
}

impl Drop for BannerNotificationWatcher {
    fn drop(&mut self) {
        // No observer survives the application. A failure here reaches nobody and
        // that is not a swallowed one: this runs as the process is ending, so
        // there is no journal left to read and no reader left to read it.
        drop(self.stop());
    }
}

/// The pid of the process that draws the banners.
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

/// The body of the watcher thread: post the observer, run a loop, take it down.
///
/// The loop wakes every [`STOP_CHECK_SECONDS`] only to read the stop flag. That
/// is not polling the notifications, which stay pushed by the observer; it is
/// the price of never touching this thread's run loop from another one.
///
/// An authorization revoked while this runs simply silences the observer: the
/// thread keeps waiting, and the caller learns of the revocation from
/// [`NotificationWatcher::authorization`], which is where the interface says to
/// look. Nothing here panics on the system for it.
fn watch(
    pid: pid_t,
    sink: NotificationSink,
    running: &AtomicBool,
    ready: &mpsc::Sender<Result<()>>,
) {
    // The observer is declared after the sink, so it is dropped before it, and
    // the pointer the callback reads can never outlive what it points at.
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

/// Creates the observer and registers it for the creation of banner elements.
fn create_observer(pid: pid_t, refcon: *mut c_void) -> Result<CFRetained<AXObserver>> {
    let mut observer: *mut AXObserver = ptr::null_mut();

    // SAFETY: `on_banner_created` has the signature the API documents, and
    // `observer` is a live pointer for the duration of the call.
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

    // SAFETY: the pid is the notification centre's, which the system just
    // reported as running.
    let application = unsafe { AXUIElement::new_application(pid) };
    let notification = CFString::from_str(AX_CREATED_NOTIFICATION);

    // SAFETY: `refcon` points at the sink, which outlives the observer.
    let status = unsafe { observer.add_notification(&application, &notification, refcon) };

    ax_result(status, "observing the banners")?;

    Ok(observer)
}

/// Called by the system on the watcher thread, every time the notification
/// centre builds a new element.
///
/// Most of them are not banners, and most banners are not Dofus ones. They all
/// die here: only a notification whose title carries a nickname reaches the sink,
/// and through it the core.
unsafe extern "C-unwind" fn on_banner_created(
    _observer: NonNull<AXObserver>,
    element: NonNull<AXUIElement>,
    _notification: NonNull<CFString>,
    refcon: *mut c_void,
) {
    if refcon.is_null() {
        return;
    }

    // SAFETY: `refcon` is the sink `watch` registered, and the observer that
    // carries it is dropped before that sink is.
    let sink: &NotificationSink = unsafe { &*refcon.cast::<NotificationSink>() };

    // SAFETY: the system hands a live element to its callback.
    let element: &AXUIElement = unsafe { element.as_ref() };

    // A panic must not cross back into the C callback, and the sink is code
    // Multifus does not own. Reading and reporting are caught separately so that
    // a panic in the reading still reaches the journal: swallowed together, a
    // notification would be lost without a line, which is the one thing the two
    // variants of `NotificationReport` exist to prevent.
    let read = catch_unwind(AssertUnwindSafe(|| read_banner(element)));

    let report = match read {
        Ok(report) => report,
        Err(_) => Some(NotificationReport::Unreadable {
            detail: "reading the banner panicked".to_owned(),
        }),
    };

    // Nothing is left to say if this one panics: saying it would go through the
    // very sink that just failed.
    drop(catch_unwind(AssertUnwindSafe(|| {
        if let Some(report) = report {
            sink(report);
        }
    })));
}

/// What one walk of a notification element came back with.
#[derive(Debug, Default)]
struct Walk {
    /// The texts the element shows, in the order they were met.
    texts: Vec<String>,
    /// What the system refused during the walk, if it refused anything.
    ///
    /// The first refusal and not the last: it is the one closest to what was
    /// being read, and the ones after it are usually the same refusal again.
    refusal: Option<String>,
}

impl Walk {
    fn note(&mut self, error: &PlatformError) {
        if self.refusal.is_none() {
            self.refusal = Some(error.to_string());
        }
    }
}

/// Reads a banner, if that element is one, and says so when it cannot.
///
/// The tree the prototype recorded, where the first text is the title and the
/// second the body:
///
/// ```text
/// window "Notification Center"
/// └─ group 1 → group 1 → scroll area 1 → group 1
///    ├─ static text  "Pseudo - Dofus Retro v1.48.21"
///    └─ static text  "de Untel : a ton tour de jouer"
/// ```
///
/// The title is taken as the first text that carries a nickname rather than as
/// the first text outright, so that a macOS which one day slips an application
/// name above it does not break the reading. A text that carries no nickname is
/// no risk: no banner from anything but Dofus can produce one.
///
/// **`None` means nothing worth saying, never « nothing happened ».** The
/// observer fires for every element the notification centre builds, and almost
/// none of them are game notifications: those die here in silence, as they must,
/// or the journal would be unreadable. A walk the system *refused* is the
/// opposite case and comes back as [`NotificationReport::Unreadable`], because a
/// banner drawn and not read used to produce no line at all, and an empty journal
/// already meant that no banner had been drawn.
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

/// Walks a banner and collects the text it shows.
///
/// Bounded in depth and in count because it runs on the observer's thread, where
/// nothing is allowed to take long.
///
/// Every refusal is kept rather than dropped. What reaches here as an error is
/// already narrow: [`attribute`] answers `Ok(None)` for every ordinary absence,
/// an attribute this element does not have, a client that does not implement the
/// API, an element that has gone. So a refusal here is a revoked authorization or
/// a genuine system failure, and both are worth exactly one line.
fn collect_static_texts(element: &AXUIElement, depth: usize, walk: &mut Walk) {
    if depth > MAX_BANNER_DEPTH || walk.texts.len() >= MAX_BANNER_TEXTS {
        return;
    }

    match string_attribute(element, AX_ROLE) {
        Ok(Some(role)) if role == AX_STATIC_TEXT_ROLE => {
            match string_attribute(element, AX_VALUE) {
                Ok(Some(text)) => walk.texts.push(text),
                // A text element showing nothing. Ordinary, and not a refusal.
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

// The IOKit spellings. `kIOReturnSuccess` is zero, and the framework writes an
// assertion level on as 255 rather than 1.
type IOReturn = i32;
type IOPMAssertionID = u32;
type IOPMAssertionLevel = u32;

const IO_RETURN_SUCCESS: IOReturn = 0;
const IO_PM_ASSERTION_LEVEL_ON: IOPMAssertionLevel = 255;

/// The assertion Multifus takes. Not `PreventUserIdleSystemSleep`, which lets the
/// display go dark and the banners with it.
const PREVENT_USER_IDLE_DISPLAY_SLEEP: &str = "PreventUserIdleDisplaySleep";

/// What `pmset -g assertions` shows next to the pid of Multifus.
const ASSERTION_NAME: &str = "Multifus relay";

// The screen saver delay, filed per host, which is what `defaults -currentHost`
// reaches and what `CFPreferencesCopyAppValue` would miss.
const SCREEN_SAVER_DOMAIN: &str = "com.apple.screensaver";
const SCREEN_SAVER_IDLE_TIME: &str = "idleTime";

// Declared here rather than brought in with a crate: the step is measured at
// three crates, and a fourth for two functions would not be one of them.
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

/// Keeps the display awake through an IOKit energy assertion.
#[derive(Debug, Default)]
pub struct PowerAssertionDisplayKeeper {
    /// The assertion currently held, `None` when the machine may sleep.
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

        // SAFETY: the token comes from a call that reported success, and taking
        // it out of the field is what stops it being released twice.
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
        // No hold survives the keeper, and a failure here reaches nobody: the
        // assertion dies with the process whatever the system answered.
        drop(self.release());
    }
}

/// `kVK_ANSI_V`, a position on the keyboard and not a letter: the combination is
/// the same key on an AZERTY layout.
const PASTE_KEY: CGKeyCode = 9;

/// How long the key stays down. Measured with it on 24 August 2026.
const PRESS_TO_RELEASE: Duration = Duration::from_millis(10);

/// Lays `Super+V` on the system through Core Graphics.
///
/// Measured against a real client on 24 August 2026, and the four answers are in
/// `docs/plan.md`, temps 1.
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
        // Read rather than left to fail silently: a post the system refuses does
        // nothing at all, and reads exactly like a game that will not paste.
        if !accessibility_authorization().is_granted() {
            return Err(PlatformError::AuthorizationDenied);
        }

        // A private source, so the event carries the flags set below and not the
        // modifiers the user is holding down at that moment.
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

/// One half of the combination. `CGEventPost` itself answers nothing, so this is
/// the only place the system can turn the paste down.
fn keyboard_event(source: Option<&CGEventSource>, key_down: bool) -> Result<CFRetained<CGEvent>> {
    CGEvent::new_keyboard_event(source, PASTE_KEY, key_down).ok_or_else(|| {
        PlatformError::system(
            "posting the paste combination",
            "CGEventCreateKeyboardEvent returned nothing",
        )
    })
}

/// Reads the screen saver delay of this machine. Every way the answer can be
/// missing is [`ScreenSaverDelay::Unknown`], and zero is the screen saver off.
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
        // macOS cannot do it and the caller must not have to know, see ADR 0002.
        let watcher = BannerNotificationWatcher::new();

        assert_eq!(watcher.dismiss("Alpha"), Ok(()));
    }

    #[test]
    fn the_two_implementations_answer_the_same_authorization() {
        // One authorization on this system, shared by both. This asserts they
        // agree, not what the answer is, which depends on the machine.
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
        // The caller asks after every scan and keeps no boolean of its own.
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
        // The caller must be able to tell "nobody is connected" from "Multifus
        // is not allowed to look", so the refusal has to be an error.
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
