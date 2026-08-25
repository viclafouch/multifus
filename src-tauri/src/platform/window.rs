//! Game windows as the core sees them, and the interface that produces them.

use crate::domain::extract_nickname;
use crate::platform::error::Result;
use crate::platform::Authorization;

/// The system's handle on a game window, opaque on purpose.
///
/// Design decision, window identity. The two systems do not name a window the
/// same way: macOS activates a *process* by its pid, one client being one
/// process, while Windows manipulates an *hwnd*. Exposing either one would leak
/// a system detail into the core and force the other platform to fake it. So the
/// boundary hands out a token instead. The core carries it from
/// [`WindowManager::game_windows`] back to [`WindowManager::focus`] without ever
/// reading it; only the implementation that minted it knows what the bits mean.
///
/// A `u64` holds both a macOS `pid_t`, which is an `i32`, and a 64-bit `HWND`,
/// which is a pointer-sized `isize`.
///
/// A value is only meaningful for the implementation that produced it, and only
/// as long as that window lives. It is never written to the configuration file,
/// which is why this type is deliberately not `Serialize`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct WindowId(u64);

impl WindowId {
    /// Wraps whatever the system uses to designate a window. Called by the
    /// platform implementations, by nobody else.
    #[must_use]
    pub fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    /// Unwraps the token, for the implementation that created it.
    #[must_use]
    pub fn raw(self) -> u64 {
        self.0
    }
}

/// A Dofus window currently on screen, and the character it belongs to.
///
/// The fields are private and [`GameWindow::from_title`] is the only way in, so
/// that a window can exist here only if a title yielded a nickname. That rule
/// is the type-level form of a known trap: a client sitting on the login screen
/// already is a process with windows, but with no usable title. Filtering
/// happens on the title, never on the size.
///
/// There is no z-order here, and no `AppUserModelID`. ADR 0003 removed every
/// reordering of the taskbar, so the boundary has nothing to say about how the
/// system displays these windows.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GameWindow {
    id: WindowId,
    nickname: String,
}

impl GameWindow {
    /// Reads a window title and keeps the window only when a Dofus client is
    /// behind it. `None` covers the login screen, the launcher, and anything
    /// else that is not a game window.
    #[must_use]
    pub fn from_title(id: WindowId, title: &str) -> Option<Self> {
        let nickname = extract_nickname(title)?;

        Some(Self {
            id,
            nickname: nickname.to_owned(),
        })
    }

    /// Reads the title a Dofus client window shows, which Multifus may have
    /// written itself.
    ///
    /// **Nothing is remembered here, and that is the point.** A table of what
    /// Multifus renamed would be empty on the next launch, and six windows left
    /// titled `Alpha` would then belong to nobody: empty roster, empty system
    /// tray, dead shortcuts, until each client happened to rewrite its own
    /// title. The rule is read off the title instead.
    ///
    /// That rule is that **a client writes `Dofus` into every title it produces**
    /// — the game window, the login screen, the loader — so a titled window of a
    /// Dofus process with no `Dofus` in it is one Multifus cut down. The caller
    /// has already established the process, see [`WindowManager::game_windows`].
    ///
    /// `short` gates the second rule, and it is **what the last sweep saw on the
    /// screen** rather than what the user asked for: a window Multifus cannot
    /// put back stays one this rule is the only reader of, so unticking never
    /// takes a character offline. Nobody who leaves the réglage alone ever has a
    /// window read this way, the flag having no other way to become true.
    #[must_use]
    pub fn from_client_title(id: WindowId, title: &str, short: bool) -> Option<Self> {
        Self::from_title(id, title).or_else(|| {
            let nickname = matches_short_title(title).filter(|_| short)?;

            Some(Self {
                id,
                nickname: nickname.to_owned(),
            })
        })
    }

    /// The token to hand back to [`WindowManager::focus`].
    #[must_use]
    pub fn id(&self) -> WindowId {
        self.id
    }

    /// The nickname of the character this window belongs to.
    #[must_use]
    pub fn nickname(&self) -> &str {
        &self.nickname
    }
}

/// The nickname in a title Multifus wrote, `None` for one the client wrote.
///
/// The one test of the whole feature, see [`GameWindow::from_client_title`] for
/// why it is a test and not a memory. It answers the two questions the boundary
/// asks: whether a window still needs cutting down, and whether it still bears
/// the title that is Multifus's to put back.
///
/// **A Dofus nickname is one word.** That is what separates it from every title
/// a client writes for itself, `Dofus Retro` on the login screen and
/// `Pseudo - Dofus Retro v1.48.21` in game, which all carry a space. Testing for
/// the word `Dofus` instead looked simpler and was wrong: a character called
/// `Dofusito` would have gone offline the moment the réglage was ticked, and its
/// window would have stayed renamed for good.
#[must_use]
pub fn matches_short_title(title: &str) -> Option<&str> {
    let nickname = title.trim();

    if nickname.is_empty() || nickname.contains(char::is_whitespace) {
        return None;
    }

    // A window a client titled with the bare name of the game, which is nobody.
    if nickname.eq_ignore_ascii_case(THE_GAME) {
        return None;
    }

    Some(nickname)
}

