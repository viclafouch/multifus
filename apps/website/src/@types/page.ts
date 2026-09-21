import type { Language } from './language'
import type { Size } from './media'

export type PageId =
  | 'ankama'
  | 'autoFocus'
  | 'comparison'
  | 'download'
  | 'faq'
  | 'home'
  | 'journal'
  | 'legal'
  | 'mac'
  | 'quickTexts'
  | 'relay'
  | 'runeTable'
  | 'walk'
  | 'wheel'
  | 'windows'

export type PageKind =
  | 'ankama'
  | 'comparison'
  | 'download'
  | 'faq'
  | 'feature'
  | 'home'
  | 'journal'
  | 'legal'
  | 'mac'
  | 'plain'
  | 'windows'

export type FeatureId =
  | 'autoFocus'
  | 'quickTexts'
  | 'relay'
  | 'runeTable'
  | 'walk'
  | 'wheel'

export type LoopId = FeatureId | 'home'

export type Loop = Readonly<{
  source: string
  size: Size
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
