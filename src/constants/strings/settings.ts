import { IS_APPLE } from '@/constants/keyboard'

export const SETTINGS_STRINGS = {
  settings: {
    title: 'Paramètres',
    subtitle: 'Ce que Multifus fait tout seul pendant que vous jouez.',
    startupLabel: 'Lancer Multifus avec l’ordinateur',
    startupDescription:
      'Multifus est déjà là quand vous ouvrez vos clients Dofus Retro.',
    startupNote: IS_APPLE
      ? 'La croix ne quitte pas Multifus : il continue son travail derrière son icône, en haut à droite de l’écran. C’est de là qu’on le quitte.'
      : 'La croix ne quitte pas Multifus : il continue son travail derrière son icône, à côté de l’horloge. C’est de là qu’on le quitte.',
    maximizeLabel: 'Fenêtres Dofus Retro en plein écran',
    maximizeDescription:
      'Un client Dofus Retro s’ouvre toujours en petit. Multifus le met en plein écran.',
    shortTitlesLabel: 'Seulement le pseudo dans la barre des tâches',
    shortTitlesDescription:
      'Vous lisez « Elyandra » au lieu de « Elyandra - Dofus Retro ». Six clients ouverts, six pseudos d’un coup d’œil.',
    shortTitlesWindowsOnly: 'Windows uniquement'
  }
} as const
