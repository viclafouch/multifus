#[cfg(not(target_os = "macos"))]
fn main() {
    println!("The switch bench only runs on the Mac.");
}

#[cfg(target_os = "macos")]
fn main() {
    bench::run();
}

#[cfg(target_os = "macos")]
mod bench {
    use std::env::args;
    use std::thread;
    use std::time::Duration;
    use std::time::Instant;

    use multifus_lib::platform::GameWindow;
    use multifus_lib::platform::PlatformWindowManager;
    use multifus_lib::platform::WindowManager;

    const ROUNDS: usize = 20;

    const SETTLE: Duration = Duration::from_millis(400);

    pub fn run() {
        let windows = PlatformWindowManager::new(false);

        if !authorized(&windows) {
            return;
        }

        let Some(clients) = clients(&windows) else {
            return;
        };

        let rounds = rounds();

        println!(
            "{} clients, {rounds} switches per client, {} ms of rest between two",
            clients.len(),
            SETTLE.as_millis()
        );

        let mut spent = Vec::new();

        for round in 0..rounds {
            for client in &clients {
                thread::sleep(SETTLE);

                let started = Instant::now();
                let told = windows.focus(client.id());
                let took = started.elapsed();

                match told {
                    Ok(()) => spent.push(took),
                    Err(error) => println!("  round {round}, {} : {error}", client.nickname()),
                }
            }
        }

        report(&mut spent);
    }

    fn authorized(windows: &PlatformWindowManager) -> bool {
        match windows.authorization() {
            Ok(granted) if granted.is_granted() => true,
            Ok(_) => {
                println!(
                    "Accessibility is refused to this bench. Add it in System Settings, \
                     Privacy and Security, Accessibility."
                );

                false
            }
            Err(error) => {
                println!("Accessibility did not answer: {error}");

                false
            }
        }
    }

    fn clients(windows: &PlatformWindowManager) -> Option<Vec<GameWindow>> {
        let found = match windows.game_windows() {
            Ok(found) => found,
            Err(error) => {
                println!("The windows of the game could not be read: {error}");

                return None;
            }
        };

        if found.is_empty() {
            println!("No Dofus Retro client is open.");

            return None;
        }

        Some(found)
    }

    fn rounds() -> usize {
        args()
            .nth(1)
            .and_then(|asked| asked.parse().ok())
            .filter(|asked| *asked > 0)
            .unwrap_or(ROUNDS)
    }

    fn report(spent: &mut [Duration]) {
        if spent.is_empty() {
            println!("No switch went through.");

            return;
        }

        spent.sort_unstable();

        let total: Duration = spent.iter().sum();
        let middle = spent[spent.len() / 2];
        let ninth = spent[spent.len() * 9 / 10];

        println!(
            "{} switches: median {:.1} ms, ninth decile {:.1} ms, worst {:.1} ms, mean {:.1} ms",
            spent.len(),
            middle.as_secs_f64() * 1000.0,
            ninth.as_secs_f64() * 1000.0,
            spent[spent.len() - 1].as_secs_f64() * 1000.0,
            total.as_secs_f64() * 1000.0 / spent.len() as f64
        );
    }
}
