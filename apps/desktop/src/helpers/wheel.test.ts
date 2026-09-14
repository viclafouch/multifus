import { describe, expect, it } from 'vitest'
import type { Display } from '@/@types/display'
import type { WheelSize } from '@/@types/wheel'
import {
  DEMO_FEWEST,
  DEMO_USUAL,
  DIAL_RADIUS,
  HEAD_SMALLEST,
  LABEL_SMALLEST
} from '@/constants/wheel'
import { screenShape } from '@/helpers/display'
import { dialShape, drawnWheel, headPlace, slicePath } from '@/helpers/wheel'

const DEAD_ZONE = 0.32

const WIDEST_TEAM = 8

const NUMBER = /-?\d+(?:\.\d+)?/gu

const numbersOf = (path: string) => {
  return (path.match(NUMBER) ?? []).map(Number)
}

const RING = 100

describe('headPlace', () => {
  it('puts the first head at noon', () => {
    expect(headPlace({ index: 0, count: 4, ring: RING })).toStrictEqual({
      x: 0,
      y: -100
    })
  })

  it('puts the second one at three o’clock, and follows the hands', () => {
    const right = headPlace({ index: 1, count: 4, ring: RING })
    const bottom = headPlace({ index: 2, count: 4, ring: RING })

    expect(right.x).toBeCloseTo(100)
    expect(right.y).toBeCloseTo(0)
    expect(bottom.y).toBeCloseTo(100)
  })

  it('loops the turn through the left', () => {
    const left = headPlace({ index: 3, count: 4, ring: RING })

    expect(left.x).toBeCloseTo(-100)
    expect(left.y).toBeCloseTo(0)
  })
})

