use serde_json::Value;
use serde_json::json;

use crate::app::journal::Launch;
use crate::app::stats::tally::Tally;
use crate::config::BannerCorner;
use crate::config::Language;
use crate::config::Settings;
use crate::config::Shortcuts;
use crate::domain::Character;
use crate::domain::Class;
use crate::domain::NotificationKind;
use crate::domain::Shortcut;

pub struct Measured<'a> {
    pub settings: &'a Settings,
    pub tally: &'a Tally,
    pub is_first_launch: bool,
    pub is_authorized: bool,
    pub has_config_problem: bool,
}

pub struct StartedParams<'a> {
    pub measured: &'a Measured<'a>,
    pub launch: Launch,
    pub is_windows_eleven: bool,
}

#[must_use]
pub fn started_props(params: StartedParams<'_>) -> Value {
    let StartedParams {
        measured,
        launch,
        is_windows_eleven,
    } = params;

    let settings = measured.settings;
    let auto_focus = &settings.auto_focus;
    let banner = &settings.banner;
    let rune_table = &settings.rune_table;
    let loops = settings.loops_seen;
    let loops_seen = [
        loops.wheel,
        loops.walk,
        loops.rune_table,
        loops.auto_focus,
        loops.relay,
        loops.quick_texts,
    ]
    .into_iter()
    .filter(|seen| *seen)
    .count();

    let mut props = json!({
        "launch": named_launch(launch),
        "windows_eleven": is_windows_eleven,
        "language": named_language(settings.language),
        "first_launch": measured.is_first_launch,
        "onboarding_done": settings.onboarding_done,
        "config_problem": measured.has_config_problem,

        "characters": settings.roster.len(),
        "characters_classed": counted(settings, |character| character.class.is_some()),
        "characters_coloured": counted(settings, |character| character.color.is_some()),
        "has_main": settings.roster.main().is_some(),
        "relayed_characters": counted(settings, |character| character.relayed),

        "start_at_login": settings.start_at_login,
        "maximize_on_launch": settings.maximize_on_launch,
        "short_titles": settings.short_titles,
        "paint_portraits": settings.paint_portraits,
        "ungroup_taskbar": settings.ungroup_taskbar,
        "auto_focus": auto_focus.enabled,
        "wakes_minimized": auto_focus.wakes_minimized,
        "combat": auto_focus.combat,
        "trade": auto_focus.trade,
        "group": auto_focus.group,
        "private_message": auto_focus.private_message,
        "challenge": auto_focus.challenge,
        "craft": auto_focus.craft,
        "perceptor": auto_focus.perceptor,
        "rune_table_everywhere": rune_table.everywhere,
        "relay_send_body": settings.relay.send_body,
        "relay_paired": settings.relay.chat_id.is_some(),

        "auto_focus_kinds": NotificationKind::ALL
            .into_iter()
            .filter(|kind| auto_focus.is_kind_enabled(*kind))
            .count(),
        "banner_corner": named_corner(banner.corner),
        "banner_screen_chosen": banner.screen.is_some(),
        "wheel_diameter": settings.wheel.diameter,
        "rune_table_width": rune_table.width,
        "rune_table_transparency": rune_table.transparency,
        "rune_table_moved": rune_table.offset.is_some(),
        "quick_texts": settings.quick_texts.len(),
        "quick_texts_bound": settings
            .quick_texts
            .iter()
            .filter(|quick_text| quick_text.shortcut.is_some())
            .count(),
        "shortcuts_changed": shortcuts_changed(&settings.shortcuts),
        "shortcuts_off": shortcuts_off(&settings.shortcuts),
        "loops_seen": loops_seen,
    });

    for class in Class::ALL {
        let played = counted(settings, |character| character.class == Some(class));

        props[format!("class_{}", named_class(class))] = json!(played);
    }

    props
}

#[must_use]
pub fn stopped_props(measured: &Measured<'_>) -> Value {
    let mut props = measured.tally.counted();

    props["authorized"] = json!(measured.is_authorized);

    props
}

fn counted(settings: &Settings, matches: impl Fn(&Character) -> bool) -> usize {
    settings
        .roster
        .characters()
        .iter()
        .filter(|character| matches(character))
        .count()
}

fn all_shortcuts(shortcuts: &Shortcuts) -> [&Option<Shortcut>; 9] {
    [
        &shortcuts.next,
        &shortcuts.previous,
        &shortcuts.main,
        &shortcuts.toggle_excluded,
        &shortcuts.walk,
        &shortcuts.maximize_all,
        &shortcuts.wheel,
        &shortcuts.rune_table,
        &shortcuts.health,
    ]
}

