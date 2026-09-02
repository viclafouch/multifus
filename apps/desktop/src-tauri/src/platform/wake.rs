use std::sync::Arc;

use crate::platform::error::Result;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Wake {
    GameWindows,
    Foreground,
}

pub type WakeSink = Arc<dyn Fn(Wake) + Send + Sync>;

pub trait WakeWatcher: Send + Sync {
    fn start(&self, sink: WakeSink) -> Result<()>;

    fn stop(&self);
}
