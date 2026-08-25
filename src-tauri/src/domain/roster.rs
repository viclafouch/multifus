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

    pub fn toggle_asleep(&mut self, nickname: &str) -> Option<bool> {
        let character = self.get_mut(nickname)?;

        if !character.is_sleepable() {
            return None;
        }

        character.asleep = !character.asleep;

        Some(character.asleep)
    }

    pub fn set_asleep_for_gender(&mut self, gender: Gender, asleep: bool) -> usize {
        let mut changed = 0;

        let concerned = self
            .characters
            .iter_mut()
            .filter(|character| character.gender == Some(gender) && character.is_sleepable());

        for character in concerned {
            if character.asleep != asleep {
                character.asleep = asleep;
                changed += 1;
            }
        }

        changed
    }

    pub fn swap_to(&mut self, awake: Gender) {
        self.set_asleep_for_gender(awake, false);
        self.set_asleep_for_gender(awake.other(), true);
    }

    pub fn swap(&mut self) -> Option<Gender> {
        let has_gender = self
            .characters
            .iter()
            .any(|character| character.gender.is_some() && character.is_sleepable());

        if !has_gender {
            return None;
        }

        let awake = if self.has_awake(Gender::Male) {
            Gender::Female
        } else {
            Gender::Male
        };

        self.swap_to(awake);

        Some(awake)
    }

    #[must_use]
    pub fn has_awake(&self, gender: Gender) -> bool {
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
    fn cycle_skips_asleep_characters() {
        let roster = roster(vec![
            Character::new("Alpha"),
            Character::new("Bravo").asleep(),
            Character::new("Charlie").asleep(),
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
    fn cycle_starts_from_an_asleep_character() {
        let roster = roster(vec![
            Character::new("Alpha"),
            Character::new("Bravo").asleep(),
            Character::new("Charlie"),
        ]);

        assert_eq!(roster.next_in_cycle("Bravo").unwrap().nickname, "Charlie");
        assert_eq!(roster.previous_in_cycle("Bravo").unwrap().nickname, "Alpha");
    }

    #[test]
    fn cycle_stays_on_the_only_awake_character() {
        let roster = roster(vec![
            Character::new("Alpha").asleep(),
            Character::new("Bravo"),
            Character::new("Charlie").asleep(),
        ]);

        assert_eq!(roster.next_in_cycle("Bravo").unwrap().nickname, "Bravo");
        assert_eq!(roster.previous_in_cycle("Bravo").unwrap().nickname, "Bravo");
    }

    #[test]
    fn cycle_gives_nothing_when_everyone_is_asleep() {
        let roster = roster(vec![
            Character::new("Alpha").asleep(),
            Character::new("Bravo").asleep(),
            Character::new("Charlie").asleep(),
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
            Character::new("Alpha").asleep(),
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
    fn toggle_asleep_takes_a_character_out_of_the_cycle_and_back_in() {
        let mut roster = roster(vec![Character::new("Alpha"), Character::new("Bravo")]);

        assert_eq!(roster.toggle_asleep("Bravo"), Some(true));
        assert_eq!(nicknames(&roster), vec!["Alpha"]);

        assert_eq!(roster.toggle_asleep("Bravo"), Some(false));
        assert_eq!(nicknames(&roster), vec!["Alpha", "Bravo"]);
    }

    #[test]
    fn toggle_asleep_refuses_unknown_and_offline_characters() {
        let mut roster = roster(vec![Character::new("Alpha").offline()]);

        assert_eq!(roster.toggle_asleep("Alpha"), None);
        assert_eq!(roster.toggle_asleep("Echo"), None);
        assert!(!roster.get("Alpha").unwrap().asleep);
    }

    #[test]
    fn a_group_action_pushes_the_veille_on_one_gender_only() {
        let mut roster = roster(vec![
            Character::new("Alpha").with_gender(Gender::Male),
            Character::new("Bravo").with_gender(Gender::Female),
            Character::new("Charlie"),
        ]);

        assert_eq!(roster.set_asleep_for_gender(Gender::Male, true), 1);
        assert_eq!(nicknames(&roster), vec!["Bravo", "Charlie"]);

        assert_eq!(roster.set_asleep_for_gender(Gender::Male, true), 0);
    }

    #[test]
    fn a_swap_sleeps_one_gender_and_wakes_the_other() {
        let mut roster = roster(vec![
            Character::new("Alpha").with_gender(Gender::Male),
            Character::new("Bravo").with_gender(Gender::Female).asleep(),
            Character::new("Charlie")
                .with_gender(Gender::Female)
                .asleep(),
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
            Character::new("Alpha").with_gender(Gender::Male).asleep(),
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
        assert!(roster.get("Alpha").unwrap().asleep);
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
    fn an_asleep_character_is_relayed_like_the_others() {
        let mut roster = roster(vec![Character::new("Alpha")]);

        roster.toggle_asleep("Alpha");

        assert!(roster.has_relayed_online());
        assert_eq!(nicknames(&roster), Vec::<&str>::new());
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
