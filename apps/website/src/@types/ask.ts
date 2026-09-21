import type { MessageDescriptor } from '@lingui/core'
import type { PageId } from '@/@types/page'

export type AskId =
  | 'allowed'
  | 'count'
  | 'eleven'
  | 'free'
  | 'inside'
  | 'machine'
  | 'macAccess'
  | 'macFloor'
  | 'modern'
  | 'money'
  | 'monterey'
  | 'parity'
  | 'risk'
  | 'safe'
  | 'seven'
  | 'tongue'
  | 'windowsAccess'

export type AskMark =
  | Readonly<{ kind: 'stress' }>
  | Readonly<{ kind: 'page'; page: PageId }>
  | Readonly<{ kind: 'out'; href: string }>

export type AskLine = Readonly<{
  said: MessageDescriptor
  marks?: readonly AskMark[]
}>

export type Ask = Readonly<{
  ask: MessageDescriptor
  answer: readonly AskLine[]
}>
