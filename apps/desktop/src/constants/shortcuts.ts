import { msg } from '@lingui/core/macro'
import type { ShortcutAction } from '@/@types/shortcuts'
import type { Phrase } from '@/lib/i18n'

export const HELD = msg`au maintien`

type ActionLabel = {
  readonly label: Phrase
  readonly description: Phrase
  readonly mention: Phrase | null
}

export const SHORTCUT_ACTIONS = {
  next: {
    label: msg`Personnage suivant`,
    description: msg`Passe au personnage d’après, dans votre ordre.`,
    mention: null
  },
  previous: {
    label: msg`Personnage précédent`,
    description: msg`Passe au personnage d’avant, dans le même ordre.`,
    mention: null
  },
  main: {
    label: msg`Personnage principal`,
    description: msg`Ramène votre principal devant, où que vous soyez.`,
    mention: null
  },
  toggleExcluded: {
    label: msg`Exclure ou réintégrer`,
    description: msg`Sort le personnage devant vous du défilement.`,
    mention: null
  },
  walk: {
    label: msg`Déplacement rapide`,
    description: msg`Allume ou éteint le Déplacement rapide.`,
    mention: null
  },
  maximizeAll: {
    label: msg`Agrandir les fenêtres`,
    description: msg`Agrandit tous vos clients Dofus d’un seul coup.`,
    mention: null
  },
  wheel: {
    label: msg`Roue des personnages`,
    description: msg`Affiche la roue des personnages. Lâchez sur une tête.`,
    mention: HELD
  },
  runeTable: {
    label: msg`Tableau des runes`,
    description: msg`Pose les poids des runes par-dessus le jeu.`,
    mention: null
  },
  health: {
    label: msg`Est-ce que tout marche ?`,
    description: msg`Ouvre Multifus sur le verdict des réglages.`,
    mention: null
  }
} as const satisfies Record<ShortcutAction, ActionLabel>
