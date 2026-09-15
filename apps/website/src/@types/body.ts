import type { MessageDescriptor } from '@lingui/core'
import type { Icon } from '@phosphor-icons/react'

export type Point = Readonly<{
  lead: MessageDescriptor
  line: MessageDescriptor
}>

export type Boon = Readonly<{
  icon: Icon
  title: MessageDescriptor
  line: MessageDescriptor
}>

export type RuleTone = 'banned' | 'kept'

export type Rule = Readonly<{
  tone: RuleTone
  icon: Icon
  title: MessageDescriptor
  lines: readonly MessageDescriptor[]
  verdict: MessageDescriptor
}>

export type Body = Readonly<{
  lead: MessageDescriptor
  boons: readonly Boon[]
  caveats: readonly MessageDescriptor[]
}>
