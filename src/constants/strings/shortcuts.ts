/**
 * The words of the Raccourcis screen, the four actions included.
 *
 * Written for someone who wants to play Dofus and nothing else: no « posé sur le
 * système », no « inerte », and the word for a thing is the one the game uses.
 */

import type { ShortcutAction, ShortcutStatus } from '@/@types/shortcuts'
import type { CaptureRejection } from '@/constants/keyboard'

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

/** What became of a combination, one line per answer it can get. */
const STATUS_LINES = {
  pending: 'Un instant, multifus s’en occupe.',
  // Worded for the two families: this line sits under an action as under a
  // quick reply, and neither has a gender the other shares.
  unbound: 'Aucune touche choisie, il ne se passera rien.',
  registered: 'C’est bon, le raccourci est en place.',
  invalid: 'Ces touches ne peuvent pas servir de raccourci.',
  refused: 'Refusé, une autre application utilise déjà ces touches.',
  // The label carries its own quotes: it names either an action or a quick reply,
  // and a quick reply is named by its text, which is quoted already.
  duplicate: (label: string) => {
    return `Déjà pris par ${label}, donc celui-ci ne fera rien.`
  }
} as const satisfies Record<
  ShortcutStatus['kind'],
  string | ((label: string) => string)
>

/** Why the capture turned a key press down, one line per reason it can give. */
const REJECTION_LINES = {
  noModifier:
    'Gardez Ctrl, Alt ou Maj enfoncé en même temps, sinon cette touche serait prise dans toutes vos applications.',
  unsupportedKey: 'Cette touche ne peut pas servir de raccourci.',
  pasteCombination:
    'C’est déjà le raccourci pour coller, sur votre ordinateur. Prenez-en un autre.'
} as const satisfies Record<CaptureRejection, string>

/** The words of the quick replies panel, second half of this screen. */
const QUICK_REPLIES_STRINGS = {
  title: 'Réponses rapides',
  // The one place the feature is explained, so it says what it is in the words
  // of somebody who plays: a copier-coller, and where it lands in the game.
  description:
    'Un copier-coller tout prêt. Le raccourci colle votre réponse là où vous êtes en train d’écrire dans Dofus, le chat comme un message privé. Il colle seulement, c’est vous qui appuyez sur Entrée pour envoyer.',
  add: 'Ajouter une réponse',
  empty:
    'Aucune réponse pour le moment. Ajoutez-en une pour ce que vous retapez tout le temps.',
  placeholder: 'Merci, bon jeu !',
  textLabel: 'Texte de la réponse',
  remove: 'Retirer cette réponse',
  edit: 'Modifier le raccourci de cette réponse',
  // What a quick reply is called when something else has to name it, a doublon
  // on the line below its neighbour for instance.
  named: (text: string) => {
    return `la réponse « ${text} »`
  },
  unnamed: 'une réponse sans texte',
  // What the giving back cannot do, and the screen is the only place to say it:
  // the journal is read after the fact, this is read before.
  clipboard:
    'Le temps du collage, multifus se sert de votre presse-papiers, puis vous le rend. Une image ou un fichier que vous y aviez copié, lui, ne revient pas.'
} as const

export const SHORTCUTS_STRINGS = {
  shortcuts: {
    title: 'Raccourcis',
    subtitle:
      'Ces raccourcis ne répondent que lorsque Dofus est devant vous. Ailleurs, ils ne font rien.',
    // A combination the system accepts is not one that fires, and this note is
    // the only place the interface can say so. See `docs/macos.md`, « Ce qui mord ».
    silent:
      'Une autre application peut déjà utiliser les mêmes touches. multifus les accepte quand même, mais ne les recevra jamais, et rien ne se passera dans le jeu. En cas de doute, essayez le raccourci depuis Dofus et regardez le journal, en bas.',
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
