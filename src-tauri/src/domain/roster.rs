use serde::Deserialize;
use serde::Serialize;

use super::character::Character;
use super::character::Gender;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Roster {
    characters: Vec<Character>,
}

impl Roster {
    #[must_use]
    pub fn new() -> Self {
        Self {
            characters: Vec::new(),
        }
    }

    #[must_use]
    pub fn from_characters(characters: Vec<Character>) -> Self {
        Self { characters }
    }

    #[must_use]
    pub fn characters(&self) -> &[Character] {
        &self.characters
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.characters.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.characters.is_empty()
    }

    #[must_use]
    pub fn position(&self, nickname: &str) -> Option<usize> {
        self.characters
            .iter()
            .position(|character| character.nickname == nickname)
    }

    #[must_use]
    pub fn get(&self, nickname: &str) -> Option<&Character> {
        self.characters
            .iter()
            .find(|character| character.nickname == nickname)
    }

    #[must_use]
    pub fn is_excluded(&self, nickname: &str) -> bool {
        self.get(nickname).is_some_and(Character::is_excluded)
    }

    pub fn get_mut(&mut self, nickname: &str) -> Option<&mut Character> {
        self.characters
            .iter_mut()
            .find(|character| character.nickname == nickname)
    }

    pub fn add(&mut self, character: Character) -> bool {
        if self.get(&character.nickname).is_some() {
            return false;
        }

        self.characters.push(character);

        true
    }

    pub fn remove(&mut self, nickname: &str) -> Option<Character> {
        let index = self.position(nickname)?;

        Some(self.characters.remove(index))
    }

    pub fn set_online(&mut self, nickname: &str, online: bool) -> bool {
        match self.get_mut(nickname) {
            Some(character) => {
                character.online = online;

                true
            }
            None => false,
        }
    }

    pub fn reorder(&mut self, order: &[String]) {
        let mut ordered = Vec::with_capacity(self.characters.len());

        for nickname in order {
            let already_taken = ordered
                .iter()
                .any(|character: &Character| character.nickname == *nickname);

            if already_taken {
                continue;
            }

            if let Some(index) = self.position(nickname) {
                ordered.push(self.characters[index].clone());
            }
        }

        let untouched = self
            .characters
            .iter()
            .filter(|character| !order.contains(&character.nickname))
            .cloned();

        ordered.extend(untouched);

        self.characters = ordered;
    }

    pub fn in_cycle(&self) -> impl DoubleEndedIterator<Item = &Character> {
        self.characters
            .iter()
            .filter(|character| character.is_in_cycle())
    }

    #[must_use]
    pub fn next_in_cycle(&self, current: &str) -> Option<&Character> {
        match self.position(current) {
            Some(index) => self.scan_from(index, Direction::Forward),
            None => self.in_cycle().next(),
        }
    }

    #[must_use]
    pub fn previous_in_cycle(&self, current: &str) -> Option<&Character> {
        match self.position(current) {
            Some(index) => self.scan_from(index, Direction::Backward),
            None => self.in_cycle().next_back(),
        }
    }

    fn scan_from(&self, index: usize, direction: Direction) -> Option<&Character> {
        let len = self.characters.len();

        (1..=len)
            .map(|offset| match direction {
                Direction::Forward => (index + offset) % len,
                Direction::Backward => (index + len - offset) % len,
            })
            .map(|position| &self.characters[position])
            .find(|character| character.is_in_cycle())
    }

    pub fn toggle_excluded(&mut self, nickname: &str) -> Option<bool> {
        let character = self.get_mut(nickname)?;

        if !character.is_excludable() {
            return None;
        }

        character.excluded = !character.excluded;

        Some(character.excluded)
    }

    pub fn set_excluded_for_gender(&mut self, gender: Gender, excluded: bool) -> usize {
        let mut changed = 0;

        let concerned = self
            .characters
            .iter_mut()
            .filter(|character| character.gender == Some(gender) && character.is_excludable());

        for character in concerned {
            if character.excluded != excluded {
                character.excluded = excluded;
                changed += 1;
            }
        }

        changed
    }

    pub fn swap_to(&mut self, kept: Gender) {
        self.set_excluded_for_gender(kept, false);
        self.set_excluded_for_gender(kept.other(), true);
    }

    pub fn swap(&mut self) -> Option<Gender> {
        let has_gender = self
            .characters
            .iter()
            .any(|character| character.gender.is_some() && character.is_excludable());

        if !has_gender {
            return None;
        }

        let kept = if self.has_in_cycle(Gender::Male) {
            Gender::Female
        } else {
            Gender::Male
        };

        self.swap_to(kept);

        Some(kept)
    }

