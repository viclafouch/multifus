use crate::domain::extract_nickname;
use crate::platform::Authorization;
use crate::platform::error::Result;

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
pub fn matches_game_in_front(windows: &dyn WindowManager) -> bool {
    windows
        .foreground_game_window()
        .is_ok_and(|found| found.is_some())
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WindowIcon<'a> {
    pub portrait: &'a [u8],
    pub ring: Option<[u8; 3]>,
}

const DIB_HEADER: usize = 40;

const DIB_BIT_COUNT: u16 = 32;

const DIB_UNCOMPRESSED: u32 = 0;

const RING_SHARE: f64 = 0.125;

const RING_SAMPLES: u32 = 4;

const OPAQUE: u8 = 255;

#[derive(Debug, Clone, PartialEq, Eq)]
struct Square {
    side: usize,
    pixels: Vec<[u8; 4]>,
}

impl Square {
    fn blank(side: usize) -> Self {
        Self {
            side,
            pixels: vec![[0; 4]; side * side],
        }
    }

    fn at(&self, x: usize, y: usize) -> [u8; 4] {
        self.pixels[y * self.side + x]
    }
}

#[must_use]
pub fn ringed_image(image: &[u8], color: [u8; 3]) -> Option<Vec<u8>> {
    let portrait = read_dib(image)?;
    let side = portrait.side;
    let middle = side as f64 / 2.0;
    let thickness = (side as f64 * RING_SHARE).round().max(1.0);
    let rim_disc = Disc {
        middle,
        radius: middle,
    };
    let heart_disc = Disc {
        middle,
        radius: (middle - thickness).max(1.0),
    };
    let shrunk = scaled(&portrait, (side as f64 - thickness * 2.0).round() as usize);
    let offset = (side - shrunk.side) / 2;
    let mut painted = Square::blank(side);
    let [red, green, blue] = color;

    for y in 0..side {
        for x in 0..side {
            let heart = coverage(x, y, &heart_disc);
            let rim = coverage(x, y, &rim_disc) - heart;
            let under = [blue, green, red, (rim * f64::from(OPAQUE)).round() as u8];
            let over = match (x.checked_sub(offset), y.checked_sub(offset)) {
                (Some(inside_x), Some(inside_y))
                    if inside_x < shrunk.side && inside_y < shrunk.side =>
                {
                    clipped(shrunk.at(inside_x, inside_y), heart)
                }
                _ => [0; 4],
            };

            painted.pixels[y * side + x] = over_under(over, under);
        }
    }

    Some(write_dib(&painted))
}

struct Disc {
    middle: f64,
    radius: f64,
}

fn coverage(x: usize, y: usize, disc: &Disc) -> f64 {
    let step = 1.0 / f64::from(RING_SAMPLES);
    let inside = (0..RING_SAMPLES)
        .flat_map(|row| (0..RING_SAMPLES).map(move |column| (row, column)))
        .filter(|(row, column)| {
            let at_x = x as f64 + (f64::from(*column) + 0.5) * step - disc.middle;
            let at_y = y as f64 + (f64::from(*row) + 0.5) * step - disc.middle;

            at_x.mul_add(at_x, at_y * at_y) <= disc.radius * disc.radius
        })
        .count();

    f64::from(inside as u32) / f64::from(RING_SAMPLES * RING_SAMPLES)
}

fn clipped(pixel: [u8; 4], coverage: f64) -> [u8; 4] {
    let [blue, green, red, alpha] = pixel;

    [
        blue,
        green,
        red,
        (f64::from(alpha) * coverage).round() as u8,
    ]
}

fn over_under(over: [u8; 4], under: [u8; 4]) -> [u8; 4] {
    let front = f64::from(over[3]) / f64::from(OPAQUE);
    let back = f64::from(under[3]) / f64::from(OPAQUE) * (1.0 - front);
    let alpha = front + back;

    if alpha <= 0.0 {
        return [0; 4];
    }

    let mixed = |channel: usize| {
        let blended = f64::from(over[channel]).mul_add(front, f64::from(under[channel]) * back);

        (blended / alpha).round() as u8
    };

    [
        mixed(0),
        mixed(1),
        mixed(2),
        (alpha * f64::from(OPAQUE)).round() as u8,
    ]
}

fn scaled(source: &Square, side: usize) -> Square {
    if side == source.side || side == 0 {
        return source.clone();
    }

    let mut shrunk = Square::blank(side);
    let ratio = source.side as f64 / side as f64;

    for y in 0..side {
        for x in 0..side {
            shrunk.pixels[y * side + x] = averaged(source, x, y, ratio);
        }
    }

    shrunk
}

