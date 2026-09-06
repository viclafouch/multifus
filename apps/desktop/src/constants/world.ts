import { msg } from '@lingui/core/macro'
import type { ScreenName } from '@/@types/snapshot'
import arena from '@/assets/ankama/arena.webp'
import battle from '@/assets/ankama/battle.webp'
import camp from '@/assets/ankama/camp.webp'
import dolmen from '@/assets/ankama/dolmen.webp'
import forest from '@/assets/ankama/forest.webp'
import harbour from '@/assets/ankama/harbour.webp'
import pen from '@/assets/ankama/pen.webp'
import village from '@/assets/ankama/village.webp'
import workshop from '@/assets/ankama/workshop.webp'
import type { Phrase } from '@/lib/i18n'

export const CLEARING = 'clearing'

export type MapName = ScreenName | typeof CLEARING

export const MAPS = [
  'characters',
  'shortcuts',
  'quickReplies',
  'autoFocus',
  'walk',
  'wheel',
  'runeTable',
  'relay',
  'settings',
  'about'
] as const satisfies readonly ScreenName[]

export const MAP_SCENES = {
  clearing: dolmen,
  characters: camp,
  shortcuts: village,
  quickReplies: harbour,
  autoFocus: battle,
  walk: forest,
  wheel: arena,
  runeTable: workshop,
  relay: pen,
  settings: workshop,
  about: village
} as const satisfies Record<MapName, string>

export const MAP_NAMES = {
  clearing: msg`Multifus`,
  characters: msg`Personnages`,
  shortcuts: msg`Raccourcis`,
  quickReplies: msg`Réponses rapides`,
  autoFocus: msg`AutoFocus`,
  walk: msg`Déplacement rapide`,
  wheel: msg`Roue des personnages`,
  runeTable: msg`Tableau des runes`,
  relay: msg`Messages privés`,
  settings: msg`Paramètres`,
  about: msg`À propos`
} as const satisfies Record<MapName, Phrase>
