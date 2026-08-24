/** The words of the rail: the name, the five screens, and the line under them. */

import type { ScreenName } from '@/@types/snapshot'

/** A sixth screen on the Rust side fails to compile here, and not in the rail. */
const SCREEN_LABELS = {
  characters: 'Personnages',
  shortcuts: 'Raccourcis',
  autoFocus: 'AutoFocus',
  relay: 'Relais',
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
    listening: 'À l’écoute des notifications',
    notListening: 'Écoute interrompue',
    denied: 'Autorisation manquante'
  }
} as const