    #[must_use]
    pub fn has_in_cycle(&self, gender: Gender) -> bool {
        self.characters
            .iter()
            .any(|character| character.gender == Some(gender) && character.is_in_cycle())
    }

    pub fn set_relayed(&mut self, nickname: &str, relayed: bool) -> bool {
        match self.get_mut(nickname) {
            Some(character) => {
                character.relayed = relayed;

                true
            }
            None => false,
        }
    }

    pub fn set_main(&mut self, nickname: &str, main: bool) -> bool {
        if self.get(nickname).is_none() {
            return false;
        }

        let mut changed = false;

        for character in &mut self.characters {
            let is_the_one = character.nickname == nickname;
            let wanted = if is_the_one {
                main
            } else {
                character.main && !main
            };

            if character.main != wanted {
                character.main = wanted;
                changed = true;
            }
        }

        changed
    }

    #[must_use]
    pub fn main(&self) -> Option<&Character> {
        self.characters.iter().find(|character| character.is_main())
    }

    pub fn relayed(&self) -> impl DoubleEndedIterator<Item = &Character> {
        self.characters.iter().filter(|character| character.relayed)
    }

    #[must_use]
    pub fn has_relayed(&self) -> bool {
        self.relayed().next().is_some()
    }

    #[must_use]
    pub fn has_relayed_online(&self) -> bool {
        self.characters.iter().any(Character::is_relayed_online)
    }
}

#[derive(Debug, Clone, Copy)]
enum Direction {
    Forward,
    Backward,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn roster(characters: Vec<Character>) -> Roster {
        Roster::from_characters(characters)
    }

    fn nicknames(roster: &Roster) -> Vec<&str> {
        roster
            .in_cycle()
            .map(|character| character.nickname.as_str())
            .collect()
    }

    fn relayed(roster: &Roster) -> Vec<&str> {
        roster
            .relayed()
            .map(|character| character.nickname.as_str())
            .collect()
    }

    #[test]
    fn empty_roster_has_no_next_and_no_previous() {
        let roster = Roster::new();

        assert!(roster.is_empty());
        assert_eq!(roster.next_in_cycle("Alpha"), None);
        assert_eq!(roster.previous_in_cycle("Alpha"), None);
    }

    #[test]
    fn cycle_walks_the_roster_in_order_and_wraps() {
        let roster = roster(vec![
            Character::new("Alpha"),
            Character::new("Bravo"),
            Character::new("Charlie"),
        ]);

        assert_eq!(roster.next_in_cycle("Alpha").unwrap().nickname, "Bravo");
        assert_eq!(roster.next_in_cycle("Bravo").unwrap().nickname, "Charlie");
        assert_eq!(roster.next_in_cycle("Charlie").unwrap().nickname, "Alpha");

        assert_eq!(
            roster.previous_in_cycle("Charlie").unwrap().nickname,
            "Bravo"
        );
        assert_eq!(roster.previous_in_cycle("Bravo").unwrap().nickname, "Alpha");
        assert_eq!(
            roster.previous_in_cycle("Alpha").unwrap().nickname,
            "Charlie"
        );
    }

    #[test]
    fn cycle_skips_excluded_characters() {
        let roster = roster(vec![
            Character::new("Alpha"),
            Character::new("Bravo").excluded(),
            Character::new("Charlie").excluded(),
            Character::new("Delta"),
        ]);

        assert_eq!(roster.next_in_cycle("Alpha").unwrap().nickname, "Delta");
        assert_eq!(roster.next_in_cycle("Delta").unwrap().nickname, "Alpha");
        assert_eq!(roster.previous_in_cycle("Alpha").unwrap().nickname, "Delta");
        assert_eq!(roster.previous_in_cycle("Delta").unwrap().nickname, "Alpha");
    }

    #[test]
    fn cycle_skips_offline_characters() {
        let roster = roster(vec![
            Character::new("Alpha"),
            Character::new("Bravo").offline(),
            Character::new("Charlie"),
        ]);

        assert_eq!(roster.next_in_cycle("Alpha").unwrap().nickname, "Charlie");
        assert_eq!(
            roster.previous_in_cycle("Alpha").unwrap().nickname,
            "Charlie"
        );
    }

