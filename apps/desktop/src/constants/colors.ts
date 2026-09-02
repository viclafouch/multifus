import type { Color } from '@/@types/roster'

export const COLORS = [
  'red',
  'orange',
  'earth',
  'yellow',
  'green',
  'pine',
  'turquoise',
  'sky',
  'blue',
  'lavender',
  'violet',
  'pink'
] as const satisfies readonly Color[]

export const COLOR_TINTS = {
  red: 'tint-red',
  orange: 'tint-orange',
  earth: 'tint-earth',
  yellow: 'tint-yellow',
  green: 'tint-green',
  pine: 'tint-pine',
  turquoise: 'tint-turquoise',
  sky: 'tint-sky',
  blue: 'tint-blue',
  lavender: 'tint-lavender',
  violet: 'tint-violet',
  pink: 'tint-pink'
} as const satisfies Record<Color, `tint-${Color}`>
