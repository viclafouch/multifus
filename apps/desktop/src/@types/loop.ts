import type { Phrase } from '@/lib/i18n'

export type LoopsSeen = {
  readonly wheel: boolean
  readonly walk: boolean
  readonly runeTable: boolean
  readonly autoFocus: boolean
}

export type LoopName = keyof LoopsSeen

export type Loop = {
  readonly name: LoopName
  readonly source: string
  readonly title: Phrase
  readonly description: Phrase
  readonly caption: Phrase
}