/// The name of the game, which no character answers to.
const THE_GAME: &str = "Dofus";

/// What a client writes after a nickname in a window title, ` - Dofus Retro
/// v1.48.21`, read off a real one.
///
/// **One string is the whole of what putting a short title back needs**, and it
/// is what a table of renamed windows could not be: it survives the launch that
/// learned it. A table was tried first, and unticking after a relaunch then put
/// nothing back — every window Multifus had renamed in an earlier run was one it
/// no longer knew a title for.
///
/// Never guessed. A suffix nobody has been seen writing means a window is left
/// short, which is a title left alone rather than one invented.
#[must_use]
pub fn title_suffix(title: &str) -> Option<&str> {
    let nickname = extract_nickname(title)?;

    title.trim().strip_prefix(nickname)
}

/// What one sweep of [`WindowManager::apply_short_titles`] found out.
///
/// Windows's own tally, and its two questions: does the boundary still have to
/// read short titles, and did a client teach it what it writes after a nickname.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct ShortTitleReport {
    /// A window still bears a short title, so the sweep has to keep reading them.
    pub on_screen: bool,
    /// What a client was seen writing after a nickname, when a title showed it.
    pub suffix: Option<String>,
}

/// Enumerates the game windows, focuses one, and tells whether the foreground
/// window is a Dofus one.
///
/// `Send + Sync` is required rather than incidental: the implementation lives in
/// the Tauri state and gets called from the global shortcut callbacks, which run
/// on threads Multifus does not choose. An implementation that needs the main
/// thread, as the macOS one will, hops there on its own.
pub trait WindowManager: Send + Sync {
    /// Whether the system already lets Multifus read window titles and change
    /// the focus, without prompting for anything.
    fn authorization(&self) -> Result<Authorization>;

    /// Asks the system for that authorization, which may show a system dialog.
    fn request_authorization(&self) -> Result<Authorization>;

    /// Every game window open right now, one per character connected.
    ///
    /// Clients on the login screen are left out, see [`GameWindow::from_title`].
    /// A window Multifus has cut down to a short title still belongs here, which
    /// only Windows can produce, see [`GameWindow::from_client_title`].
    ///
    /// Returns [`PlatformError::AuthorizationDenied`] rather than an empty list
    /// when the authorization is missing, so that the caller can tell "nobody is
    /// connected" from "Multifus is not allowed to look".
    ///
    /// [`PlatformError::AuthorizationDenied`]: crate::platform::PlatformError::AuthorizationDenied
    fn game_windows(&self) -> Result<Vec<GameWindow>>;

    /// The game window in the foreground, or `None` when the frontmost window
    /// belongs to anything else.
    ///
    /// This is what keeps the four shortcuts inert outside the game, the guard
    /// perimetre.md asks for. It returns the window rather than a bare boolean
    /// because the veille shortcut acts on the character in the foreground, and
    /// two calls would leave room for the foreground to change in between.
    fn foreground_game_window(&self) -> Result<Option<GameWindow>>;

    /// Whether the user has put this window away in the Dock or the taskbar.
    ///
    /// Asked by the one caller that may decide not to act, the AutoFocus with
    /// its réveil des réduites switched off. The other two ways to a window, a
    /// shortcut and a click in the system tray, never ask: the user requested
    /// those, so they go through whatever the window's state.
    ///
    /// A window that has just been closed answers
    /// [`PlatformError::WindowGone`], exactly as [`WindowManager::focus`] does,
    /// so a caller that asks both handles one failure and not two.
    ///
    /// [`PlatformError::WindowGone`]: crate::platform::PlatformError::WindowGone
    fn is_minimized(&self, window: WindowId) -> Result<bool>;

    /// Brings a window to the front, out of the Dock or the taskbar if that is
    /// where it was.
    ///
    /// Restoring is part of focusing and not an option of it: a window left in
    /// the Dock has not been brought to the front, whatever the system reports.
    /// What is optional is *asking for* the focus at all, and that is
    /// [`WindowManager::is_minimized`]'s question.
    ///
    /// Returns [`PlatformError::WindowGone`] when the client has been closed
    /// since the window was enumerated.
    ///
    /// [`PlatformError::WindowGone`]: crate::platform::PlatformError::WindowGone
    fn focus(&self, window: WindowId) -> Result<()>;

    /// Every window a Dofus client draws right now, login screen included.
    ///
    /// The one place a window exists without a nickname, and deliberately so:
    /// what is filled to the screen is a client that has just opened, and a
    /// client sitting on the login screen has opened. Nothing else may use this,
    /// the roster reads [`WindowManager::game_windows`].
    fn client_windows(&self) -> Result<Vec<WindowId>>;

    /// Fills the work area of its screen with a window, without ever asking for
    /// the focus.
    ///
    /// Never the macOS fullscreen, which moves the client into a Space of its
    /// own and would make the défilement change desktop at every shortcut.
    fn maximize(&self, window: WindowId) -> Result<()>;

