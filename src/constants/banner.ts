import type { BannerCorner } from '@/@types/walk'

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
