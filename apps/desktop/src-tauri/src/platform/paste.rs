use crate::platform::error::Result;

pub trait PasteSender: Send + Sync {
    fn send_paste_combination(&self) -> Result<()>;
}

pub trait Clipboard {
    fn text(&self) -> Option<String>;

    fn set_text(&self, text: &str) -> Result<()>;
}
