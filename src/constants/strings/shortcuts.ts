/** The words of the Raccourcis screen, the four actions included. */

import type { ShortcutAction, ShortcutStatus } from '@/@types/shortcuts'
import type { CaptureRejection } from '@/lib/accelerator'

/** A fifth action of perimetre.md fails to compile here, and not in the screen. */
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
    description: 'Endort ou réveille le personnage au premier plan.'
  },
  swap: {
    label: 'Bascule',
    description: 'Endort un sexe et réveille l’autre, d’un seul coup.'
  }
} as const satisfies Record<
  ShortcutAction,
  { readonly label: string; readonly description: string }
>

/** What the system answered, one line per status it can send back. */
const STATUS_LINES = {
  pending: 'Pas encore posé sur le système.',
  unbound: 'Aucune combinaison, cette action ne répond à rien.',
  registered: 'Posé sur le système.',
  invalid: 'Le système ne sait pas lire cette combinaison.',
  refused:
    'Le système a refusé cette combinaison, sans doute déjà prise ailleurs.',
  duplicate: (label: string) => {
    return `Déjà prise par « ${label} », le système ne peut pas tenir les deux.`
  }
} as const satisfies Record<
  ShortcutStatus['kind'],
  string | ((label: string) => string)
>

/** Why the capture turned a key press down, one line per reason it can give. */
const REJECTION_LINES = {
  noModifier:
    'Il faut au moins un modificateur, sans quoi la touche serait avalée dans toutes les applications.',
  unsupportedKey: 'Cette touche ne peut pas servir de raccourci.'
} as const satisfies Record<CaptureRejection, string>

export const SHORTCUTS_STRINGS = {
  shortcuts: {
    title: 'Raccourcis',
    subtitle:
      'Ces combinaisons restent inertes tant qu’une fenêtre Dofus n’est pas au premier plan.',
    // A combination the system accepts is not one that fires, and this note is
    // the only place the interface can say so. See le plan, « Ce qui mord ».
    silent:
      'Le système accepte parfois une combinaison qu’une autre application intercepte déjà : elle est alors posée, mais n’arrive jamais jusqu’ici. En cas de doute, appuyez dessus depuis le jeu et regardez le journal.',
    capture: 'Appuyez sur une combinaison',
    captureHint: 'Échap pour annuler, Retour arrière pour effacer.',
    empty: 'Aucune',
    edit: (label: string) => {
      return `Modifier le raccourci ${label}`
    },
    status: STATUS_LINES,
    rejected: REJECTION_LINES,
    actions: ACTION_LABELS
  }
} as const
