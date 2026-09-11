import type { MessageDescriptor } from '@lingui/core'

export type ProvenanceId =
  | 'decors'
  | 'loops'
  | 'options'
  | 'portraits'
  | 'posters'
  | 'tolerance'

export type Provenance = Readonly<{
  name: MessageDescriptor
  origin: MessageDescriptor
}>
