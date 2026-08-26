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
    maximizeLabel: 'Agrandir les clients à leur ouverture',
    maximizeDescription: IS_APPLE
      ? 'La fenêtre couvre l’écran, Dock et barre des menus en place.'
      : 'La fenêtre couvre l’écran, barre des tâches en place.',
    shortTitlesLabel: 'Seulement le pseudo dans la barre des tâches',
    shortTitlesDescription:
      'Vous lisez « Elyandra » au lieu de « Elyandra - Dofus Retro ».',
    windowsOnly: 'Windows',
    windowsOnlyLabel: 'Uniquement sur Windows',
    portraitLabel: 'La tête de classe dans la barre des tâches',
    portraitDescription: 'Vous repérez votre Enu à sa tête, pas à son titre.',
    ungroupLabel: 'Un bouton par personnage dans la barre des tâches',
    ungroupDescription:
      'Chaque client garde son bouton au lieu d’être empilé avec les autres.',
    ungroupAlready:
      'Déjà fait : votre Windows ne colle jamais les fenêtres ensemble.'
  }
} as const
