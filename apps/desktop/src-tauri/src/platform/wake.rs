use std::sync::Arc;

use crate::platform::error::Result;

pub type WakeSink = Arc<dyn Fn() + Send + Sync>;

pub trait WakeWatcher: Send + Sync {
    fn start(&self, sink: WakeSink) -> Result<()>;

    fn stop(&self);
}
