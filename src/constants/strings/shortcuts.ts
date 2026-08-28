import type { ShortcutAction, ShortcutStatus } from '@/@types/shortcuts'
import type { CaptureRejection } from '@/constants/keyboard'
import { IS_APPLE } from '@/constants/keyboard'
import { MAXIMIZE_STRINGS } from '@/constants/strings/maximize'

const HELD = 'au maintien'

type ActionLabel = {
  readonly label: string
  readonly description: string
  readonly mention: string | null
}

const ACTION_LABELS = {
  next: {
    label: 'Fenêtre suivante',
    description:
      'Passe au personnage d’après, dans l’ordre de l’écran Personnages.',
    mention: null
  },
  previous: {
    label: 'Fenêtre précédente',
    description: 'Passe au personnage d’avant, dans le même ordre.',
    mention: null
  },
  main: {
    label: 'Personnage principal',
    description: 'Ramène devant votre personnage principal, où que vous soyez.',
    mention: null
  },
  toggleExcluded: {
    label: 'Exclure ou réintégrer',
    description:
      'Sort le personnage devant vous du défilement et de l’AutoFocus.',
    mention: null
  },
  walk: {
    label: 'Déplacement rapide',
    description: 'Allume le clic qui emmène toute la team, même hors du jeu.',
    mention: null
  },
  maximizeAll: {
    label: MAXIMIZE_STRINGS.maximize.all,
    description: 'Agrandit tous vos clients, même ceux ouverts avant Multifus.',
    mention: null
  },
  wheel: {
    label: 'Roue des personnages',
    description:
      'La team s’ouvre au milieu de l’écran, vous visez une tête, vous lâchez.',
    mention: HELD
  }
} as const satisfies Record<ShortcutAction, ActionLabel>

const STATUS_LINES = {
  unbound: 'Sans touches, il ne se passera rien.',
  invalid: 'Ces touches ne peuvent pas servir de raccourci.',
  refused: 'Refusé : un autre logiciel utilise déjà ces touches.',
  duplicate: (label: string) => {
    return `Déjà pris par ${label}.`
  }
} as const satisfies Record<
  Exclude<ShortcutStatus['kind'], 'registered'>,
  string | ((label: string) => string)
>

const REJECTION_LINES = {
  noModifier: IS_APPLE
    ? 'Ajoutez Ctrl, Alt ou Maj. Seule, cette touche serait prise dans tous vos logiciels.'
    : 'Ajoutez Ctrl, Alt ou Maj, ou prenez une touche de fonction : F1, F2, F5… Seule, cette touche serait prise dans tous vos logiciels.',
  unsupportedKey: 'Cette touche ne peut pas servir de raccourci.',
  pasteCombination:
    'C’est le raccourci pour coller sur votre ordinateur. Prenez-en un autre.'
} as const satisfies Record<CaptureRejection, string>

export const SHORTCUTS_STRINGS = {
  shortcuts: {
    title: 'Raccourcis',
    subtitle:
      'Changez de personnage sans lâcher la souris. Ces touches ne marchent que dans Dofus Retro.',
    silent:
      'Un autre logiciel peut déjà utiliser les mêmes touches. Multifus les accepte, mais rien ne se passera dans le jeu. En cas de doute, essayez le raccourci depuis Dofus Retro et regardez le journal, en bas.',
    lone: 'Une touche de fonction se pose seule, sans Ctrl ni Alt. Prise ici, elle ne redescend plus dans le jeu : évitez celles que vous avez posées dans les options de Dofus Retro.',
    defaults: 'Remettre les touches d’origine',
    capture: 'Appuyez sur vos touches',
    captureHint: 'Échap pour annuler, Retour arrière pour effacer.',
    empty: 'Aucune',
    held: HELD,
    undo: 'Remettre',
    undoNone: 'Remettre : aucune touche',
    undoLabel: (label: string) => {
      return `Remettre les touches d’avant pour ${label}`
    },
    edit: (label: string) => {
      return `Modifier le raccourci ${label}`
    },
    charactersTitle: 'Un personnage, une touche',
    charactersDescription: IS_APPLE
      ? 'Ctrl+Maj+1 sur l’Eniripsa, Ctrl+Maj+2 sur le Sacrieur : sa fenêtre passe devant, où que vous soyez.'
      : 'F1 sur l’Eniripsa, F2 sur le Sacrieur : sa fenêtre passe devant, où que vous soyez.',
    charactersEmpty:
      'Entrez en jeu, et vos personnages se posent ici tout seuls.',
    characterEdit: (nickname: string) => {
      return `Modifier le raccourci de ${nickname}`
    },
    characterNamed: (nickname: string) => {
      return `« ${nickname} »`
    },
    status: STATUS_LINES,
    rejected: REJECTION_LINES,
    actions: ACTION_LABELS
  }
} as const
