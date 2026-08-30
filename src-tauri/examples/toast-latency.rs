#[cfg(not(target_os = "windows"))]
fn main() {
    println!("Le banc de mesure des notifications ne tourne que sur Windows.");
}

#[cfg(target_os = "windows")]
fn main() {
    bench::run();
}

#[cfg(target_os = "windows")]
mod bench {
    use std::collections::HashMap;
    use std::collections::HashSet;
    use std::sync::Arc;
    use std::sync::atomic::AtomicBool;
    use std::sync::atomic::Ordering;
    use std::sync::mpsc;
    use std::thread;
    use std::time::Duration;
    use std::time::Instant;

    use windows::Data::Xml::Dom::XmlDocument;
    use windows::Foundation::TypedEventHandler;
    use windows::UI::Notifications::KnownNotificationBindings;
    use windows::UI::Notifications::Management::UserNotificationListener;
    use windows::UI::Notifications::Management::UserNotificationListenerAccessStatus;
    use windows::UI::Notifications::NotificationKinds;
    use windows::UI::Notifications::ToastNotification;
    use windows::UI::Notifications::ToastNotificationManager;
    use windows::UI::Notifications::ToastNotifier;
    use windows::UI::Notifications::UserNotification;
    use windows::UI::Notifications::UserNotificationChangedEventArgs;
    use windows::Win32::System::Com::COINIT_APARTMENTTHREADED;
    use windows::Win32::System::Com::CoInitializeEx;
    use windows::Win32::UI::WindowsAndMessaging::DispatchMessageW;
    use windows::Win32::UI::WindowsAndMessaging::MSG;
    use windows::Win32::UI::WindowsAndMessaging::PM_REMOVE;
    use windows::Win32::UI::WindowsAndMessaging::PeekMessageW;
    use windows::Win32::UI::WindowsAndMessaging::TranslateMessage;
    use windows::core::HSTRING;

    const POWERSHELL_APP_ID: &str =
        r"{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe";

    const PUMP_INTERVAL: Duration = Duration::from_millis(25);

    const CANDIDATES: [Duration; 4] = [
        Duration::from_millis(500),
        Duration::from_millis(250),
        Duration::from_millis(150),
        Duration::from_millis(100),
    ];

    const BETWEEN_TOASTS: Duration = Duration::from_millis(1373);

    const SETTLE: Duration = Duration::from_secs(2);

    const TITLE_PREFIX: &str = "Multifus banc";

    const TOAST_GROUP: &str = "multifus-banc";

    const DEFAULT_ROUNDS: usize = 24;

    const CALLS_PER_COST: usize = 100;

    const QUEUE_DEPTHS: [usize; 4] = [0, 8, 16, 32];

    struct Heard {
        round: usize,
        at: Instant,
    }

    struct Reading {
        interval: Duration,
        latencies: Vec<Duration>,
    }

    pub fn run() {
        let rounds = std::env::args()
            .nth(1)
            .and_then(|argument| argument.parse().ok())
            .unwrap_or(DEFAULT_ROUNDS);

        if let Err(reason) = ask_access() {
            println!("{reason}");

            return;
        }

        announce_subscription();
        println!();
        announce_cost();
        println!();
        println!(
            "{rounds} notifications par intervalle, une toutes les {} ms.",
            BETWEEN_TOASTS.as_millis()
        );
        println!("Laissez la machine tranquille, le Mode Concentration éteint.\n");

        let readings: Vec<Reading> = CANDIDATES
            .into_iter()
            .map(|interval| {
                let reading = Reading {
                    interval,
                    latencies: measure(interval, rounds),
                };

                thread::sleep(SETTLE);

                reading
            })
            .collect();

        report(&readings);
    }

    fn ask_access() -> Result<(), String> {
        let listener = UserNotificationListener::Current()
            .map_err(|error| format!("Listener introuvable : {error}"))?;
        let status = listener
            .RequestAccessAsync()
            .and_then(|request| request.join())
            .map_err(|error| format!("Demande d’accès refusée : {error}"))?;

        if status == UserNotificationListenerAccessStatus::Allowed {
            return Ok(());
        }

        Err("L’accès aux notifications est refusé. Autorisez-le dans les réglages.".to_owned())
    }

    fn announce_subscription() {
        let listener = UserNotificationListener::Current().expect("le listener");
        let handler =
            TypedEventHandler::<UserNotificationListener, UserNotificationChangedEventArgs>::new(
                |_, _| Ok(()),
            );

        match listener.NotificationChanged(&handler) {
            Ok(token) => {
                drop(listener.RemoveNotificationChanged(token));

                println!("Abonnement NotificationChanged : accepté.");
            }
            Err(error) => {
                println!("Abonnement NotificationChanged : refusé, {error}");
            }
        }
    }

    fn announce_cost() {
        let listener = UserNotificationListener::Current().expect("le listener");
        let notifier = notifier();

        clear_history();
        thread::sleep(SETTLE);

        println!("Un appel GetNotificationsAsync, selon la file en attente :");

        let mut shown = 0;

        for depth in QUEUE_DEPTHS {
            while shown < depth {
                notifier.Show(&build_toast(shown)).expect("l’envoi");

                shown += 1;
            }

            thread::sleep(SETTLE);

            println!(
                "  {depth:>3} en attente   {:>6} µs",
                cost_of_one_call(&listener).as_micros()
            );
        }

        clear_history();
    }

    fn cost_of_one_call(listener: &UserNotificationListener) -> Duration {
        let started = Instant::now();

        for _ in 0..CALLS_PER_COST {
            drop(
                listener
                    .GetNotificationsAsync(NotificationKinds::Toast)
                    .and_then(|request| request.join()),
            );
        }

        started.elapsed() / CALLS_PER_COST as u32
    }

