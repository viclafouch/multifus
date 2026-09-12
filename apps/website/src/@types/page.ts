import type { Language } from './language'

export type PageId =
  | 'ankama'
  | 'autoFocus'
  | 'comparison'
  | 'download'
  | 'home'
  | 'journal'
  | 'mac'
  | 'quickReplies'
  | 'relay'
  | 'runeTable'
  | 'walk'
  | 'wheel'

export type PageKind =
  | 'ankama'
  | 'comparison'
  | 'download'
  | 'feature'
  | 'home'
  | 'plain'

export type FeatureId =
  | 'autoFocus'
  | 'quickReplies'
  | 'relay'
  | 'runeTable'
  | 'walk'
  | 'wheel'

export type LoopId = FeatureId | 'home'

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
  kin: readonly FeatureId[]
}>
