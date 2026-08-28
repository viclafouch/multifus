import type { Display } from '@/@types/display'
import { DRAWN_SCREEN, WIDESCREEN } from '@/constants/display'

export const screenShape = (screen: Display | null) => {
  const { width, height } = screen ?? WIDESCREEN
  const ratio = width / height

  return {
    width,
    ratio,
    drawnWidth: Math.min(DRAWN_SCREEN.width, DRAWN_SCREEN.height * ratio)
  }
}
