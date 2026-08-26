import { IS_APPLE } from '@/constants/keyboard'

export const SETTINGS_STRINGS = {
  settings: {
    title: 'Paramètres',
    subtitle: 'Ce que Multifus fait tout seul pendant que vous jouez.',
    startupLabel: 'Lancer Multifus au démarrage de l’ordinateur',
    startupDescription:
      'Multifus est déjà là quand vous ouvrez vos clients Dofus Retro.',
    backgroundLabel: 'Garder Multifus en arrière-plan',
    backgroundDescription: IS_APPLE
      ? 'La croix ne quitte pas Multifus : son icône reste en haut à droite de l’écran.'
      : 'La croix ne quitte pas Multifus : son icône reste à côté de l’horloge.',
    backgroundLocked: 'Multifus doit rester en arrière-plan pour fonctionner.',
    maximizeLabel: 'Ouvrir les fenêtres Dofus Retro en plein écran',
    maximizeDescription:
      'Un client Dofus Retro s’ouvre toujours en petit. Multifus le met en plein écran.',
    shortTitlesLabel: 'Seulement le pseudo dans la barre des tâches',
    shortTitlesDescription:
      'Vous lisez « Elyandra » au lieu de « Elyandra - Dofus Retro ».',
    shortTitlesWindowsOnly: 'Windows uniquement'
  }
} as const
