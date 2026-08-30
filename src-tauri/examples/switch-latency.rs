#[cfg(not(target_os = "macos"))]
fn main() {
    println!("Le banc de la bascule ne tourne que sur le Mac.");
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
            "{} clients, {rounds} bascules par client, {} ms de repos entre deux",
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
                    Err(error) => println!("  tour {round}, {} : {error}", client.nickname()),
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
                    "L'Accessibilité est refusée à ce banc. Ajoutez-le dans Réglages Système, \
                     Confidentialité et sécurité, Accessibilité."
                );

                false
            }
            Err(error) => {
                println!("L'Accessibilité n'a pas répondu : {error}");

                false
            }
        }
    }

    fn clients(windows: &PlatformWindowManager) -> Option<Vec<GameWindow>> {
        let found = match windows.game_windows() {
            Ok(found) => found,
            Err(error) => {
                println!("Les fenêtres du jeu n'ont pas pu être lues : {error}");

                return None;
            }
        };

        if found.is_empty() {
            println!("Aucun client de Dofus Retro n'est ouvert.");

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
            println!("Aucune bascule n'a abouti.");

            return;
        }

        spent.sort_unstable();

        let total: Duration = spent.iter().sum();
        let middle = spent[spent.len() / 2];
        let ninth = spent[spent.len() * 9 / 10];

        println!(
            "{} bascules : médiane {:.1} ms, neuvième décile {:.1} ms, pire {:.1} ms, moyenne {:.1} ms",
            spent.len(),
            middle.as_secs_f64() * 1000.0,
            ninth.as_secs_f64() * 1000.0,
            spent[spent.len() - 1].as_secs_f64() * 1000.0,
            total.as_secs_f64() * 1000.0 / spent.len() as f64
        );
    }
}