    #[test]
    fn cycle_starts_from_an_excluded_character() {
        let roster = roster(vec![
            Character::new("Alpha"),
            Character::new("Bravo").excluded(),
            Character::new("Charlie"),
        ]);

        assert_eq!(roster.next_in_cycle("Bravo").unwrap().nickname, "Charlie");
        assert_eq!(roster.previous_in_cycle("Bravo").unwrap().nickname, "Alpha");
    }

    #[test]
    fn cycle_stays_on_the_only_included_character() {
        let roster = roster(vec![
            Character::new("Alpha").excluded(),
            Character::new("Bravo"),
            Character::new("Charlie").excluded(),
        ]);

        assert_eq!(roster.next_in_cycle("Bravo").unwrap().nickname, "Bravo");
        assert_eq!(roster.previous_in_cycle("Bravo").unwrap().nickname, "Bravo");
    }

    #[test]
    fn cycle_gives_nothing_when_everyone_is_excluded() {
        let roster = roster(vec![
            Character::new("Alpha").excluded(),
            Character::new("Bravo").excluded(),
            Character::new("Charlie").excluded(),
        ]);

        assert_eq!(roster.next_in_cycle("Alpha"), None);
        assert_eq!(roster.previous_in_cycle("Alpha"), None);
        assert_eq!(roster.next_in_cycle("Bravo"), None);
    }

    #[test]
    fn cycle_gives_nothing_when_nobody_is_online() {
        let roster = roster(vec![
            Character::new("Alpha").offline(),
            Character::new("Bravo").offline(),
        ]);

        assert_eq!(roster.next_in_cycle("Alpha"), None);
        assert_eq!(roster.previous_in_cycle("Alpha"), None);
    }

    #[test]
    fn an_unknown_current_falls_back_to_the_ends_of_the_roster() {
        let roster = roster(vec![
            Character::new("Alpha").excluded(),
            Character::new("Bravo"),
            Character::new("Charlie"),
        ]);

        assert_eq!(roster.next_in_cycle("Echo").unwrap().nickname, "Bravo");
        assert_eq!(
            roster.previous_in_cycle("Echo").unwrap().nickname,
            "Charlie"
        );
    }

    #[test]
    fn toggle_excluded_takes_a_character_out_of_the_cycle_and_back_in() {
        let mut roster = roster(vec![Character::new("Alpha"), Character::new("Bravo")]);

        assert_eq!(roster.toggle_excluded("Bravo"), Some(true));
        assert_eq!(nicknames(&roster), vec!["Alpha"]);

        assert_eq!(roster.toggle_excluded("Bravo"), Some(false));
        assert_eq!(nicknames(&roster), vec!["Alpha", "Bravo"]);
    }

    #[test]
    fn toggle_excluded_refuses_unknown_and_offline_characters() {
        let mut roster = roster(vec![Character::new("Alpha").offline()]);

        assert_eq!(roster.toggle_excluded("Alpha"), None);
        assert_eq!(roster.toggle_excluded("Echo"), None);
        assert!(!roster.get("Alpha").unwrap().excluded);
    }

    #[test]
    fn a_group_action_pushes_the_veille_on_one_gender_only() {
        let mut roster = roster(vec![
            Character::new("Alpha").with_gender(Gender::Male),
            Character::new("Bravo").with_gender(Gender::Female),
            Character::new("Charlie"),
        ]);

        assert_eq!(roster.set_excluded_for_gender(Gender::Male, true), 1);
        assert_eq!(nicknames(&roster), vec!["Bravo", "Charlie"]);

        assert_eq!(roster.set_excluded_for_gender(Gender::Male, true), 0);
    }

    #[test]
    fn a_swap_excludes_one_gender_and_includes_the_other() {
        let mut roster = roster(vec![
            Character::new("Alpha").with_gender(Gender::Male),
            Character::new("Bravo")
                .with_gender(Gender::Female)
                .excluded(),
            Character::new("Charlie")
                .with_gender(Gender::Female)
                .excluded(),
        ]);

        roster.swap_to(Gender::Female);
        assert_eq!(nicknames(&roster), vec!["Bravo", "Charlie"]);

        roster.swap_to(Gender::Male);
        assert_eq!(nicknames(&roster), vec!["Alpha"]);
    }

    #[test]
    fn a_swap_leaves_the_characters_without_a_gender_alone() {
        let mut roster = roster(vec![
            Character::new("Alpha").with_gender(Gender::Male),
            Character::new("Bravo"),
        ]);

        roster.swap_to(Gender::Female);

        assert_eq!(nicknames(&roster), vec!["Bravo"]);
    }

