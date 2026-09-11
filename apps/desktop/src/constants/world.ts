import { msg } from '@lingui/core/macro'
import battle from '@multifus/ankama/images/battle.webp'
import camp from '@multifus/ankama/images/camp.webp'
import dolmen from '@multifus/ankama/images/dolmen.webp'
import forest from '@multifus/ankama/images/forest.webp'
import harbour from '@multifus/ankama/images/harbour.webp'
import pen from '@multifus/ankama/images/pen.webp'
import village from '@multifus/ankama/images/village.webp'
import workshop from '@multifus/ankama/images/workshop.webp'
import type { ScreenName } from '@/@types/snapshot'
import type { Phrase } from '@/lib/i18n'

export const SCREEN_SCENE = battle

export const CLEARING = 'clearing'

export type MapName = ScreenName | typeof CLEARING

export const MAPS = [
  'characters',
  'shortcuts',
  'quickReplies',
  'autoFocus',
  'walk',
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
  runeTable: msg`Tableau des runes`,
  relay: msg`Messages privés`,
  settings: msg`Paramètres`,
  about: msg`À propos`
} as const satisfies Record<MapName, Phrase>
