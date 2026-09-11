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

export type PageKind = 'download' | 'feature' | 'home' | 'plain'

export type LoopId = 'autoFocus' | 'runeTable' | 'walk' | 'wheel'

export type Page = Readonly<{
  kind: PageKind
  slugs: Readonly<Record<Language, string>>
  loop: LoopId | null
}>
