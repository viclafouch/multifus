use crate::domain::Class;
use crate::domain::Gender;
use crate::domain::Portrait;

#[must_use]
pub fn icon_of(portrait: Portrait) -> &'static [u8] {
    match (portrait.class, portrait.gender) {
        (Class::Feca, Gender::Male) => {
            include_bytes!("../../icons/portraits/feca_m.ico").as_slice()
        }
        (Class::Feca, Gender::Female) => {
            include_bytes!("../../icons/portraits/feca_f.ico").as_slice()
        }
        (Class::Osamodas, Gender::Male) => {
            include_bytes!("../../icons/portraits/osamodas_m.ico").as_slice()
        }
        (Class::Osamodas, Gender::Female) => {
            include_bytes!("../../icons/portraits/osamodas_f.ico").as_slice()
        }
        (Class::Enutrof, Gender::Male) => {
            include_bytes!("../../icons/portraits/enutrof_m.ico").as_slice()
        }
        (Class::Enutrof, Gender::Female) => {
            include_bytes!("../../icons/portraits/enutrof_f.ico").as_slice()
        }
        (Class::Sram, Gender::Male) => {
            include_bytes!("../../icons/portraits/sram_m.ico").as_slice()
        }
        (Class::Sram, Gender::Female) => {
            include_bytes!("../../icons/portraits/sram_f.ico").as_slice()
        }
        (Class::Xelor, Gender::Male) => {
            include_bytes!("../../icons/portraits/xelor_m.ico").as_slice()
        }
        (Class::Xelor, Gender::Female) => {
            include_bytes!("../../icons/portraits/xelor_f.ico").as_slice()
        }
        (Class::Ecaflip, Gender::Male) => {
            include_bytes!("../../icons/portraits/ecaflip_m.ico").as_slice()
        }
        (Class::Ecaflip, Gender::Female) => {
            include_bytes!("../../icons/portraits/ecaflip_f.ico").as_slice()
        }
        (Class::Eniripsa, Gender::Male) => {
            include_bytes!("../../icons/portraits/eniripsa_m.ico").as_slice()
        }
        (Class::Eniripsa, Gender::Female) => {
            include_bytes!("../../icons/portraits/eniripsa_f.ico").as_slice()
        }
        (Class::Iop, Gender::Male) => include_bytes!("../../icons/portraits/iop_m.ico").as_slice(),
        (Class::Iop, Gender::Female) => {
            include_bytes!("../../icons/portraits/iop_f.ico").as_slice()
        }
        (Class::Cra, Gender::Male) => include_bytes!("../../icons/portraits/cra_m.ico").as_slice(),
        (Class::Cra, Gender::Female) => {
            include_bytes!("../../icons/portraits/cra_f.ico").as_slice()
        }
        (Class::Sadida, Gender::Male) => {
            include_bytes!("../../icons/portraits/sadida_m.ico").as_slice()
        }
        (Class::Sadida, Gender::Female) => {
            include_bytes!("../../icons/portraits/sadida_f.ico").as_slice()
        }
        (Class::Sacrieur, Gender::Male) => {
            include_bytes!("../../icons/portraits/sacrieur_m.ico").as_slice()
        }
        (Class::Sacrieur, Gender::Female) => {
            include_bytes!("../../icons/portraits/sacrieur_f.ico").as_slice()
        }
        (Class::Pandawa, Gender::Male) => {
            include_bytes!("../../icons/portraits/pandawa_m.ico").as_slice()
        }
        (Class::Pandawa, Gender::Female) => {
            include_bytes!("../../icons/portraits/pandawa_f.ico").as_slice()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const ICON_DIRECTORY: [u8; 4] = [0, 0, 1, 0];

    #[test]
    fn every_class_carries_a_portrait_for_both_sexes() {
        for class in Class::ALL {
            for gender in [Gender::Male, Gender::Female] {
                let icon = icon_of(Portrait { class, gender });

                assert_eq!(
                    icon.get(..4),
                    Some(ICON_DIRECTORY.as_slice()),
                    "{class:?} {gender:?} is not an icon"
                );
            }
        }
    }

    #[test]
    fn the_two_sexes_of_a_class_are_two_different_portraits() {
        let male = icon_of(Portrait {
            class: Class::Iop,
            gender: Gender::Male,
        });
        let female = icon_of(Portrait {
            class: Class::Iop,
            gender: Gender::Female,
        });

        assert_ne!(male, female);
    }
}
