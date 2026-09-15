import type { Picture } from './media'

export type AnkamaWordId = 'forum' | 'post'

export type AnkamaWord = Readonly<{
  shot: Picture
  quote: string
  href: string
}>
