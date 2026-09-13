import { inkedWith, OG_INK } from '@/og/ink'

const svgUrl = (markup: string) => {
  return `url("data:image/svg+xml,${encodeURIComponent(markup)}")`
}

export const GRAIN = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.5"/></svg>`
)

export const SCRIM = `linear-gradient(94deg, ${inkedWith(OG_INK.iron, 0.97)} 0%, ${inkedWith(OG_INK.iron, 0.95)} 38%, ${inkedWith(OG_INK.iron, 0.66)} 58%, ${inkedWith(OG_INK.iron, 0.24)} 80%, ${inkedWith(OG_INK.iron, 0.14)} 100%)`

export const FLOOR = `linear-gradient(180deg, ${inkedWith(OG_INK.iron, 0.62)} 0%, ${inkedWith(OG_INK.iron, 0.2)} 16%, transparent 30%, transparent 54%, ${inkedWith(OG_INK.iron, 0.46)} 76%, ${inkedWith(OG_INK.iron, 0.92)} 100%)`

export const THREAD = `linear-gradient(90deg, ${OG_INK.leafLit} 0%, ${inkedWith(OG_INK.leaf, 0.38)} 38%, transparent 100%)`

export const LIMELIGHT = [
  `0 2px 0 ${inkedWith(OG_INK.iron, 0.6)}`,
  '0 1px 4px rgb(0 0 0 / 0.95)',
  '0 4px 22px rgb(0 0 0 / 0.8)'
].join(', ')

export const ENGRAVE = '0 1px 2px rgb(0 0 0 / 0.65)'

export const SHEET = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
} as const
