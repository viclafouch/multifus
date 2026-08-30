import type { ScreenName } from '@/@types/snapshot'
import { RUNE_TABLE_TITLE } from '@/constants/strings/rune-table'
import { matchIsPlural } from '@/helpers/format'

const SCREEN_LABELS = {
  characters: 'Personnages',
  shortcuts: 'Raccourcis',
  quickReplies: 'Réponses rapides',
  autoFocus: 'AutoFocus',
  walk: 'Déplacement rapide',
  wheel: 'Roue des personnages',
  runeTable: RUNE_TABLE_TITLE,
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
      return matchIsPlural(count)
        ? `${count} personnages connectés`
        : `${count} personnage connecté`
    },
    listening: 'À l’écoute du jeu',
    notListening: 'Écoute interrompue',
    denied: 'Autorisation manquante'
  }
} as const
