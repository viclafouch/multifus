/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Color } from '@/@types/roster'
import { COLORS, COLOR_TINTS } from '@/constants/colors'
import { COLOR_LABELS } from '@/constants/roster'

const THEME = readFileSync(join(import.meta.dirname, '..', 'theme.css'), 'utf8')

const CHARACTER_RS = readFileSync(
  join(
    import.meta.dirname,
    '..',
    '..',
    'src-tauri',
    'src',
    'domain',
    'character.rs'
  ),
  'utf8'
)

type Triplet = readonly [number, number, number]

type Matrix = readonly [Triplet, Triplet, Triplet]

const applied = (matrix: Matrix, vector: Triplet): Triplet => {
  const weighted = (row: Triplet) => {
    return row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2]
  }

  return [weighted(matrix[0]), weighted(matrix[1]), weighted(matrix[2])]
}

const OKLAB_TO_CONES: Matrix = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.291485548]
]

const CONES_TO_LINEAR: Matrix = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701]
]

const LINEAR_TO_CONES: Matrix = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005]
]

const CONES_TO_OKLAB: Matrix = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766]
]

const labOfOklch = ([lightness, chroma, hue]: Triplet): Triplet => {
  const radians = (hue * Math.PI) / 180

  return [lightness, chroma * Math.cos(radians), chroma * Math.sin(radians)]
}

const linearOfLab = (lab: Triplet): Triplet => {
  const raw = applied(OKLAB_TO_CONES, lab)

  return applied(CONES_TO_LINEAR, [raw[0] ** 3, raw[1] ** 3, raw[2] ** 3])
}

const linearOf = (oklch: Triplet): Triplet => {
  return linearOfLab(labOfOklch(oklch))
}

const labOf = (linear: Triplet): Triplet => {
  const raw = applied(LINEAR_TO_CONES, linear)

  return applied(CONES_TO_OKLAB, [
    Math.cbrt(raw[0]),
    Math.cbrt(raw[1]),
    Math.cbrt(raw[2])
  ])
}

const held = (channel: number) => {
  return Math.min(Math.max(channel, 0), 1)
}

const encoded = (channel: number) => {
  const kept = held(channel)

  return kept <= 0.0031308 ? 12.92 * kept : 1.055 * kept ** (1 / 2.4) - 0.055
}

