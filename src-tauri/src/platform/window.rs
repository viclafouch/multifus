use crate::domain::extract_nickname;
use crate::platform::error::Result;
use crate::platform::Authorization;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct WindowId(u64);

impl WindowId {
    #[must_use]
    pub fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub fn raw(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GameWindow {
    id: WindowId,
    nickname: String,
}

impl GameWindow {
    #[must_use]
    pub fn from_title(id: WindowId, title: &str) -> Option<Self> {
        let nickname = extract_nickname(title)?;

        Some(Self {
            id,
            nickname: nickname.to_owned(),
        })
    }

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

    #[must_use]
    pub fn id(&self) -> WindowId {
        self.id
    }

    #[must_use]
    pub fn nickname(&self) -> &str {
        &self.nickname
    }
}

#[must_use]
pub fn matches_short_title(title: &str) -> Option<&str> {
    let nickname = title.trim();

    if nickname.is_empty() || nickname.contains(char::is_whitespace) {
        return None;
    }

    if nickname.eq_ignore_ascii_case(THE_GAME) {
        return None;
    }

    Some(nickname)
}

const THE_GAME: &str = "Dofus";

#[must_use]
pub fn title_suffix(title: &str) -> Option<&str> {
    let nickname = extract_nickname(title)?;

    title.trim().strip_prefix(nickname)
}

const ICON_DIRECTORY_HEADER: usize = 6;

const ICON_DIRECTORY_ENTRY: usize = 16;

const ICON_DIRECTORY_KIND: [u8; 4] = [0, 0, 1, 0];

const ICON_WIDEST_SIDE: u32 = 256;

#[must_use]
pub fn icon_image(icon: &[u8], side: u32) -> Option<&[u8]> {
    if icon.get(..ICON_DIRECTORY_KIND.len()) != Some(ICON_DIRECTORY_KIND.as_slice()) {
        return None;
    }

    let count = usize::from(u16::from_le_bytes([*icon.get(4)?, *icon.get(5)?]));

    (0..count)
        .filter_map(|index| {
            let start = ICON_DIRECTORY_HEADER + index * ICON_DIRECTORY_ENTRY;
            let entry = icon.get(start..start + ICON_DIRECTORY_ENTRY)?;
            let width = match entry[0] {
                0 => ICON_WIDEST_SIDE,
                width => u32::from(width),
            };
            let length = read_u32(entry, 8)? as usize;
            let offset = read_u32(entry, 12)? as usize;
            let image = icon.get(offset..offset.checked_add(length)?)?;

            Some((width, image))
        })
        .min_by_key(|(width, _)| width.abs_diff(side))
        .map(|(_, image)| image)
}

fn read_u32(entry: &[u8], at: usize) -> Option<u32> {
    let bytes = entry.get(at..at + size_of::<u32>())?;

    Some(u32::from_le_bytes(bytes.try_into().ok()?))
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct ShortTitleReport {
    pub on_screen: bool,
    pub suffix: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ScreenPoint {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ScreenFrame {
    pub origin: ScreenPoint,
    pub width: f64,
    pub height: f64,
}

pub trait WindowManager: Send + Sync {
    fn authorization(&self) -> Result<Authorization>;

    fn request_authorization(&self) -> Result<Authorization>;

    fn game_windows(&self) -> Result<Vec<GameWindow>>;

    fn foreground_game_window(&self) -> Result<Option<GameWindow>>;

    fn window_at(&self, at: ScreenPoint) -> Result<Option<WindowId>>;

    fn window_frame(&self, window: WindowId) -> Result<Option<ScreenFrame>>;

    fn is_minimized(&self, window: WindowId) -> Result<bool>;

    fn maximized_windows(&self, windows: &[WindowId]) -> Vec<WindowId>;

    fn focus(&self, window: WindowId) -> Result<()>;

    fn focus_fast(&self, window: WindowId) -> Result<()>;

    fn client_windows(&self) -> Result<Vec<WindowId>>;

    fn maximize(&self, window: WindowId) -> Result<()>;

    fn apply_short_titles(&self, short: bool, suffix: Option<&str>) -> Result<ShortTitleReport>;

    fn set_window_icon(&self, window: WindowId, icon: Option<&[u8]>) -> Result<()>;

    fn forget_closed_windows(&self);

    fn taskbar_combines(&self) -> Result<bool>;

    fn set_window_group(&self, window: WindowId, group: Option<&str>) -> Result<()>;
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
        assert_eq!(GameWindow::from_client_title(id, "Dofus Retro", true), None);
        assert_eq!(GameWindow::from_client_title(id, "  ", true), None);
    }

    #[test]
    fn nothing_is_read_as_a_short_title_until_somebody_asks_for_it() {
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

    fn icon_of(sides: &[u8]) -> Vec<u8> {
        let mut icon = vec![0, 0, 1, 0];
        icon.extend((sides.len() as u16).to_le_bytes());

        let mut images = Vec::new();

        for side in sides {
            let length = usize::from(*side);
            let offset = ICON_DIRECTORY_HEADER + sides.len() * ICON_DIRECTORY_ENTRY + images.len();

            icon.extend([*side, *side, 0, 0]);
            icon.extend(1_u16.to_le_bytes());
            icon.extend(32_u16.to_le_bytes());
            icon.extend((length as u32).to_le_bytes());
            icon.extend((offset as u32).to_le_bytes());

            images.extend(std::iter::repeat_n(*side, length));
        }

        icon.extend(images);

        icon
    }

    #[test]
    fn an_icon_gives_the_image_closest_to_the_size_the_system_asks_for() {
        let icon = icon_of(&[16, 32, 48]);

        assert_eq!(icon_image(&icon, 16).map(|image| image[0]), Some(16));
        assert_eq!(icon_image(&icon, 32).map(|image| image[0]), Some(32));
        assert_eq!(icon_image(&icon, 64).map(|image| image[0]), Some(48));
        assert_eq!(icon_image(&icon, 16).map(<[u8]>::len), Some(16));
    }

    #[test]
    fn what_is_not_an_icon_gives_no_image() {
        assert_eq!(icon_image(&[], 16), None);
        assert_eq!(icon_image(&[0, 0, 2, 0, 1, 0], 16), None);
        assert_eq!(icon_image(&[0, 0, 1, 0, 1, 0], 16), None);
    }

    #[test]
    fn an_icon_pointing_outside_itself_gives_no_image() {
        let mut icon = icon_of(&[16]);
        let length = icon.len();

        icon.truncate(length - 1);

        assert_eq!(icon_image(&icon, 16), None);
    }

    #[test]
    fn a_client_on_the_login_screen_is_not_a_game_window() {
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
