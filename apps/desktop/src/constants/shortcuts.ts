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
    label: msg`Fenêtre suivante`,
    description: msg`Passe au personnage d’après, dans l’ordre de l’écran Personnages.`,
    mention: null
  },
  previous: {
    label: msg`Fenêtre précédente`,
    description: msg`Passe au personnage d’avant, dans le même ordre.`,
    mention: null
  },
  main: {
    label: msg`Personnage principal`,
    description: msg`Ramène devant votre personnage principal, d’où que vous veniez dans le jeu.`,
    mention: null
  },
  toggleExcluded: {
    label: msg`Exclure ou réintégrer`,
    description: msg`Sort le personnage devant vous du défilement et de l’AutoFocus.`,
    mention: null
  },
  walk: {
    label: msg`Déplacement rapide`,
    description: msg`Allume le clic qui emmène toute la team d’une map à l’autre.`,
    mention: null
  },
  maximizeAll: {
    label: msg`Agrandir les fenêtres`,
    description: msg`Agrandit tous vos clients, même ceux ouverts avant Multifus.`,
    mention: null
  },
  wheel: {
    label: msg`Roue des personnages`,
    description: msg`La team s’ouvre au milieu de l’écran, vous visez une tête, vous lâchez.`,
    mention: HELD
  },
  runeTable: {
    label: msg`Tableau des runes`,
    description: msg`Affiche les poids des runes par-dessus le jeu. Les mêmes touches les retirent.`,
    mention: null
  }
} as const satisfies Record<ShortcutAction, ActionLabel>