fn shortcuts_changed(shortcuts: &Shortcuts) -> usize {
    let defaults = Shortcuts::default();

    all_shortcuts(shortcuts)
        .into_iter()
        .zip(all_shortcuts(&defaults))
        .filter(|(bound, default)| bound != default)
        .count()
}

fn shortcuts_off(shortcuts: &Shortcuts) -> usize {
    all_shortcuts(shortcuts)
        .into_iter()
        .filter(|bound| bound.is_none())
        .count()
}

fn named_launch(launch: Launch) -> &'static str {
    match launch {
        Launch::ByHand => "by_hand",
        Launch::Session => "session",
    }
}

fn named_language(language: Option<Language>) -> &'static str {
    match language {
        None => "system",
        Some(Language::Fr) => "fr",
        Some(Language::En) => "en",
        Some(Language::Es) => "es",
    }
}

fn named_class(class: Class) -> &'static str {
    match class {
        Class::Feca => "feca",
        Class::Osamodas => "osamodas",
        Class::Enutrof => "enutrof",
        Class::Sram => "sram",
        Class::Xelor => "xelor",
        Class::Ecaflip => "ecaflip",
        Class::Eniripsa => "eniripsa",
        Class::Iop => "iop",
        Class::Cra => "cra",
        Class::Sadida => "sadida",
        Class::Sacrieur => "sacrieur",
        Class::Pandawa => "pandawa",
    }
}

