export type Size = Readonly<{
  width: number
  height: number
}>

export type Picture = Size &
  Readonly<{
    src: string
  }>

export type Shot = Readonly<{
  full: Picture
  small: Picture
}>