    #[test]
    fn the_swap_shortcut_alternates_between_the_two_genders() {
        let mut roster = roster(vec![
            Character::new("Alpha").with_gender(Gender::Male),
            Character::new("Bravo").with_gender(Gender::Female),
        ]);

        assert_eq!(roster.swap(), Some(Gender::Female));
        assert_eq!(nicknames(&roster), vec!["Bravo"]);

        assert_eq!(roster.swap(), Some(Gender::Male));
        assert_eq!(nicknames(&roster), vec!["Alpha"]);
    }

    #[test]
    fn the_swap_shortcut_does_nothing_without_a_gendered_character() {
        let mut roster = roster(vec![
            Character::new("Alpha"),
            Character::new("Bravo").with_gender(Gender::Male).offline(),
        ]);

        assert_eq!(roster.swap(), None);
        assert_eq!(nicknames(&roster), vec!["Alpha"]);
    }

    #[test]
    fn reordering_rewrites_the_cycle_order() {
        let mut roster = roster(vec![
            Character::new("Alpha"),
            Character::new("Bravo"),
            Character::new("Charlie"),
        ]);

        roster.reorder(&["Charlie".to_owned(), "Alpha".to_owned(), "Bravo".to_owned()]);

        assert_eq!(nicknames(&roster), vec!["Charlie", "Alpha", "Bravo"]);
        assert_eq!(roster.next_in_cycle("Charlie").unwrap().nickname, "Alpha");
    }

    #[test]
    fn reordering_keeps_everyone_the_order_forgot() {
        let mut roster = roster(vec![
            Character::new("Alpha").with_gender(Gender::Male).excluded(),
            Character::new("Bravo"),
            Character::new("Charlie"),
        ]);

        roster.reorder(&["Bravo".to_owned(), "Alpha".to_owned()]);

        let order = roster
            .characters()
            .iter()
            .map(|character| character.nickname.as_str())
            .collect::<Vec<_>>();

        assert_eq!(order, vec!["Bravo", "Alpha", "Charlie"]);
        assert!(roster.get("Alpha").unwrap().excluded);
        assert_eq!(roster.get("Alpha").unwrap().gender, Some(Gender::Male));
    }

    #[test]
    fn reordering_ignores_what_the_roster_does_not_hold() {
        let mut roster = roster(vec![Character::new("Alpha"), Character::new("Bravo")]);

        roster.reorder(&[
            "Echo".to_owned(),
            "Bravo".to_owned(),
            "Bravo".to_owned(),
            "Alpha".to_owned(),
        ]);

        assert_eq!(nicknames(&roster), vec!["Bravo", "Alpha"]);
        assert_eq!(roster.len(), 2);
    }

    #[test]
    fn everybody_is_relayed_until_somebody_is_unticked() {
        let mut roster = roster(vec![Character::new("Alpha"), Character::new("Bravo")]);

        assert!(roster.has_relayed());
        assert_eq!(relayed(&roster), vec!["Alpha", "Bravo"]);

        assert!(roster.set_relayed("Bravo", false));
        assert_eq!(relayed(&roster), vec!["Alpha"]);

        assert!(roster.set_relayed("Bravo", true));
        assert_eq!(relayed(&roster), vec!["Alpha", "Bravo"]);

        assert!(!roster.set_relayed("Echo", false));
    }

    #[test]
    fn a_roster_where_nobody_is_ticked_has_nothing_to_carry() {
        let mut roster = roster(vec![Character::new("Alpha"), Character::new("Bravo")]);

        roster.set_relayed("Alpha", false);
        roster.set_relayed("Bravo", false);

        assert!(!roster.has_relayed());
        assert!(!roster.has_relayed_online());
        assert!(!Roster::new().has_relayed());
    }

    #[test]
    fn an_offline_character_can_still_be_ticked_and_unticked() {
        let mut roster = roster(vec![Character::new("Alpha").offline()]);

        assert!(roster.set_relayed("Alpha", false));
        assert!(!roster.get("Alpha").unwrap().relayed);
    }

    #[test]
    fn the_relay_stops_having_anything_to_hear_when_the_last_one_disconnects() {
        let mut roster = roster(vec![
            Character::new("Alpha"),
            Character::new("Bravo").not_relayed(),
        ]);

        assert!(roster.has_relayed_online());

        roster.set_online("Alpha", false);

        assert!(!roster.has_relayed_online());
        assert!(roster.has_relayed(), "Alpha is still ticked, only offline");

        roster.set_online("Alpha", true);

        assert!(roster.has_relayed_online(), "and it comes back");
    }

