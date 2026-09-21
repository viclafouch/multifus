import type { MessageDescriptor } from '@lingui/core'
import type { Icon } from '@phosphor-icons/react'

export type Signpost = Readonly<{
  href: string
  name: MessageDescriptor
  Mark: Icon
}>
