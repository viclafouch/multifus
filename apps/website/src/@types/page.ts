import type { Language } from './language'

export type PageId =
  | 'autoFocus'
  | 'comparison'
  | 'download'
  | 'home'
  | 'images'
  | 'journal'
  | 'mac'
  | 'quickReplies'
  | 'relay'
  | 'runeTable'
  | 'runeWeights'
  | 'shortcuts'
  | 'walk'
  | 'wheel'

export type PageKind = 'comparison' | 'download' | 'feature' | 'home' | 'plain'

export type LoopId = 'autoFocus' | 'runeTable' | 'walk' | 'wheel'

export type Loop = Readonly<{
  source: string
  poster: string
  seconds: number
  filmed: string
}>

export type Page = Readonly<{
  kind: PageKind
  slugs: Readonly<Record<Language, string>>
  loop: LoopId | null
  kin: readonly PageId[]
}>
