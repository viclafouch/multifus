import type { MessageDescriptor } from '@lingui/core'
import type { Picture } from './media'

export type SummonsShape = 'center' | 'split' | 'stack'

export type Summons = Readonly<{
  decor: Picture
  shape: SummonsShape
  title: MessageDescriptor
  line: MessageDescriptor
}>