    #[test]
    fn an_excluded_character_is_relayed_like_the_others() {
        let mut roster = roster(vec![Character::new("Alpha")]);

        roster.toggle_excluded("Alpha");

        assert!(roster.has_relayed_online());
        assert_eq!(nicknames(&roster), Vec::<&str>::new());
    }

    #[test]
    fn only_one_character_at_a_time_wears_the_star() {
        let mut roster = roster(vec![
            Character::new("Alpha"),
            Character::new("Bravo"),
            Character::new("Charlie"),
        ]);

        assert_eq!(roster.main(), None);

        assert!(roster.set_main("Bravo", true));
        assert_eq!(roster.main().unwrap().nickname, "Bravo");

        assert!(roster.set_main("Charlie", true));
        assert_eq!(roster.main().unwrap().nickname, "Charlie");
        assert!(!roster.get("Bravo").unwrap().is_main());
    }

    #[test]
    fn taking_the_star_back_leaves_nobody_wearing_it() {
        let mut roster = roster(vec![Character::new("Alpha"), Character::new("Bravo")]);

        roster.set_main("Alpha", true);

        assert!(roster.set_main("Alpha", false));
        assert_eq!(roster.main(), None);
    }

    #[test]
    fn taking_the_star_off_somebody_who_never_had_it_moves_nothing() {
        let mut roster = roster(vec![Character::new("Alpha"), Character::new("Bravo")]);

        roster.set_main("Alpha", true);

        assert!(
            !roster.set_main("Bravo", false),
            "nothing moved, so nothing is written down"
        );
        assert_eq!(roster.main().unwrap().nickname, "Alpha");
    }

    #[test]
    fn giving_the_star_to_the_one_who_already_wears_it_moves_nothing() {
        let mut roster = roster(vec![Character::new("Alpha"), Character::new("Bravo")]);

        roster.set_main("Alpha", true);

        assert!(!roster.set_main("Alpha", true));
        assert_eq!(roster.main().unwrap().nickname, "Alpha");
    }

    #[test]
    fn the_star_refuses_a_nickname_the_roster_does_not_hold() {
        let mut roster = roster(vec![Character::new("Alpha").main()]);

        assert!(!roster.set_main("Echo", true));
        assert_eq!(roster.main().unwrap().nickname, "Alpha");
    }

    #[test]
    fn the_star_holds_on_a_character_the_cycle_has_dropped() {
        let mut roster = roster(vec![Character::new("Alpha"), Character::new("Bravo")]);

        roster.set_main("Alpha", true);
        roster.toggle_excluded("Alpha");
        roster.set_online("Alpha", false);

        assert_eq!(roster.main().unwrap().nickname, "Alpha");
        assert_eq!(nicknames(&roster), vec!["Bravo"]);
    }

    #[test]
    fn a_file_hand_edited_with_two_stars_keeps_the_first_until_the_next_gesture() {
        let mut roster = roster(vec![
            Character::new("Alpha").main(),
            Character::new("Bravo").main(),
        ]);

        assert_eq!(roster.main().unwrap().nickname, "Alpha");

        roster.set_main("Charlie", true);

        assert_eq!(roster.main().unwrap().nickname, "Alpha", "Charlie is unknown");

        roster.set_main("Bravo", true);

        assert_eq!(roster.main().unwrap().nickname, "Bravo");
        assert!(!roster.get("Alpha").unwrap().is_main());
    }

    #[test]
    fn removing_a_character_takes_his_star_with_him() {
        let mut roster = roster(vec![Character::new("Alpha"), Character::new("Bravo")]);

        roster.set_main("Alpha", true);
        roster.remove("Alpha");

        assert_eq!(roster.main(), None);
    }

    #[test]
    fn a_character_enters_the_roster_once_and_leaves_on_removal() {
        let mut roster = Roster::new();

        assert!(roster.add(Character::new("Alpha")));
        assert!(!roster.add(Character::new("Alpha")));
        assert_eq!(roster.len(), 1);

        assert!(roster.set_online("Alpha", false));
        assert!(!roster.get("Alpha").unwrap().online);
        assert!(!roster.set_online("Echo", false));

        assert_eq!(roster.remove("Alpha").unwrap().nickname, "Alpha");
        assert!(roster.is_empty());
    }
}
