import type { ShortcutAction, ShortcutStatus } from '@/@types/shortcuts'
import type { CaptureRejection } from '@/constants/keyboard'

const ACTION_LABELS = {
  next: {
    label: 'Fenêtre suivante',
    description: 'Passe à la fenêtre Dofus Retro suivante.'
  },
  previous: {
    label: 'Fenêtre précédente',
    description: 'Passe à la fenêtre Dofus Retro précédente.'
  },
  toggleExcluded: {
    label: 'Exclure',
    description:
      'Exclut le personnage que vous avez devant vous, ou le réintègre.'
  },
  swap: {
    label: 'Inverser hommes et femmes',
    description: 'Vos hommes sont exclus, vos femmes réintégrées. Ou l’inverse.'
  },
  walk: {
    label: 'Déplacement rapide',
    description:
      'Allume et éteint le Déplacement rapide, dans le jeu comme ailleurs.'
  }
} as const satisfies Record<
  ShortcutAction,
  { readonly label: string; readonly description: string }
>

const STATUS_LINES = {
  pending: 'Un instant, Multifus s’en occupe.',
  unbound: 'Sans touches, il ne se passera rien.',
  invalid: 'Ces touches ne peuvent pas servir de raccourci.',
  refused: 'Refusé : un autre logiciel utilise déjà ces touches.',
  duplicate: (label: string) => {
    return `Déjà pris par ${label}, donc celui-ci ne fera rien.`
  }
} as const satisfies Record<
  Exclude<ShortcutStatus['kind'], 'registered'>,
  string | ((label: string) => string)
>

const REJECTION_LINES = {
  noModifier:
    'Ajoutez Ctrl, Alt ou Maj. Seule, cette touche serait prise dans tous vos logiciels.',
  unsupportedKey: 'Cette touche ne peut pas servir de raccourci.',
  pasteCombination:
    'C’est le raccourci pour coller sur votre ordinateur. Prenez-en un autre.'
} as const satisfies Record<CaptureRejection, string>

const QUICK_REPLIES_STRINGS = {
  title: 'Réponses rapides',
  description:
    'Marre de retaper toujours la même chose ? Rangez le texte sous des touches, et collez-le dans Dofus Retro en un instant.',
  add: 'Ajouter une réponse',
  empty:
    'Aucune réponse pour l’instant. Ajoutez « Je vends, mp moi » ou « En combat, j’arrive ».',
  placeholder: 'Je vends, mp moi !',
  textLabel: 'Texte de la réponse',
  remove: 'Retirer cette réponse',
  edit: 'Modifier le raccourci de cette réponse',
  named: (text: string) => {
    return `la réponse « ${text} »`
  },
  unnamed: 'une réponse sans texte',
  clipboard:
    'Multifus colle le texte, c’est vous qui appuyez sur Entrée. Le temps du collage, il emprunte votre presse-papiers, puis vous le rend.'
} as const

export const SHORTCUTS_STRINGS = {
  shortcuts: {
    title: 'Raccourcis',
    subtitle:
      'Changez de personnage sans lâcher la souris. Ces touches ne répondent que quand Dofus Retro est devant vous.',
    silent:
      'Un autre logiciel peut déjà utiliser les mêmes touches. Multifus les accepte, mais rien ne se passera dans le jeu. En cas de doute, essayez le raccourci depuis Dofus Retro et regardez le journal, en bas.',
    defaults: 'Remettre les touches d’origine',
    capture: 'Appuyez sur vos touches',
    captureHint: 'Échap pour annuler, Retour arrière pour effacer.',
    empty: 'Aucune',
    undo: 'Remettre',
    undoNone: 'Remettre : aucune touche',
    undoLabel: (label: string) => {
      return `Remettre les touches d’avant pour ${label}`
    },
    edit: (label: string) => {
      return `Modifier le raccourci ${label}`
    },
    status: STATUS_LINES,
    rejected: REJECTION_LINES,
    actions: ACTION_LABELS,
    quickReplies: QUICK_REPLIES_STRINGS
  }
} as const
