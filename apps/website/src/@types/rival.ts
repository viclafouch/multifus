import type { MessageDescriptor } from '@lingui/core'

export type RivalId =
  | 'dosoft'
  | 'dracoon'
  | 'focusRetro'
  | 'retroToolbox'
  | 'rorganizer'

export type Rival = Readonly<{
  name: string
  code: string
}>

export type Mark = 'half' | 'no' | 'yes'

export type TraitId =
  | 'autoFocus'
  | 'macos'
  | 'quickReplies'
  | 'relay'
  | 'runeTable'
  | 'signed'
  | 'source'
  | 'split'
  | 'teams'
  | 'walk'
  | 'wheel'
  | 'windows'

export type Trait = Readonly<{
  mine: Mark
  theirs: Readonly<Record<RivalId, Mark>>
}>

export type HalfNote = Readonly<{
  trait: TraitId
  rival: RivalId
  line: MessageDescriptor
}>
