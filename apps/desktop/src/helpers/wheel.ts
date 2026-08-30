import type { Display } from '@/@types/display'
import type { WheelSize } from '@/@types/wheel'
import {
  DIAL_RADIUS,
  DRAWN_SMALLEST,
  DRAWN_WIDEST,
  HEAD_BAND,
  HEAD_ROOM,
  HEAD_SMALLEST,
  HUB_ROOM,
  LABEL_GAP,
  LABEL_SHARE,
  LABEL_SMALLEST,
  NOBODY_SHARE,
  NOBODY_SMALLEST,
  NOBODY_WIDTH_SHARE,
  SLICE_GAP
} from '@/constants/wheel'
import { screenShape } from '@/helpers/display'

const DECIMALS = 3

const rounded = (value: number) => {
  return Number(value.toFixed(DECIMALS))
}

const pointOf = (radius: number, turn: number) => {
  const angle = turn * 2 * Math.PI

  return {
    x: rounded(radius * Math.sin(angle)),
    y: rounded(-radius * Math.cos(angle))
  }
}

const ringPath = (radius: number) => {
  const side = radius * 2

  return `M ${-radius} 0 a ${radius} ${radius} 0 1 0 ${side} 0 a ${radius} ${radius} 0 1 0 ${-side} 0 Z`
}

const gapOf = (radius: number) => {
  return SLICE_GAP / 2 / (2 * Math.PI * radius)
}

type SlicePathParams = {
  readonly index: number
  readonly count: number
  readonly inner: number
}

export const slicePath = ({ index, count, inner }: SlicePathParams) => {
  const outer = DIAL_RADIUS

  if (count <= 1) {
    return `${ringPath(outer)} ${ringPath(inner)}`
  }

  const rim = gapOf(outer)
  const hub = Math.min(gapOf(inner), 0.5 / count)
  const from = (index - 0.5) / count
  const to = (index + 0.5) / count
  const start = pointOf(outer, from + rim)
  const end = pointOf(outer, to - rim)
  const back = pointOf(inner, to - hub)
  const close = pointOf(inner, from + hub)

  return [
    `M ${start.x} ${start.y}`,
    `A ${outer} ${outer} 0 0 1 ${end.x} ${end.y}`,
    `L ${back.x} ${back.y}`,
    `A ${inner} ${inner} 0 0 0 ${close.x} ${close.y}`,
    'Z'
  ].join(' ')
}

type HeadPlaceParams = {
  readonly index: number
  readonly count: number
  readonly ring: number
}

export const headPlace = ({ index, count, ring }: HeadPlaceParams) => {
  return pointOf(ring, index / count)
}

type DialShapeParams = {
  readonly diameter: number
  readonly deadZone: number
  readonly count: number
}

export const dialShape = ({ diameter, deadZone, count }: DialShapeParams) => {
  const radius = diameter / 2
  const middle = radius * deadZone
  const ring = (radius + middle) / 2
  const band = radius - middle
  const chord = count <= 1 ? radius : 2 * ring * Math.sin(Math.PI / count)
  const column = (band * HEAD_BAND) / (1 + LABEL_GAP + LABEL_SHARE)
  const head = Math.max(HEAD_SMALLEST, Math.min(chord * HEAD_ROOM, column))

  return {
    ring,
    head,
    chord,
    label: Math.max(LABEL_SMALLEST, head * LABEL_SHARE),
    gap: head * LABEL_GAP,
    inner: DIAL_RADIUS * deadZone,
    hub: middle * 2 * HUB_ROOM,
    nobody: Math.max(NOBODY_SMALLEST, diameter * NOBODY_SHARE),
    nobodyWidth: diameter * NOBODY_WIDTH_SHARE
  }
}

export type DialShape = ReturnType<typeof dialShape>

type DrawnWheelParams = {
  readonly screen: Display | null
  readonly size: WheelSize
}

export const drawnWheel = ({ screen, size }: DrawnWheelParams) => {
  const { ratio, drawnWidth } = screenShape(screen)
  const span = size.widest - size.smallest
  const grown = span <= 0 ? 1 : (size.diameter - size.smallest) / span
  const share = DRAWN_SMALLEST + grown * (DRAWN_WIDEST - DRAWN_SMALLEST)

  return {
    ratio,
    drawnWidth,
    drawnDiameter: (drawnWidth / ratio) * share
  }
}
