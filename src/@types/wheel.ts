import type { Class, Gender } from '@/@types/roster'

export type WheelSize = {
  readonly diameter: number
  readonly smallest: number
  readonly widest: number
  readonly step: number
  readonly deadZone: number
  readonly demo: readonly WheelSlice[]
}

export type WheelSlice = {
  readonly nickname: string
  readonly class: Class | null
  readonly gender: Gender | null
  readonly main: boolean
  readonly here: boolean
}

export type WheelStep = {
  readonly diameter: number
  readonly deadZone: number
  readonly slices: readonly WheelSlice[]
  readonly hovered: number | null
  readonly previewing: boolean
}
