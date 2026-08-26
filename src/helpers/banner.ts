import type { BannerScreen } from '@/@types/walk'
import { BANNER_SIZE, MONITOR_SIZE, WIDESCREEN } from '@/constants/banner'

export const screenOf = (
  screens: readonly BannerScreen[],
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

export const monitorShape = (screen: BannerScreen | null) => {
  const { width, height } = screen ?? WIDESCREEN
  const ratio = width / height
  const drawnWidth = Math.min(MONITOR_SIZE.width, MONITOR_SIZE.height * ratio)
  const scaled = (BANNER_SIZE.width * drawnWidth) / width
  const bannerWidth = Math.max(BANNER_SIZE.smallestDrawn, scaled)

  return {
    ratio,
    drawnWidth,
    bannerWidth,
    bannerHeight: (bannerWidth * BANNER_SIZE.height) / BANNER_SIZE.width
  }
}
