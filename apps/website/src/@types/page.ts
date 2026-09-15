import type { Language } from './language'
import type { Size } from './media'

export type PageId =
  | 'ankama'
  | 'autoFocus'
  | 'comparison'
  | 'download'
  | 'home'
  | 'journal'
  | 'legal'
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
  | 'legal'
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
  size: Size
  poster: string
  seconds: number
  filmed: string
}>

export type LoopToggleProps = Readonly<{
  isPlaying: boolean
  onToggle: () => void
}>

export type Page = Readonly<{
  kind: PageKind
  slugs: Readonly<Record<Language, string>>
  loop: LoopId | null
  kin: readonly FeatureId[]
}>
