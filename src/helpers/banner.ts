import type { BannerScreen } from '@/@types/walk'

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
