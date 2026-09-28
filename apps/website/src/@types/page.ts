import type { Language } from './language'
import type { Shot, Size } from './media'

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

export type Loop = Readonly<{
  source: string
  size: Size
  poster: Shot
  seconds: number
  filmed: string
}>

export type Trailer = Pick<Loop, 'seconds'> &
  Readonly<{
    id: string
    posters: Record<Language, Shot>
    uploaded: string
    spoken: Language
  }>

export type Page = Readonly<{
  kind: PageKind
  slugs: Readonly<Record<Language, string>>
  loop: FeatureId | null
  kin: readonly FeatureId[]
}>
