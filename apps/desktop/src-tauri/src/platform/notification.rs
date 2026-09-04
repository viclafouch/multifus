use crate::domain::GameNotification;
use crate::platform::Authorization;
use crate::platform::error::Result;

pub type NotificationSink = Box<dyn Fn(NotificationReport) + Send + 'static>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NotificationReport {
    Heard(GameNotification),

    Unreadable { detail: String },

    ListeningLost { detail: String },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct SystemChecks {
    pub notifications: Option<bool>,
    pub game_notifications: Option<bool>,
    pub focus_off: Option<bool>,
}

pub trait NotificationWatcher: Send + Sync {
    fn authorization(&self) -> Result<Authorization>;

    fn request_authorization(&self) -> Result<Authorization>;

    fn checks(&self) -> SystemChecks;

    fn start(&mut self, sink: NotificationSink) -> Result<()>;

    fn stop(&mut self) -> Result<()>;

    fn dismiss(&self, nickname: &str) -> Result<()>;
}