fn averaged(source: &Square, x: usize, y: usize, ratio: f64) -> [u8; 4] {
    let from_x = (x as f64 * ratio).floor() as usize;
    let from_y = (y as f64 * ratio).floor() as usize;
    let to_x = (((x + 1) as f64 * ratio).ceil() as usize).min(source.side);
    let to_y = (((y + 1) as f64 * ratio).ceil() as usize).min(source.side);
    let mut sums = [0.0_f64; 4];
    let mut taken = 0.0_f64;

    for row in from_y..to_y.max(from_y + 1) {
        for column in from_x..to_x.max(from_x + 1) {
            let pixel = source.at(column.min(source.side - 1), row.min(source.side - 1));
            let alpha = f64::from(pixel[3]) / f64::from(OPAQUE);

            for channel in 0..3 {
                sums[channel] += f64::from(pixel[channel]) * alpha;
            }

            sums[3] += alpha;
            taken += 1.0;
        }
    }

    if sums[3] <= 0.0 {
        return [0; 4];
    }

    [
        (sums[0] / sums[3]).round() as u8,
        (sums[1] / sums[3]).round() as u8,
        (sums[2] / sums[3]).round() as u8,
        (sums[3] / taken * f64::from(OPAQUE)).round() as u8,
    ]
}

fn read_dib(image: &[u8]) -> Option<Square> {
    let header = image.get(..DIB_HEADER)?;

    if read_u32(header, 0)? as usize != DIB_HEADER
        || read_u32(header, 16)? != DIB_UNCOMPRESSED
        || u16::from_le_bytes([header[14], header[15]]) != DIB_BIT_COUNT
    {
        return None;
    }

    let side = read_u32(header, 4)? as usize;
    let stored = read_u32(header, 8)? as usize;

    if side == 0 || (stored != side && stored != side * 2) {
        return None;
    }

    let rows = image.get(DIB_HEADER..DIB_HEADER + side * side * 4)?;
    let mut square = Square::blank(side);

    for y in 0..side {
        let start = (side - 1 - y) * side * 4;

        for x in 0..side {
            let pixel = &rows[start + x * 4..start + x * 4 + 4];

            square.pixels[y * side + x] = [pixel[0], pixel[1], pixel[2], pixel[3]];
        }
    }

    Some(square)
}

