import type { ShortcutAction, ShortcutStatus } from '@/@types/shortcuts'
import type { CaptureRejection } from '@/constants/keyboard'

const ACTION_LABELS = {
  next: {
    label: 'Suivant',
    description: 'Passe au personnage suivant, en sautant ceux en veille.'
  },
  previous: {
    label: 'Précédent',
    description: 'Passe au personnage précédent, en sautant ceux en veille.'
  },
  toggleAsleep: {
    label: 'Veille',
    description: 'Endort ou réveille le personnage que vous avez devant vous.'
  },
  swap: {
    label: 'Bascule',
    description: 'Endort un sexe et réveille l’autre, d’un seul coup.'
  }
} as const satisfies Record<
  ShortcutAction,
  { readonly label: string; readonly description: string }
>

const STATUS_LINES = {
  pending: 'Un instant, Multifus s’en occupe.',
  unbound: 'Aucune touche choisie, il ne se passera rien.',
  registered: 'C’est bon, le raccourci est en place.',
  invalid: 'Ces touches ne peuvent pas servir de raccourci.',
  refused: 'Refusé, une autre application utilise déjà ces touches.',
  duplicate: (label: string) => {
    return `Déjà pris par ${label}, donc celui-ci ne fera rien.`
  }
} as const satisfies Record<
  ShortcutStatus['kind'],
  string | ((label: string) => string)
>

const REJECTION_LINES = {
  noModifier:
    'Gardez Ctrl, Alt ou Maj enfoncé en même temps, sinon cette touche serait prise dans toutes vos applications.',
  unsupportedKey: 'Cette touche ne peut pas servir de raccourci.',
  pasteCombination:
    'C’est déjà le raccourci pour coller, sur votre ordinateur. Prenez-en un autre.'
} as const satisfies Record<CaptureRejection, string>

const QUICK_REPLIES_STRINGS = {
  title: 'Réponses rapides',
  description:
    'Un copier-coller tout prêt. Le raccourci colle votre réponse là où vous êtes en train d’écrire dans Dofus, le chat comme un message privé. Il colle seulement, c’est vous qui appuyez sur Entrée pour envoyer.',
  add: 'Ajouter une réponse',
  empty:
    'Aucune réponse pour le moment. Ajoutez-en une pour ce que vous retapez tout le temps.',
  placeholder: 'Merci, bon jeu !',
  textLabel: 'Texte de la réponse',
  remove: 'Retirer cette réponse',
  edit: 'Modifier le raccourci de cette réponse',
  named: (text: string) => {
    return `la réponse « ${text} »`
  },
  unnamed: 'une réponse sans texte',
  clipboard:
    'Le temps du collage, Multifus se sert de votre presse-papiers, puis vous le rend. Une image ou un fichier que vous y aviez copié, lui, ne revient pas.'
} as const

export const SHORTCUTS_STRINGS = {
  shortcuts: {
    title: 'Raccourcis',
    subtitle:
      'Ces raccourcis ne répondent que lorsque Dofus est devant vous. Ailleurs, ils ne font rien.',
    silent:
      'Une autre application peut déjà utiliser les mêmes touches. Multifus les accepte quand même, mais ne les recevra jamais, et rien ne se passera dans le jeu. En cas de doute, essayez le raccourci depuis Dofus et regardez le journal, en bas.',
    capture: 'Appuyez sur vos touches',
    captureHint: 'Échap pour annuler, Retour arrière pour effacer.',
    empty: 'Aucune',
    edit: (label: string) => {
      return `Modifier le raccourci ${label}`
    },
    status: STATUS_LINES,
    rejected: REJECTION_LINES,
    actions: ACTION_LABELS,
    quickReplies: QUICK_REPLIES_STRINGS
  }
} as const
