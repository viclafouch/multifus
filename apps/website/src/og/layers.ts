import {
  dataUrlOf,
  inkedWith,
  limelightOf,
  threadOf
} from '@multifus/retro/draw'
import { INK } from '@/constants/ink'

const svgUrl = (markup: string) => {
  return `url("${dataUrlOf(markup)}")`
}

export const GRAIN = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.5"/></svg>`
)

export const SCRIM = `linear-gradient(94deg, ${inkedWith(INK.iron, 0.97)} 0%, ${inkedWith(INK.iron, 0.95)} 38%, ${inkedWith(INK.iron, 0.66)} 58%, ${inkedWith(INK.iron, 0.24)} 80%, ${inkedWith(INK.iron, 0.14)} 100%)`

export const FLOOR = `linear-gradient(180deg, ${inkedWith(INK.iron, 0.62)} 0%, ${inkedWith(INK.iron, 0.2)} 16%, transparent 30%, transparent 54%, ${inkedWith(INK.iron, 0.46)} 76%, ${inkedWith(INK.iron, 0.92)} 100%)`

export const THREAD = threadOf(INK)

export const LIMELIGHT = limelightOf(INK.iron)

export const ENGRAVE = '0 1px 2px rgb(0 0 0 / 0.65)'

export const SHEET = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
} as const
