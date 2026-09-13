import type { RenderOptions } from 'takumi-js'

type OgImage = Readonly<{
  format: NonNullable<RenderOptions['format']>
  quality: number
  extension: string
  type: string
}>

export const OG_DIR = 'og'

export const OG_WIDTH = 1200

export const OG_HEIGHT = 630

export const OG_IMAGE = {
  format: 'webp',
  quality: 92,
  extension: 'webp',
  type: 'image/webp'
} as const satisfies OgImage
