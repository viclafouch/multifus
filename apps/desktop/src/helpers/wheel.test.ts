import { describe, expect, it } from 'vitest'
import type { Display } from '@/@types/display'
import type { WheelSize } from '@/@types/wheel'
import { DRAWN_SCREEN } from '@/constants/display'
import {
  DEMO_FEWEST,
  DEMO_USUAL,
  DIAL_RADIUS,
  HEAD_SMALLEST,
  LABEL_SMALLEST
} from '@/constants/wheel'
import { dialShape, drawnWheel, headPlace, slicePath } from '@/helpers/wheel'

const DEAD_ZONE = 0.32

const WIDEST_TEAM = 8

const NUMBER = /-?\d+(?:\.\d+)?/gu

const numbersOf = (path: string) => {
  return (path.match(NUMBER) ?? []).map(Number)
}

const RING = 100

describe('headPlace', () => {
  it('pose la première tête à midi', () => {
    expect(headPlace({ index: 0, count: 4, ring: RING })).toStrictEqual({
      x: 0,
      y: -100
    })
  })

  it('pose la deuxième à trois heures, et suit les aiguilles', () => {
    const right = headPlace({ index: 1, count: 4, ring: RING })
    const bottom = headPlace({ index: 2, count: 4, ring: RING })

    expect(right.x).toBeCloseTo(100)
    expect(right.y).toBeCloseTo(0)
    expect(bottom.y).toBeCloseTo(100)
  })

  it('boucle le tour par la gauche', () => {
    const left = headPlace({ index: 3, count: 4, ring: RING })

    expect(left.x).toBeCloseTo(-100)
    expect(left.y).toBeCloseTo(0)
  })
})

describe('slicePath', () => {
  it('dessine un anneau entier pour un seul personnage', () => {
    const path = slicePath({ index: 0, count: 1, inner: 16 })

    expect(path.split('M')).toHaveLength(3)
    expect(numbersOf(path)).toContain(DIAL_RADIUS)
    expect(numbersOf(path)).toContain(16)
  })

  it('dessine un camembert fermé pour chacun des autres', () => {
    const path = slicePath({ index: 2, count: 8, inner: 16 })

    expect(path.startsWith('M ')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    expect(path.split('A')).toHaveLength(3)
  })

  it('laisse une fente entre deux parts voisines', () => {
    const first = slicePath({ index: 0, count: 4, inner: 16 })
    const second = slicePath({ index: 1, count: 4, inner: 16 })

    const [, endX] = numbersOf(first).slice(-8)
    const [startX] = numbersOf(second)

    expect(startX).not.toBe(endX)
  })

  it('écrit des nombres courts, sans traîne de virgule flottante', () => {
    for (const number of numbersOf(
      slicePath({ index: 1, count: 3, inner: 16 })
    )) {
      expect(String(number)).not.toContain('e-')
    }
  })
})

describe('dialShape', () => {
  it('fait grandir la tête et son pseudo avec le diamètre', () => {
    const small = dialShape({ diameter: 280, deadZone: DEAD_ZONE, count: 6 })
    const wide = dialShape({ diameter: 720, deadZone: DEAD_ZONE, count: 6 })

    expect(wide.head).toBeGreaterThan(small.head)
    expect(wide.label).toBeGreaterThan(small.label)
    expect(wide.hub).toBeGreaterThan(small.hub)
  })

  it('resserre la tête quand les parts se pressent', () => {
    const few = dialShape({ diameter: 400, deadZone: DEAD_ZONE, count: 4 })
    const many = dialShape({ diameter: 400, deadZone: DEAD_ZONE, count: 12 })

    expect(many.head).toBeLessThan(few.head)
  })

  it('garde la tête et son pseudo dans leur part', () => {
    for (const count of [1, 2, 6, 8, 12]) {
      for (const diameter of [120, 200, 280, 400, 720]) {
        const shape = dialShape({ diameter, deadZone: DEAD_ZONE, count })
        const band = (diameter / 2) * (1 - DEAD_ZONE)

        expect(shape.head).toBeLessThanOrEqual(shape.chord)
        expect(shape.head + shape.gap + shape.label).toBeLessThanOrEqual(band)
      }
    }
  })

  it('creuse le rond mort à la mesure que Rust a donnée', () => {
    const shape = dialShape({ diameter: 400, deadZone: DEAD_ZONE, count: 6 })

    expect(shape.inner).toBeCloseTo(DIAL_RADIUS * DEAD_ZONE)
  })

  it('garde une tête lisible sur une roue vide', () => {
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

  it('prend la forme de l’écran qui porte Multifus', () => {
    const drawn = drawnWheel({ screen: LAPTOP, size: GAUGE })

    expect(drawn.ratio).toBeCloseTo(LAPTOP.width / LAPTOP.height)
    expect(drawn.drawnWidth).toBeLessThanOrEqual(DRAWN_SCREEN.width)
  })

  it('grandit avec la jauge, et tient dans l’écran dessiné', () => {
    const narrow = drawnWheel({ screen: LAPTOP, size: GAUGE })
    const wide = drawnWheel({
      screen: LAPTOP,
      size: { ...GAUGE, diameter: 720 }
    })

    expect(wide.drawnDiameter).toBeGreaterThan(narrow.drawnDiameter)
    expect(wide.drawnDiameter).toBeLessThanOrEqual(wide.drawnWidth / wide.ratio)
  })

  it('garde l’exemple lisible sur tous les écrans, seul comme à huit', () => {
    for (const width of [1280, 1512, 1920, 3840]) {
      for (const count of [DEMO_FEWEST, DEMO_USUAL, WIDEST_TEAM]) {
        const drawn = drawnWheel({
          screen: { ...LAPTOP, width, height: (width * 9) / 16 },
          size: GAUGE
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

  it('laisse de l’air entre la roue dessinée et son cadre', () => {
    const wide = drawnWheel({
      screen: LAPTOP,
      size: { ...GAUGE, diameter: 720 }
    })

    expect(wide.drawnDiameter).toBeLessThan(
      (wide.drawnWidth / wide.ratio) * 0.9
    )
  })

  it('prend un seize-neuvièmes tant que le système n’a nommé aucun écran', () => {
    const drawn = drawnWheel({ screen: null, size: GAUGE })

    expect(drawn.ratio).toBeCloseTo(16 / 9)
  })
})
