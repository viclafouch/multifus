import type { ScreenName } from '@/@types/snapshot'

const SCREEN_LABELS = {
  characters: 'Personnages',
  shortcuts: 'Raccourcis',
  autoFocus: 'AutoFocus',
  walk: 'Déplacement rapide',
  relay: 'Messages privés',
  settings: 'Paramètres',
  about: 'À propos'
} as const satisfies Record<ScreenName, string>

export const NAV_RAIL_STRINGS = {
  app: {
    name: 'Multifus'
  },

  nav: SCREEN_LABELS,

  status: {
    connected: (count: number) => {
      return count === 1
        ? '1 personnage connecté'
        : `${count} personnages connectés`
    },
    listening: 'À l’écoute du jeu',
    notListening: 'Écoute interrompue',
    denied: 'Autorisation manquante'
  }
} as const
