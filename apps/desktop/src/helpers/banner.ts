import type { Display } from '@/@types/display'
import { BANNER_SIZE } from '@/constants/banner'
import { screenShape } from '@/helpers/display'

export const screenOf = (
  screens: readonly Display[],
  wanted: string | null
) => {
  const named = screens.find((screen) => {
    return wanted !== null && screen.name === wanted
  })

  const primary = screens.find((screen) => {
    return screen.primary
  })

  return named ?? primary ?? screens.at(0) ?? null
}

type MonitorShapeParams = {
  readonly screen: Display | null
  readonly boxWidth: number
}

export const monitorShape = ({ screen, boxWidth }: MonitorShapeParams) => {
  const { width, ratio, drawnWidth } = screenShape(screen)
  const drawn = boxWidth > 0 ? boxWidth : drawnWidth
  const scaled = (BANNER_SIZE.width * drawn) / width
  const bannerWidth = Math.max(BANNER_SIZE.smallestDrawn, scaled)

  return {
    ratio,
    bannerWidth,
    bannerHeight: (bannerWidth * BANNER_SIZE.height) / BANNER_SIZE.width
  }
}
