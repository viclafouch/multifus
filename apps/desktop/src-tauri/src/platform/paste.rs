use crate::platform::error::Result;
use crate::platform::window::WindowId;

pub trait PasteSender: Send + Sync {
    fn send_paste_combination(&self, here: WindowId) -> Result<()>;
}

pub trait Clipboard {
    fn text(&self) -> Option<String>;

    fn set_text(&self, text: &str) -> Result<()>;
}
