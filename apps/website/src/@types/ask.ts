import type { MessageDescriptor } from '@lingui/core'

export type AskId =
  | 'allowed'
  | 'count'
  | 'eleven'
  | 'free'
  | 'machine'
  | 'macAccess'
  | 'macFloor'
  | 'modern'
  | 'monterey'
  | 'risk'
  | 'safe'
  | 'seven'
  | 'windowsAccess'

export type Ask = Readonly<{
  ask: MessageDescriptor
  answer: readonly MessageDescriptor[]
}>
