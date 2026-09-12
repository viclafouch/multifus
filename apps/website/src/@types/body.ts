import type { MessageDescriptor } from '@lingui/core'

export type Point = Readonly<{
  lead: MessageDescriptor
  line: MessageDescriptor
}>

export type Passage = Readonly<{
  title: MessageDescriptor
  points: readonly Point[]
}>

export type Body = Readonly<{
  lead: MessageDescriptor
  passages: readonly Passage[]
  limit: Passage
}>
