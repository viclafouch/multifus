//! Throwaway probe. Answers the four questions of the "temps 1", docs/plan.md.
//!
//! It lays a paste combination on the system towards whatever window is in
//! front, borrowing and giving back the clipboard exactly as `app::quick_replies`
//! will. Nothing here is meant to survive the measurement.

use std::env;
use std::io::Write;
use std::process::Command;
use std::process::Stdio;
use std::thread::sleep;
use std::time::Duration;

use objc2_core_graphics::CGEvent;
use objc2_core_graphics::CGEventFlags;
use objc2_core_graphics::CGEventSource;
use objc2_core_graphics::CGEventSourceStateID;
use objc2_core_graphics::CGEventTapLocation;
use objc2_core_graphics::CGKeyCode;

/// `kVK_ANSI_V`.
const KEY_V: CGKeyCode = 9;

/// Both sides of Command, Shift, Option and Control.
const MODIFIER_KEYS: [CGKeyCode; 8] = [55, 54, 56, 60, 58, 61, 59, 62];

const DEFAULT_TEXT: &str = "multifus prix libre";
const DEFAULT_SEED: &str = "ANCIEN-PRESSE-PAPIERS";
const DEFAULT_RESTORE_MS: u64 = 300;
const DEFAULT_WAIT_SECONDS: u64 = 5;

#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXIsProcessTrusted() -> bool;
}

struct Options {
    combo: CGEventFlags,
    combo_name: String,
    tap: CGEventTapLocation,
    tap_name: String,
    source: CGEventSourceStateID,
    source_name: String,
    should_flush_modifiers: bool,
    restore_ms: u64,
    wait_seconds: u64,
    text: String,
    seed: String,
}

fn main() {
    let options = match parse_options() {
        Ok(options) => options,
        Err(message) => {
            println!("{message}");
            println!("{USAGE}");

            return;
        }
    };

    if !unsafe { AXIsProcessTrusted() } {
        println!("Accessibilité REFUSÉE au terminal qui lance ce binaire.");
        println!("Réglages Système, Confidentialité et sécurité, Accessibilité.");
        println!("Sans elle, la mesure rend une fausse réponse négative. Arrêt.");

        return;
    }

    println!("Accessibilité accordée.");
    println!(
        "Combinaison {}, tap {}, source {}, relâchement des modificateurs {}.",
        options.combo_name,
        options.tap_name,
        options.source_name,
        if options.should_flush_modifiers {
            "oui"
        } else {
            "non"
        }
    );

    write_clipboard(&options.seed);
    let saved = read_clipboard();
    println!("Presse-papiers de départ: {saved:?}");

    for remaining in (1..=options.wait_seconds).rev() {
        println!("Passe devant Dofus, clique le champ de chat. {remaining}…");
        sleep(Duration::from_secs(1));
    }

    write_clipboard(&options.text);
    println!("Presse-papiers rempli avec {:?}", options.text);

    if options.should_flush_modifiers {
        release_modifiers(options.source);
        println!("Modificateurs relâchés.");
    }

    post_paste(&options);
    println!("Combinaison posée.");

    sleep(Duration::from_millis(options.restore_ms));

    if options.restore_ms > 0 {
        write_clipboard(&saved);
        println!("Ancien presse-papiers rendu après {} ms.", options.restore_ms);
    } else {
        println!("Ancien presse-papiers non rendu, c'était demandé.");
    }

    println!();
    println!("À rapporter: ce que le chat de Dofus porte maintenant.");
    println!("  {:?} la combinaison arrive", options.text);
    println!("  {saved:?} le délai est trop court");
    println!("  rien du tout, la combinaison n'arrive pas");
}

fn post_paste(options: &Options) {
    let source = CGEventSource::new(options.source);
    let source = source.as_deref();

    let Some(down) = CGEvent::new_keyboard_event(source, KEY_V, true) else {
        println!("CGEventCreateKeyboardEvent a refusé l'appui.");

        return;
    };

    let Some(up) = CGEvent::new_keyboard_event(source, KEY_V, false) else {
        println!("CGEventCreateKeyboardEvent a refusé le relâchement.");

        return;
    };

    CGEvent::set_flags(Some(&down), options.combo);
    CGEvent::set_flags(Some(&up), options.combo);

    CGEvent::post(options.tap, Some(&down));
    sleep(Duration::from_millis(10));
    CGEvent::post(options.tap, Some(&up));
}