    fn measure(interval: Duration, rounds: usize) -> Vec<Duration> {
        println!(
            "---- scrutation toutes les {} ms ----",
            interval.as_millis()
        );

        let running = Arc::new(AtomicBool::new(true));
        let (sender, receiver) = mpsc::channel();
        let watcher = thread::spawn({
            let running = Arc::clone(&running);

            move || {
                watch(interval, &running, &sender);
            }
        });

        thread::sleep(SETTLE);

        let notifier = notifier();
        let mut sent = HashMap::new();

        for round in 0..rounds {
            let toast = build_toast(round);

            sent.insert(round, Instant::now());
            notifier.Show(&toast).expect("l’envoi de la notification");

            thread::sleep(BETWEEN_TOASTS);
        }

        thread::sleep(SETTLE);
        running.store(false, Ordering::Relaxed);
        drop(watcher.join());
        clear_history();

        let mut latencies: Vec<Duration> = receiver
            .try_iter()
            .filter_map(|heard: Heard| {
                sent.get(&heard.round)
                    .map(|at| heard.at.saturating_duration_since(*at))
            })
            .collect();

        latencies.sort_unstable();

        println!("{} entendues sur {rounds}.\n", latencies.len());

        latencies
    }

    fn notifier() -> ToastNotifier {
        ToastNotificationManager::CreateToastNotifierWithId(&HSTRING::from(POWERSHELL_APP_ID))
            .expect("le notificateur de PowerShell")
    }

    fn clear_history() {
        drop(ToastNotificationManager::History().and_then(|history| {
            history.RemoveGroupWithId(
                &HSTRING::from(TOAST_GROUP),
                &HSTRING::from(POWERSHELL_APP_ID),
            )
        }));
    }

    fn build_toast(round: usize) -> ToastNotification {
        let payload = format!(
            "<toast><visual><binding template=\"ToastGeneric\"><text>{TITLE_PREFIX} {round}</text><text>latence</text></binding></visual></toast>"
        );
        let document = XmlDocument::new().expect("le document");

        document
            .LoadXml(&HSTRING::from(payload))
            .expect("le contenu de la notification");

        let toast = ToastNotification::CreateToastNotification(&document).expect("la notification");

        toast
            .SetGroup(&HSTRING::from(TOAST_GROUP))
            .expect("le groupe de la notification");

        toast
    }

    fn watch(interval: Duration, running: &AtomicBool, sender: &mpsc::Sender<Heard>) {
        let _ = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };

        let listener = UserNotificationListener::Current().expect("le listener");
        let mut reported = HashSet::new();

        while running.load(Ordering::Relaxed) {
            collect(&listener, &mut reported, sender);
            wait(running, interval);
        }
    }

    fn collect(
        listener: &UserNotificationListener,
        reported: &mut HashSet<u32>,
        sender: &mpsc::Sender<Heard>,
    ) {
        let Ok(current) = listener
            .GetNotificationsAsync(NotificationKinds::Toast)
            .and_then(|request| request.join())
        else {
            return;
        };
        let at = Instant::now();

        for toast in &current {
            let Ok(id) = toast.Id() else {
                continue;
            };

            if !reported.insert(id) {
                continue;
            }

            if let Some(round) = round_of(&toast) {
                drop(sender.send(Heard { round, at }));
            }
        }
    }

    fn round_of(toast: &UserNotification) -> Option<usize> {
        let generic = KnownNotificationBindings::ToastGeneric().ok()?;
        let elements = toast
            .Notification()
            .and_then(|notification| notification.Visual())
            .and_then(|visual| visual.GetBinding(&generic))
            .and_then(|binding| binding.GetTextElements())
            .ok()?;
        let title = elements.into_iter().next()?.Text().ok()?.to_string();

        title.strip_prefix(TITLE_PREFIX)?.trim().parse().ok()
    }

    fn wait(running: &AtomicBool, interval: Duration) {
        let deadline = Instant::now() + interval;

        while running.load(Ordering::Relaxed) && Instant::now() < deadline {
            pump();

            thread::sleep(PUMP_INTERVAL);
        }
    }

    fn pump() {
        let mut message = MSG::default();

        while unsafe { PeekMessageW(&mut message, None, 0, 0, PM_REMOVE) }.as_bool() {
            unsafe {
                let _ = TranslateMessage(&message);
                DispatchMessageW(&message);
            }
        }
    }

    fn report(readings: &[Reading]) {
        println!("intervalle   entendues   minimum   médiane   p95   maximum   moyenne");

        for reading in readings {
            if reading.latencies.is_empty() {
                println!("{:>7} ms   rien entendu", reading.interval.as_millis());

                continue;
            }

            let sorted = &reading.latencies;

            println!(
                "{:>7} ms   {:>9}   {:>5} ms   {:>5} ms   {:>3} ms   {:>5} ms   {:>5} ms",
                reading.interval.as_millis(),
                sorted.len(),
                sorted[0].as_millis(),
                quantile(sorted, 50).as_millis(),
                quantile(sorted, 95).as_millis(),
                sorted[sorted.len() - 1].as_millis(),
                mean(sorted).as_millis()
            );
        }
    }

    fn quantile(sorted: &[Duration], percent: usize) -> Duration {
        let last = sorted.len() - 1;
        let rank = (last * percent).div_ceil(100);

        sorted[rank]
    }

    fn mean(latencies: &[Duration]) -> Duration {
        latencies.iter().sum::<Duration>() / latencies.len() as u32
    }
}
