export type LoopsSeen = {
  readonly wheel: boolean
  readonly walk: boolean
  readonly runeTable: boolean
}

export type LoopName = keyof LoopsSeen
