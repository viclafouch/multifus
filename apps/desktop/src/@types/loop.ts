export type LoopsSeen = {
  readonly wheel: boolean
  readonly walk: boolean
  readonly runeTable: boolean
  readonly autoFocus: boolean
}

export type LoopName = keyof LoopsSeen
