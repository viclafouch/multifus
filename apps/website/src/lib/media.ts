import type { Shot } from '@/@types/media'

export const STILL = '(prefers-reduced-motion: reduce)'

export const HOVER = '(hover: hover) and (pointer: fine)'

export const PAIR_FLOOR = '40rem'

export const WIDE_FLOOR = '64rem'

export const WIDE = `(width >= ${WIDE_FLOOR})`

export const UPRIGHT = '(max-aspect-ratio: 3/5) and (max-width: 36rem)'

export const GUTTER = '2rem'

const HALF_PAGE = `calc(50vw - 1.5rem)`

const FULL_PAGE = `calc(100vw - ${GUTTER})`

export const MOSAIC_SIZES = [
  `(min-width: ${WIDE_FLOOR}) 23rem`,
  `(min-width: ${PAIR_FLOOR}) ${HALF_PAGE}`,
  FULL_PAGE
].join(', ')

export const ENTRANCE_SIZES = [
  `(min-width: ${WIDE_FLOOR}) 40rem`,
  FULL_PAGE
].join(', ')

export const STAGE_SIZES = [`(min-width: ${WIDE_FLOOR}) 70rem`, FULL_PAGE].join(
  ', '
)

export const PAIR_SIZES = [
  `(min-width: ${WIDE_FLOOR}) 34rem`,
  `(min-width: ${PAIR_FLOOR}) ${HALF_PAGE}`,
  FULL_PAGE
].join(', ')

export const sourcesOf = ({ full, small }: Shot) => {
  return `${small.src} ${small.width}w, ${full.src} ${full.width}w`
}