fn named_corner(corner: BannerCorner) -> &'static str {
    match corner {
        BannerCorner::TopLeft => "top_left",
        BannerCorner::TopRight => "top_right",
        BannerCorner::BottomLeft => "bottom_left",
        BannerCorner::BottomRight => "bottom_right",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app::journal::JournalEvent;
    use crate::app::journal::Outcome;
    use crate::domain::Class;
    use crate::domain::Color;
    use crate::domain::Roster;

    const NAME_CEILING: usize = 60;

    const KEY_CEILING: usize = 40;

    const WORD_CEILING: usize = 180;

    const EVENT_NAMES: [&str; 5] = [
        "app_started",
        "app_stopped",
        "onboarding_finished",
        "app_updated",
        "app_crashed",
    ];

    #[test]
    fn a_fresh_configuration_is_told_as_the_defaults_say_it() {
        let settings = Settings::default();
        let tally = Tally::new();
        let props = started_props(StartedParams {
            measured: &measured(&settings, &tally),
            launch: Launch::ByHand,
            is_windows_eleven: false,
        });

        assert_eq!(props["launch"], json!("by_hand"));
        assert_eq!(props["language"], json!("system"));
        assert_eq!(props["first_launch"], json!(false));
        assert_eq!(props["onboarding_done"], json!(false));
        assert_eq!(props["characters"], json!(0));
        assert_eq!(props["has_main"], json!(false));
        assert_eq!(props["maximize_on_launch"], json!(true));
        assert_eq!(props["start_at_login"], json!(false));
        assert_eq!(props["auto_focus"], json!(true));
        assert_eq!(props["auto_focus_kinds"], json!(7));
        assert_eq!(props["banner_corner"], json!("bottom_right"));
        assert_eq!(props["quick_texts"], json!(1));
        assert_eq!(props["quick_texts_bound"], json!(0));
        assert_eq!(props["shortcuts_changed"], json!(0));
        assert_eq!(props["shortcuts_off"], json!(0));
        assert_eq!(props["loops_seen"], json!(0));
        assert_eq!(props["relay_paired"], json!(false));
        assert_eq!(props["rune_table_moved"], json!(false));
    }

    #[test]
    fn a_played_configuration_is_told_by_its_counts_and_never_by_a_name() {
        let mut settings = Settings {
            language: Some(Language::Fr),
            roster: Roster::from_characters(vec![
                classed("Ilyzaelle", Class::Eniripsa),
                coloured("Aryenne", Color::Turquoise),
                Character::new("Nokatt"),
            ]),
            shortcuts: Shortcuts {
                next: Shortcut::new("Control+Shift+KeyN"),
                wheel: None,
                ..Shortcuts::default()
            },
            ..Settings::default()
        };

        settings.roster.set_main("Ilyzaelle", true);

        let tally = Tally::new();
        let props = started_props(StartedParams {
            measured: &Measured {
                settings: &settings,
                tally: &tally,
                is_first_launch: false,
                is_authorized: false,
                has_config_problem: true,
            },
            launch: Launch::Session,
            is_windows_eleven: true,
        });

        assert_eq!(props["launch"], json!("session"));
        assert_eq!(props["language"], json!("fr"));
        assert_eq!(props["windows_eleven"], json!(true));
        assert_eq!(props["config_problem"], json!(true));
        assert_eq!(props["characters"], json!(3));
        assert_eq!(props["characters_classed"], json!(1));
        assert_eq!(props["characters_coloured"], json!(1));
        assert_eq!(props["has_main"], json!(true));
        assert_eq!(props["shortcuts_changed"], json!(2));
        assert_eq!(props["shortcuts_off"], json!(1));

        let written = props.to_string();

        for nickname in ["Ilyzaelle", "Aryenne", "Nokatt"] {
            assert!(
                !written.contains(nickname),
                "no nickname ever leaves the machine"
            );
        }
    }

    #[test]
    fn a_roster_is_told_class_by_class_and_never_nickname_by_nickname() {
        let settings = Settings {
            roster: Roster::from_characters(vec![
                classed("Ilyzaelle", Class::Iop),
                classed("Aryenne", Class::Iop),
                classed("Nokatt", Class::Eniripsa),
                Character::new("Brimbelle"),
            ]),
            ..Settings::default()
        };
        let tally = Tally::new();
        let props = started_props(StartedParams {
            measured: &measured(&settings, &tally),
            launch: Launch::ByHand,
            is_windows_eleven: false,
        });

        assert_eq!(props["class_iop"], json!(2));
        assert_eq!(props["class_eniripsa"], json!(1));
        assert_eq!(props["class_sacrieur"], json!(0));
        assert_eq!(props["characters"], json!(4));
        assert_eq!(
            props["characters_classed"],
            json!(3),
            "the one left unlabelled counts nowhere"
        );

        for class in Class::ALL {
            let key = format!("class_{}", named_class(class));

            assert!(
                props[&key].is_number(),
                "every class of the game answers, even at zero: {key}"
            );
        }
    }

    #[test]
    fn the_counters_of_a_session_are_told_down_to_the_kind_of_notification() {
        let settings = Settings::default();
        let mut tally = Tally::new();

        tally.count(&JournalEvent::Notification {
            nickname: "Ilyzaelle".to_owned(),
            notification_kind: Some(NotificationKind::Combat),
            outcome: Outcome::Focused { focus_micros: 900 },
        });
        tally.count_walk_switch();
        tally.count_rune_table_open();
        tally.count_health_check();

        let props = stopped_props(&measured(&settings, &tally));

        assert_eq!(props["auto_focus_switches"], json!(1));
        assert_eq!(props["auto_focus_combat"], json!(1));
        assert_eq!(props["auto_focus_trade"], json!(0));
        assert_eq!(props["auto_focus_perceptor"], json!(0));
        assert_eq!(props["walk_switches"], json!(1));
        assert_eq!(props["rune_table_opens"], json!(1));
        assert_eq!(props["health_checks"], json!(1));
        assert_eq!(props["authorized"], json!(true));
        assert_eq!(props["switches"], json!(0));
        assert_eq!(props["minutes"], json!(0));
    }

    #[test]
    fn every_name_and_every_key_stays_under_what_the_server_accepts() {
        let settings = Settings::default();
        let tally = Tally::new();

        for name in EVENT_NAMES {
            assert!(
                name.len() <= NAME_CEILING,
                "the server refuses an event name past {NAME_CEILING} characters: {name}"
            );
        }

        let sent = [
            started_props(StartedParams {
                measured: &measured(&settings, &tally),
                launch: Launch::ByHand,
                is_windows_eleven: false,
            }),
            stopped_props(&measured(&settings, &tally)),
        ];

        for props in sent {
            for key in props.as_object().expect("an object of properties").keys() {
                assert!(
                    !key.is_empty() && key.len() <= KEY_CEILING,
                    "the server refuses a property key past {KEY_CEILING} characters: {key}"
                );
            }
        }
    }

    #[test]
    fn every_value_is_a_number_a_yes_or_no_or_a_short_word() {
        let settings = Settings::default();
        let tally = Tally::new();
        let props = started_props(StartedParams {
            measured: &measured(&settings, &tally),
            launch: Launch::ByHand,
            is_windows_eleven: false,
        });

        for (key, value) in props.as_object().expect("an object of properties") {
            let is_carried = match value {
                Value::Number(_) | Value::Bool(_) => true,
                Value::String(word) => word.len() <= WORD_CEILING,
                _ => false,
            };

            assert!(is_carried, "the server keeps no shape like {key}: {value}");
        }
    }

    fn measured<'a>(settings: &'a Settings, tally: &'a Tally) -> Measured<'a> {
        Measured {
            settings,
            tally,
            is_first_launch: false,
            is_authorized: true,
            has_config_problem: false,
        }
    }

    fn classed(nickname: &str, class: Class) -> Character {
        let mut character = Character::new(nickname);

        character.class = Some(class);

        character
    }

    fn coloured(nickname: &str, color: Color) -> Character {
        let mut character = Character::new(nickname);

        character.color = Some(color);

        character
    }
}