    /// Cuts every game window's title down to the bare nickname, or puts back
    /// the title the client wrote.
    ///
    /// The whole sweep and not one window: what has to be written is decided by
    /// reading every title, and reading them one at a time from the core would
    /// cost a system call each. Idempotent, and called on every turn of the scan
    /// so that a client rewriting its own title — a character changed, the
    /// quarter-hour disconnection — is served again on the turn that follows.
    ///
    /// Only windows that already carry a nickname are touched. A login screen
    /// has no character to name, and its title is what a nickname will replace.
    ///
    /// **It is also what tells the implementation what the user asked for**, and
    /// [`WindowManager::game_windows`] reads short titles only once it has been
    /// told `true`. Call it before the sweep that reads the roster.
    ///
    /// `suffix` is what a client was last seen writing after a nickname, and it
    /// is what a title is put back from, see [`title_suffix`]. What comes back
    /// is what this turn saw one write, for the caller to keep across launches.
    /// Windows alone writes anything here, macOS having refused, see
    /// `docs/perimetre.md`.
    fn apply_short_titles(&self, short: bool, suffix: Option<&str>) -> Result<Option<String>>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_window_exists_only_when_its_title_carries_a_nickname() {
        let window = GameWindow::from_title(WindowId::from_raw(42), "Alpha - Dofus Retro v1.48.21");

        let window = window.expect("a Dofus title makes a game window");
        assert_eq!(window.nickname(), "Alpha");
        assert_eq!(window.id(), WindowId::from_raw(42));
    }

    #[test]
    fn a_window_multifus_renamed_still_carries_its_character() {
        // What the next launch reads on a window left short by the one before,
        // with nothing remembered of it.
        let window = GameWindow::from_client_title(WindowId::from_raw(42), "Alpha", true);

        let window = window.expect("a short title is still a game window");
        assert_eq!(window.nickname(), "Alpha");
        assert_eq!(window.id(), WindowId::from_raw(42));
    }

    #[test]
    fn a_title_the_client_wrote_is_read_the_way_it_always_was() {
        let id = WindowId::from_raw(42);

        assert_eq!(
            GameWindow::from_client_title(id, "Bravo - Dofus Retro v1.48.21", true)
                .map(|window| window.nickname().to_owned()),
            Some("Bravo".to_owned())
        );
        // The login screen and the quarter-hour disconnection both land here,
        // and neither is a character.
        assert_eq!(GameWindow::from_client_title(id, "Dofus Retro", true), None);
        assert_eq!(GameWindow::from_client_title(id, "  ", true), None);
    }

    #[test]
    fn nothing_is_read_as_a_short_title_until_somebody_asks_for_it() {
        // A dialog of the client would otherwise walk into the roster under its
        // own name, and that must not happen to anyone who left the réglage be.
        assert_eq!(
            GameWindow::from_client_title(WindowId::from_raw(42), "Alpha", false),
            None
        );
    }

    #[test]
    fn a_short_title_is_told_from_one_a_client_wrote() {
        assert_eq!(matches_short_title("Alpha"), Some("Alpha"));
        assert_eq!(matches_short_title("  Alpha  "), Some("Alpha"));
        assert_eq!(matches_short_title("Alpha - Dofus Retro v1.48.21"), None);
        assert_eq!(matches_short_title("Dofus Retro"), None);
        assert_eq!(matches_short_title("dofus"), None);
        assert_eq!(matches_short_title(""), None);
    }

    #[test]
    fn a_character_named_after_the_game_is_a_character_like_any_other() {
        // The word `Dofus` in a nickname is not the game naming itself, and
        // reading it that way took `Dofusito` offline the moment the réglage
        // was ticked, its window renamed for good.
        assert_eq!(matches_short_title("Dofusito"), Some("Dofusito"));
        assert_eq!(
            GameWindow::from_client_title(WindowId::from_raw(42), "Dofusito", true)
                .map(|window| window.nickname().to_owned()),
            Some("Dofusito".to_owned())
        );
    }

    #[test]
    fn what_a_client_writes_after_a_nickname_is_read_off_a_real_title() {
        assert_eq!(
            title_suffix("Alpha - Dofus Retro v1.48.21"),
            Some(" - Dofus Retro v1.48.21")
        );
        // Put back together, it is the title the client had written.
        assert_eq!(
            format!(
                "Alpha{}",
                title_suffix("Alpha - Dofus Retro").expect("a suffix")
            ),
            "Alpha - Dofus Retro"
        );
    }

    #[test]
    fn a_title_with_no_nickname_teaches_nothing() {
        assert_eq!(title_suffix("Dofus Retro"), None);
        assert_eq!(title_suffix(""), None);
    }

    #[test]
    fn a_client_on_the_login_screen_is_not_a_game_window() {
        // It is a real process with real windows, but nothing in the title to
        // filter on. Size is never a criterion, the title is.
        assert_eq!(GameWindow::from_title(WindowId::from_raw(1), ""), None);
        assert_eq!(
            GameWindow::from_title(WindowId::from_raw(1), "Dofus Retro"),
            None
        );
        assert_eq!(
            GameWindow::from_title(WindowId::from_raw(1), "Ankama Launcher"),
            None
        );
    }
}
