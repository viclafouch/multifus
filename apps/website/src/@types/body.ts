import type { MessageDescriptor } from '@lingui/core'

export type Passage = Readonly<{
  title: MessageDescriptor
  lines: readonly MessageDescriptor[]
}>

export type Body = Readonly<{
  lead: MessageDescriptor
  passages: readonly Passage[]
  limit: Passage
}>
