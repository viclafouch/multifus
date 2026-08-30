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

export const monitorShape = (screen: Display | null) => {
  const { width, ratio, drawnWidth } = screenShape(screen)
  const scaled = (BANNER_SIZE.width * drawnWidth) / width
  const bannerWidth = Math.max(BANNER_SIZE.smallestDrawn, scaled)

  return {
    ratio,
    drawnWidth,
    bannerWidth,
    bannerHeight: (bannerWidth * BANNER_SIZE.height) / BANNER_SIZE.width
  }
}