describe('slicePath', () => {
  it('draws a whole ring for a single character', () => {
    const path = slicePath({ index: 0, count: 1, inner: 16 })

    expect(path.split('M')).toHaveLength(3)
    expect(numbersOf(path)).toContain(DIAL_RADIUS)
    expect(numbersOf(path)).toContain(16)
  })

  it('draws a closed pie slice for each of the others', () => {
    const path = slicePath({ index: 2, count: 8, inner: 16 })

    expect(path.startsWith('M ')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    expect(path.split('A')).toHaveLength(3)
  })

  it('leaves a slit between two neighboring slices', () => {
    const first = slicePath({ index: 0, count: 4, inner: 16 })
    const second = slicePath({ index: 1, count: 4, inner: 16 })

    const [, endX] = numbersOf(first).slice(-8)
    const [startX] = numbersOf(second)

    expect(startX).not.toBe(endX)
  })

  it('writes short numbers, without a trail of floating point', () => {
    for (const number of numbersOf(
      slicePath({ index: 1, count: 3, inner: 16 })
    )) {
      expect(String(number)).not.toContain('e-')
    }
  })
})

describe('dialShape', () => {
  it('grows the head and its nickname with the diameter', () => {
    const small = dialShape({ diameter: 280, deadZone: DEAD_ZONE, count: 6 })
    const wide = dialShape({ diameter: 720, deadZone: DEAD_ZONE, count: 6 })

    expect(wide.head).toBeGreaterThan(small.head)
    expect(wide.label).toBeGreaterThan(small.label)
    expect(wide.hub).toBeGreaterThan(small.hub)
  })

  it('tightens the head when the slices press together', () => {
    const few = dialShape({ diameter: 400, deadZone: DEAD_ZONE, count: 4 })
    const many = dialShape({ diameter: 400, deadZone: DEAD_ZONE, count: 12 })

    expect(many.head).toBeLessThan(few.head)
  })

  it('keeps the head and its nickname inside their slice', () => {
    for (const count of [1, 2, 6, 8, 12]) {
      for (const diameter of [120, 200, 280, 400, 720]) {
        const shape = dialShape({ diameter, deadZone: DEAD_ZONE, count })
        const band = (diameter / 2) * (1 - DEAD_ZONE)

        expect(shape.head).toBeLessThanOrEqual(shape.chord)
        expect(shape.head + shape.gap + shape.label).toBeLessThanOrEqual(band)
      }
    }
  })

  it('hollows the dead zone at the measure Rust gave', () => {
    const shape = dialShape({ diameter: 400, deadZone: DEAD_ZONE, count: 6 })

    expect(shape.inner).toBeCloseTo(DIAL_RADIUS * DEAD_ZONE)
  })

  it('keeps a head readable on an empty wheel', () => {
    const shape = dialShape({ diameter: 400, deadZone: DEAD_ZONE, count: 0 })

    expect(shape.head).toBeGreaterThanOrEqual(HEAD_SMALLEST)
  })
})

describe('drawnWheel', () => {
  const LAPTOP: Display = {
    name: 'Écran intégré',
    width: 1512,
    height: 982,
    primary: true
  }

  const GAUGE: WheelSize = {
    diameter: 280,
    smallest: 280,
    widest: 720,
    step: 20,
    deadZone: DEAD_ZONE,
    demo: []
  }

  const BOX = 640

  it('takes the shape of the screen that carries Multifus', () => {
    const drawn = drawnWheel({ screen: LAPTOP, size: GAUGE, boxWidth: BOX })

    expect(drawn.ratio).toBeCloseTo(LAPTOP.width / LAPTOP.height)
  })

  it('grows with the gauge, and fits in the box', () => {
    const narrow = drawnWheel({ screen: LAPTOP, size: GAUGE, boxWidth: BOX })
    const wide = drawnWheel({
      screen: LAPTOP,
      size: { ...GAUGE, diameter: 720 },
      boxWidth: BOX
    })

    expect(wide.drawnDiameter).toBeGreaterThan(narrow.drawnDiameter)
    expect(wide.drawnDiameter).toBeLessThanOrEqual(BOX / wide.ratio)
  })

  it('keeps the example readable on every screen, alone as with eight', () => {
    for (const width of [1280, 1512, 1920, 3840]) {
      for (const count of [DEMO_FEWEST, DEMO_USUAL, WIDEST_TEAM]) {
        const drawn = drawnWheel({
          screen: { ...LAPTOP, width, height: (width * 9) / 16 },
          size: GAUGE,
          boxWidth: BOX
        })
        const shape = dialShape({
          diameter: drawn.drawnDiameter,
          deadZone: DEAD_ZONE,
          count
        })

        expect(shape.head).toBeGreaterThan(20)
        expect(shape.label).toBeGreaterThanOrEqual(LABEL_SMALLEST)
      }
    }
  })

  it('leaves some air between the drawn wheel and its frame', () => {
    const wide = drawnWheel({
      screen: LAPTOP,
      size: { ...GAUGE, diameter: 720 },
      boxWidth: BOX
    })

    expect(wide.drawnDiameter).toBeLessThan((BOX / wide.ratio) * 0.9)
  })

  it('follows the box the plate gives it, once measured', () => {
    const wide = drawnWheel({ screen: LAPTOP, size: GAUGE, boxWidth: BOX })
    const half = drawnWheel({ screen: LAPTOP, size: GAUGE, boxWidth: BOX / 2 })

    expect(wide.drawnDiameter).toBeCloseTo(half.drawnDiameter * 2)
  })

  it('falls back on the drawn screen while nothing is measured', () => {
    const unmeasured = drawnWheel({ screen: LAPTOP, size: GAUGE, boxWidth: 0 })
    const measured = drawnWheel({
      screen: LAPTOP,
      size: GAUGE,
      boxWidth: screenShape(LAPTOP).drawnWidth
    })

    expect(unmeasured.drawnDiameter).toBeCloseTo(measured.drawnDiameter)
  })

  it('takes a sixteen ninths while the system has named no screen', () => {
    const drawn = drawnWheel({ screen: null, size: GAUGE, boxWidth: BOX })

    expect(drawn.ratio).toBeCloseTo(16 / 9)
  })
})