const decoded = (channel: number) => {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

const rgbOf = (linear: Triplet): Triplet => {
  return [
    Math.round(encoded(linear[0]) * 255),
    Math.round(encoded(linear[1]) * 255),
    Math.round(encoded(linear[2]) * 255)
  ]
}

const shownOf = (linear: Triplet): Triplet => {
  const [red, green, blue] = rgbOf(linear)

  return [decoded(red / 255), decoded(green / 255), decoded(blue / 255)]
}

const LINEAR_TO_RETINA: Matrix = [
  [17.8824, 43.5161, 4.11935],
  [3.45565, 27.1554, 3.86714],
  [0.0299566, 0.184309, 1.46709]
]

const RETINA_TO_LINEAR: Matrix = [
  [0.080944, -0.130504, 0.116721],
  [-0.0102485, 0.0540194, -0.113615],
  [-0.000365294, -0.00412163, 0.693513]
]

const DEUTAN_FROM_LONG = 0.494207

const DEUTAN_FROM_SHORT = 1.24827

const PROTAN_FROM_MEDIUM = 2.02344

const PROTAN_FROM_SHORT = -2.52581

const BLINDNESSES = ['deuteranopia', 'protanopia'] as const

type Blindness = (typeof BLINDNESSES)[number]

const simulated = (linear: Triplet, blindness: Blindness): Triplet => {
  const [long, medium, short] = applied(LINEAR_TO_RETINA, linear)
  const missing: Triplet =
    blindness === 'deuteranopia'
      ? [long, DEUTAN_FROM_LONG * long + DEUTAN_FROM_SHORT * short, short]
      : [PROTAN_FROM_MEDIUM * medium + PROTAN_FROM_SHORT * short, medium, short]

  return applied(RETINA_TO_LINEAR, missing)
}

const apart = (one: Triplet, other: Triplet) => {
  const first = labOf(one)
  const second = labOf(other)

  return Math.hypot(
    first[0] - second[0],
    first[1] - second[1],
    first[2] - second[2]
  )
}

const luminance = (linear: Triplet) => {
  return (
    0.2126 * held(linear[0]) +
    0.7152 * held(linear[1]) +
    0.0722 * held(linear[2])
  )
}

const contrast = (one: Triplet, other: Triplet) => {
  const first = luminance(one)
  const second = luminance(other)

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

const declaredColor = (name: string): Triplet => {
  const declaration = new RegExp(
    `--${name}:\\s*oklch\\(([\\d.]+) ([\\d.]+) ([\\d.]+)\\)`,
    'u'
  ).exec(THEME)

  if (declaration === null) {
    throw new Error(`theme.css declares no --${name}`)
  }

  return [
    Number(declaration[1]),
    Number(declaration[2]),
    Number(declaration[3])
  ]
}

const share = (declaration: string) => {
  const found = new RegExp(declaration, 'u').exec(THEME)

  if (found === null) {
    throw new Error(`theme.css mixes no ${declaration}`)
  }

  return Number(found[1]) / 100
}

const SLICE_BLACK = share(String.raw`--slice-ink:[^;]*black ([\d.]+)%`)

const SLICE_HOVERED_WHITE = share(
  String.raw`data-hovered\][^}]*var\(--slice-ink\), white ([\d.]+)%`
)

const mixed = (color: Triplet, other: Triplet, part: number): Triplet => {
  return [
    color[0] * (1 - part) + other[0] * part,
    color[1] * (1 - part) + other[1] * part,
    color[2] * (1 - part) + other[2] * part
  ]
}

const BLACK: Triplet = [0, 0, 0]

const WHITE: Triplet = [1, 0, 0]

const AMBER = 'primary'

const WHEEL_TINTS = [...COLORS, AMBER]

const sliceInk = (tint: string): Triplet => {
  return mixed(labOfOklch(declaredColor(tint)), BLACK, SLICE_BLACK)
}

const sliceFill = (tint: string) => {
  return linearOfLab(sliceInk(tint))
}

const hoveredFill = (tint: string) => {
  return linearOfLab(mixed(sliceInk(tint), WHITE, SLICE_HOVERED_WHITE))
}

const SLICES = WHEEL_TINTS.flatMap((one, index) => {
  return WHEEL_TINTS.slice(index + 1).map((other) => {
    return [one, other] as const
  })
})

const SLICE_FLOOR = 0.06

const NAME_FLOOR = 4.5

const HOVERED_NAME_FLOOR = 3

const NORMAL_FLOOR = 0.14

const BLIND_FLOOR = 0.07

const LIVE_FLOOR = 0.16

const PRIMARY_FLOOR = 0.14

const RENDERED_DRIFT = 0.01

const paintedIn = (source: string) => {
  const painted = new Map<string, Triplet>()

  for (const match of source.matchAll(
    /Self::(\w+) => \[(\d+), (\d+), (\d+)\]/gu
  )) {
    const [, variant, red, green, blue] = match
    const rgb: Triplet = [Number(red), Number(green), Number(blue)]

    painted.set(variant.toLowerCase(), rgb)
  }

  return painted
}

const PAINTED = paintedIn(CHARACTER_RS)

const painted = (color: Color): Triplet => {
  const found = PAINTED.get(color)

  if (found === undefined) {
    throw new Error(`domain/character.rs paints no ${color}`)
  }

  return found
}

const DECLARED = new Map(
  COLORS.map((color) => {
    return [color, linearOf(declaredColor(color))] as const
  })
)

const declared = (color: Color): Triplet => {
  const found = DECLARED.get(color)

  if (found === undefined) {
    throw new Error(`theme.css declares no --${color}`)
  }

  return found
}

const alphabetical = (one: string, other: string) => {
  return one.localeCompare(other)
}

const PAIRS = COLORS.flatMap((one, index) => {
  return COLORS.slice(index + 1).map((other) => {
    return [one, other] as const
  })
})

describe('la palette des personnages', () => {
  it('porte les douze couleurs du thème, et pas une de plus', () => {
    expect(COLORS).toHaveLength(12)
    expect(new Set(COLORS).size).toBe(12)
    expect(Object.keys(COLOR_TINTS).toSorted(alphabetical)).toStrictEqual(
      COLORS.toSorted(alphabetical)
    )
    expect(Object.keys(COLOR_LABELS).toSorted(alphabetical)).toStrictEqual(
      COLORS.toSorted(alphabetical)
    )
  })

  it.each(PAIRS)('sépare %s de %s à l’œil ordinaire', (one, other) => {
    expect(apart(declared(one), declared(other))).toBeGreaterThanOrEqual(
      NORMAL_FLOOR
    )
  })

  it.each(PAIRS)('sépare %s de %s sans le rouge ni le vert', (one, other) => {
    const distances = BLINDNESSES.map((blindness) => {
      return apart(
        simulated(declared(one), blindness),
        simulated(declared(other), blindness)
      )
    })

    expect(Math.min(...distances)).toBeGreaterThanOrEqual(BLIND_FLOOR)
  })

  it.each(SLICES)('sépare %s de %s dans une roue au repos', (one, other) => {
    expect(apart(sliceFill(one), sliceFill(other))).toBeGreaterThanOrEqual(
      SLICE_FLOOR
    )
  })

  it.each(WHEEL_TINTS)('laisse lire un pseudo sur la part %s', (tint) => {
    const name = linearOf(declaredColor('foreground'))

    expect(contrast(sliceFill(tint), name)).toBeGreaterThanOrEqual(NAME_FLOOR)
  })

  it.each(WHEEL_TINTS)(
    'laisse lire un pseudo sur la part %s au survol',
    (tint) => {
      const name = linearOf(declaredColor('foreground'))

      expect(contrast(hoveredFill(tint), name)).toBeGreaterThanOrEqual(
        HOVERED_NAME_FLOOR
      )
    }
  )

  it.each(COLORS)('éloigne %s du vert du connecté', (color) => {
    const live = linearOf(declaredColor('live'))

    expect(apart(declared(color), live)).toBeGreaterThanOrEqual(LIVE_FLOOR)
  })

  it.each(COLORS)('éloigne %s de l’ambre d’une part sans couleur', (color) => {
    const primary = linearOf(declaredColor('primary'))

    expect(apart(declared(color), primary)).toBeGreaterThanOrEqual(
      PRIMARY_FLOOR
    )
  })

  it.each(COLORS)('affiche %s telle qu’elle est déclarée', (color) => {
    const shown = shownOf(declared(color))

    expect(apart(declared(color), shown)).toBeLessThanOrEqual(RENDERED_DRIFT)
  })

  it('donne au Rust les douze couleurs, et pas une de plus', () => {
    expect(PAINTED.size).toBe(COLORS.length)
  })

  it.each(COLORS)('donne %s au Rust qui peint l’icône Windows', (color) => {
    expect(rgbOf(declared(color))).toStrictEqual(painted(color))
  })
})