/// Posts a release for every modifier key, so that one physically held down
/// stops colouring what comes after it. This is the whole of question 2.
fn release_modifiers(state: CGEventSourceStateID) {
    let source = CGEventSource::new(state);
    let source = source.as_deref();

    for key in MODIFIER_KEYS {
        let Some(event) = CGEvent::new_keyboard_event(source, key, false) else {
            continue;
        };

        CGEvent::set_flags(Some(&event), CGEventFlags::empty());
        CGEvent::post(CGEventTapLocation::HIDEventTap, Some(&event));
    }

    sleep(Duration::from_millis(30));
}

fn read_clipboard() -> String {
    let output = Command::new("pbpaste").output();

    match output {
        Ok(output) => String::from_utf8_lossy(&output.stdout).into_owned(),
        Err(error) => {
            println!("pbpaste a échoué: {error}");

            String::new()
        }
    }
}

fn write_clipboard(text: &str) {
    let child = Command::new("pbcopy").stdin(Stdio::piped()).spawn();

    let mut child = match child {
        Ok(child) => child,
        Err(error) => {
            println!("pbcopy a échoué: {error}");

            return;
        }
    };

    if let Some(stdin) = child.stdin.as_mut() {
        let _ = stdin.write_all(text.as_bytes());
    }

    let _ = child.wait();
}

const USAGE: &str = "\
Usage: cargo run -- [options]
  --combo cmd|ctrl            défaut cmd
  --tap hid|session|annotated défaut hid
  --source private|combined   défaut private
  --flush                     relâche les modificateurs avant de poser
  --restore-ms N              défaut 300, 0 pour ne pas rendre
  --wait N                    secondes avant de poser, défaut 5
  --text TEXTE                le texte de la réponse
  --seed TEXTE                ce qui est dans le presse-papiers avant";

fn parse_options() -> Result<Options, String> {
    let mut options = Options {
        combo: CGEventFlags::MaskCommand,
        combo_name: "Cmd+V".to_owned(),
        tap: CGEventTapLocation::HIDEventTap,
        tap_name: "hid".to_owned(),
        source: CGEventSourceStateID::Private,
        source_name: "private".to_owned(),
        should_flush_modifiers: false,
        restore_ms: DEFAULT_RESTORE_MS,
        wait_seconds: DEFAULT_WAIT_SECONDS,
        text: DEFAULT_TEXT.to_owned(),
        seed: DEFAULT_SEED.to_owned(),
    };

    let mut arguments = env::args().skip(1);

    while let Some(argument) = arguments.next() {
        let mut value = || {
            arguments
                .next()
                .ok_or_else(|| format!("{argument} attend une valeur."))
        };

        match argument.as_str() {
            "--combo" => {
                let name = value()?;

                options.combo = match name.as_str() {
                    "cmd" => CGEventFlags::MaskCommand,
                    "ctrl" => CGEventFlags::MaskControl,
                    other => return Err(format!("Combinaison inconnue: {other}")),
                };
                options.combo_name = format!("{name}+V");
            }
            "--tap" => {
                let name = value()?;

                options.tap = match name.as_str() {
                    "hid" => CGEventTapLocation::HIDEventTap,
                    "session" => CGEventTapLocation::SessionEventTap,
                    "annotated" => CGEventTapLocation::AnnotatedSessionEventTap,
                    other => return Err(format!("Tap inconnu: {other}")),
                };
                options.tap_name = name;
            }
            "--source" => {
                let name = value()?;

                options.source = match name.as_str() {
                    "private" => CGEventSourceStateID::Private,
                    "combined" => CGEventSourceStateID::CombinedSessionState,
                    other => return Err(format!("Source inconnue: {other}")),
                };
                options.source_name = name;
            }
            "--flush" => {
                options.should_flush_modifiers = true;
            }
            "--restore-ms" => {
                options.restore_ms = value()?.parse().map_err(|_| "--restore-ms veut un nombre.")?;
            }
            "--wait" => {
                options.wait_seconds = value()?.parse().map_err(|_| "--wait veut un nombre.")?;
            }
            "--text" => {
                options.text = value()?;
            }
            "--seed" => {
                options.seed = value()?;
            }
            other => return Err(format!("Option inconnue: {other}")),
        }
    }

    Ok(options)
}
