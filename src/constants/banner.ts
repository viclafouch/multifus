import type { BannerCorner } from '@/@types/walk'

export const BANNER_SIZE = {
  width: 250,
  height: 64,
  smallestDrawn: 44
} as const

export const MONITOR_SIZE = {
  width: 448,
  height: 260
} as const

export const WIDESCREEN = {
  width: 1920,
  height: 1080
} as const

type CornerPlacement = {
  readonly anchor: string
  readonly fromLeft: boolean
}

export const CORNERS = [
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight'
] as const satisfies readonly BannerCorner[]

export const CORNER_PLACEMENT = {
  topLeft: { anchor: 'items-start justify-start', fromLeft: true },
  topRight: { anchor: 'items-start justify-end', fromLeft: false },
  bottomLeft: { anchor: 'items-end justify-start', fromLeft: true },
  bottomRight: { anchor: 'items-end justify-end', fromLeft: false }
} as const satisfies Record<BannerCorner, CornerPlacement>