fn write_dib(square: &Square) -> Vec<u8> {
    let side = square.side;
    let mask_stride = side.div_ceil(32) * 4;
    let mut image = Vec::with_capacity(DIB_HEADER + side * side * 4 + mask_stride * side);

    image.extend((DIB_HEADER as u32).to_le_bytes());
    image.extend((side as u32).to_le_bytes());
    image.extend(((side * 2) as u32).to_le_bytes());
    image.extend(1_u16.to_le_bytes());
    image.extend(DIB_BIT_COUNT.to_le_bytes());
    image.extend(DIB_UNCOMPRESSED.to_le_bytes());
    image.extend([0_u8; 20]);

    for y in (0..side).rev() {
        for x in 0..side {
            image.extend(square.at(x, y));
        }
    }

    image.extend(std::iter::repeat_n(0_u8, mask_stride * side));

    image
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

    fn unlock_foreground(&self) -> Result<()>;

    fn give_foreground_back(&self) -> Result<()>;

    fn focus(&self, window: WindowId) -> Result<()>;

    fn focus_fast(&self, window: WindowId) -> Result<()>;

    fn client_windows(&self) -> Result<Vec<WindowId>>;

    fn maximize(&self, window: WindowId) -> Result<()>;

    fn apply_short_titles(&self, short: bool, suffix: Option<&str>) -> Result<ShortTitleReport>;

    fn set_window_icon(&self, window: WindowId, icon: Option<WindowIcon<'_>>) -> Result<()>;

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

    fn dib_of(side: usize, pixel: [u8; 4]) -> Vec<u8> {
        let square = Square {
            side,
            pixels: vec![pixel; side * side],
        };

        write_dib(&square)
    }

    const AMBER: [u8; 3] = [231, 232, 0];

    #[test]
    fn a_portrait_read_off_a_dib_comes_back_the_way_it_went_in() {
        let square = Square {
            side: 2,
            pixels: vec![
                [1, 2, 3, 255],
                [4, 5, 6, 255],
                [7, 8, 9, 255],
                [10, 11, 12, 255],
            ],
        };

        assert_eq!(read_dib(&write_dib(&square)), Some(square));
    }

    #[test]
    fn what_is_not_an_uncompressed_thirty_two_bit_dib_is_not_read() {
        let mut image = dib_of(4, [0, 0, 0, 255]);

        assert!(read_dib(&image).is_some());
        assert_eq!(read_dib(&image[..DIB_HEADER - 1]), None);

        image[14] = 24;

        assert_eq!(read_dib(&image), None, "a 24 bit dib carries no alpha");
    }

    #[test]
    fn a_ring_paints_the_edge_and_leaves_the_middle_to_the_portrait() {
        let white = [255, 255, 255, 255];
        let ringed = ringed_image(&dib_of(48, white), AMBER).expect("a portrait takes a ring");

        let painted = read_dib(&ringed).expect("the ring comes back as a dib");
        let [blue, green, red, alpha] = painted.at(24, 0);

        assert_eq!([red, green, blue], AMBER);
        assert_eq!(
            alpha, 255,
            "the rim of the icon is the colour, at full body"
        );
        assert_eq!(painted.at(24, 24), white, "the middle stays the portrait");
    }

    #[test]
    fn a_ring_rounds_the_portrait_off_and_keeps_the_corners_empty() {
        let ringed = ringed_image(&dib_of(32, [255, 255, 255, 255]), AMBER)
            .expect("a portrait takes a ring");

        let painted = read_dib(&ringed).expect("the ring comes back as a dib");

        assert_eq!(painted.side, 32);
        assert_eq!(painted.at(0, 0)[3], 0, "a corner falls outside the disc");
        assert_eq!(painted.at(31, 31)[3], 0);
    }

    #[test]
    fn a_ring_holds_its_share_of_the_icon_at_every_size() {
        for side in [16_usize, 32, 48] {
            let ringed = ringed_image(&dib_of(side, [0, 0, 0, 0]), AMBER)
                .expect("an empty portrait still takes a ring");
            let painted = read_dib(&ringed).expect("the ring comes back as a dib");
            let thickness = (0..side / 2)
                .take_while(|step| painted.at(side / 2, *step)[3] > 0)
                .count();

            assert_eq!(
                thickness,
                (side as f64 * RING_SHARE).round() as usize,
                "the ring of a {side} point icon"
            );
        }
    }

    #[test]
    fn what_is_not_a_portrait_takes_no_ring() {
        assert_eq!(ringed_image(&[], AMBER), None);
        assert_eq!(ringed_image(&[0; DIB_HEADER], AMBER), None);
    }

    #[test]
    fn shrinking_a_portrait_keeps_its_colour_and_loses_none_of_its_body() {
        let source = Square {
            side: 4,
            pixels: vec![[10, 20, 30, 255]; 16],
        };

        let shrunk = scaled(&source, 2);

        assert_eq!(shrunk.side, 2);
        assert!(
            shrunk
                .pixels
                .iter()
                .all(|pixel| { *pixel == [10, 20, 30, 255] })
        );
    }

    #[test]
    fn shrinking_what_is_transparent_leaves_nothing_behind() {
        let source = Square {
            side: 4,
            pixels: vec![[255, 255, 255, 0]; 16],
        };

        assert!(
            scaled(&source, 2)
                .pixels
                .iter()
                .all(|pixel| { pixel[3] == 0 })
        );
    }

    #[test]
    fn every_portrait_of_the_game_takes_a_ring_at_every_size_the_system_asks_for() {
        use crate::app::portraits::icon_of;
        use crate::domain::Class;
        use crate::domain::Gender;
        use crate::domain::Portrait;

        for class in Class::ALL {
            for gender in [Gender::Male, Gender::Female] {
                let icon = icon_of(Portrait { class, gender });

                for side in [16, 32, 48] {
                    let image =
                        icon_image(icon, side).expect("a portrait holds an image at every size");
                    let ringed = ringed_image(image, AMBER)
                        .unwrap_or_else(|| panic!("{class:?} {gender:?} at {side} takes a ring"));
                    let painted = read_dib(&ringed).expect("the ring comes back as a dib");

                    assert_eq!(painted.side, side as usize);
                    assert_eq!(
                        painted.at(side as usize / 2, 0)[..3],
                        [AMBER[2], AMBER[1], AMBER[0]],
                        "{class:?} {gender:?} at {side} wears the colour on its rim"
                    );
                }
            }
        }
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
