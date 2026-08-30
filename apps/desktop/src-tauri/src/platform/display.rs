use std::time::Duration;

use crate::platform::error::Result;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScreenSaverDelay {
    Never,
    After(Duration),
    Unknown,
}

pub trait DisplayKeeper: Send + Sync {
    fn keep_awake(&mut self) -> Result<()>;

    fn release(&mut self) -> Result<()>;

    fn is_awake(&self) -> bool;

    fn screen_saver_delay(&self) -> Result<ScreenSaverDelay>;
}
