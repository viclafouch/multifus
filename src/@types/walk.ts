export type WalkFrom = 'listeningLost' | 'shortcut' | 'tray' | 'window'

export type WalkIdle = 'nobodyInCycle' | 'tooSlow'

export type WalkMeasure = {
  readonly milliseconds: number
  readonly landed: boolean
}

export type WalkStatus = {
  readonly enabled: boolean
  readonly supported: boolean
  readonly budget: number
  readonly ceiling: number
  readonly measures: readonly WalkMeasure[]
}
