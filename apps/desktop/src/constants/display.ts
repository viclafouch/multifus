import type { Display } from '@/@types/display'

type ScreenBox = Pick<Display, 'height' | 'width'>

export const DRAWN_SCREEN = {
  width: 420,
  height: 238
} as const satisfies ScreenBox

export const WIDESCREEN = {
  width: 1920,
  height: 1080
} as const satisfies ScreenBox
