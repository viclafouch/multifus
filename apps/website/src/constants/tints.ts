import type { Tint } from '@multifus/retro'
import type { PageId } from '@/@types/page'

export const PAGE_TINTS = {
  home: 'tint-green',
  autoFocus: 'tint-orange',
  wheel: 'tint-lavender',
  walk: 'tint-green',
  runeTable: 'tint-yellow',
  relay: 'tint-sky',
  quickReplies: 'tint-pink',
  mac: 'tint-turquoise',
  comparison: 'tint-green',
  download: 'tint-green',
  journal: 'tint-green',
  ankama: 'tint-green',
  legal: 'tint-green'
} as const satisfies Record<PageId, Tint>
