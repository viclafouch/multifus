use crate::platform::error::Result;

pub trait PasteSender: Send + Sync {
    fn send_paste_combination(&self) -> Result<()>;
}
