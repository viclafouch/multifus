import type { ClientsState } from '@/@types/snapshot'
import { IS_APPLE } from '@/constants/keyboard'
import { MAXIMIZE_STRINGS } from '@/constants/strings/maximize'
import { matchIsPlural } from '@/helpers/format'

const CLIENTS_BODIES = {
  small: 'Un client ouvert avant Multifus garde sa petite taille.',
  maximized: 'Vos clients Dofus Retro couvrent déjà tout leur écran.',
  none: 'Aucune fenêtre de Dofus Retro n’est ouverte en ce moment.',
  unreadable: 'Multifus ne peut pas lire les fenêtres du jeu.'
} as const satisfies Record<ClientsState, string>

const CLIENTS_BADGES = {
  small: (small: number) => {
    return matchIsPlural(small)
      ? `${small} clients en petit`
      : `${small} client en petit`
  },
  maximized: 'Tout est agrandi',
  none: 'Aucun client ouvert',
  unreadable: 'Fenêtres illisibles'
} as const satisfies Record<ClientsState, string | ((small: number) => string)>

const CLIENTS_LINES = {
  title: 'La taille de vos fenêtres Dofus Retro',
  action: MAXIMIZE_STRINGS.maximize.all,
  body: CLIENTS_BODIES,
  badge: CLIENTS_BADGES
} as const

export const SETTINGS_STRINGS = {
  settings: {
    title: 'Paramètres',
    subtitle:
      'Ce que Multifus fait pendant que vous jouez, seul ou sur demande.',
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
    clients: CLIENTS_LINES,
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
