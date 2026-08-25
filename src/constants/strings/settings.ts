/** The words of the Paramètres screen: what Multifus does without being asked. */

import { IS_APPLE } from '@/constants/keyboard'

export const SETTINGS_STRINGS = {
  settings: {
    title: 'Paramètres',
    subtitle: 'Ce que Multifus fait tout seul, une fois réglé.',
    startupLabel: 'Démarrer avec la session',
    startupDescription:
      'Multifus s’ouvre en même temps que votre session, pour n’avoir à y penser qu’une fois.',
    startupNote: IS_APPLE
      ? 'Fermer la fenêtre ne quitte plus Multifus : il continue dans la barre système, en haut à droite de l’écran, et c’est de là qu’on le quitte.'
      : 'Fermer la fenêtre ne quitte plus Multifus : il continue dans la barre système, à côté de l’horloge, et c’est de là qu’on le quitte.',
    maximizeLabel: 'Agrandir les fenêtres au lancement',
    maximizeDescription:
      'Un client qui s’ouvre remplit l’écran, une seule fois : le réduire ensuite le laisse réduit. Les fenêtres déjà ouvertes ne bougent pas.'
  }
} as const
