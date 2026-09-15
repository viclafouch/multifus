import type { MessageDescriptor } from '@lingui/core'
import type { Icon } from '@phosphor-icons/react'
import type { Picture } from './media'

export type AnkamaSourceId = 'forum' | 'post'

export type AnkamaSource = Readonly<{
  icon: Icon
  name: MessageDescriptor
  date: MessageDescriptor
  alt: MessageDescriptor
  quote: string
  shot: Picture
  href: string
}>
