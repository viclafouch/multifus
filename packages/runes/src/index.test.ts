import { describe, expect, it } from 'vitest'
import type { RuneStatId } from './index.ts'
import {
  formatWeight,
  RUNE_FAMILY_IDS,
  RUNE_FAMILY_STATS,
  RUNE_STAT_IDS,
  RUNE_WEIGHTS
} from './index.ts'

const PA_MULTIPLE = 3

const RA_MULTIPLE = 10

const ROUNDED_UP_STATS = [
  'vitality',
  'pods'
] as const satisfies readonly RuneStatId[]

const alphabetical = (one: string, other: string) => {
  return one.localeCompare(other)
}

const WITH_PA = RUNE_STAT_IDS.filter((stat) => {
  return RUNE_WEIGHTS[stat].pa !== null
})

const WITH_RA = RUNE_STAT_IDS.filter((stat) => {
  return RUNE_WEIGHTS[stat].ra !== null
})

describe('the rune weights', () => {
  it('carries the twenty stats of the source, in five families', () => {
    expect(RUNE_FAMILY_IDS).toHaveLength(5)
    expect(RUNE_STAT_IDS).toHaveLength(20)
  })

  it('files each stat in one family, and in only one', () => {
    expect(new Set(RUNE_STAT_IDS).size).toBe(RUNE_STAT_IDS.length)
    expect([...RUNE_STAT_IDS].toSorted(alphabetical)).toStrictEqual(
      Object.keys(RUNE_WEIGHTS).toSorted(alphabetical)
    )
  })

  it('leaves no family empty', () => {
    for (const family of RUNE_FAMILY_IDS) {
      expect(RUNE_FAMILY_STATS[family].length).toBeGreaterThan(0)
    }
  })

  it('weighs the Pa three times the plain one, except where the game rounds', () => {
    const off = WITH_PA.filter((stat) => {
      const { simple, pa } = RUNE_WEIGHTS[stat]

      return pa !== simple * PA_MULTIPLE
    })

    expect(off).toStrictEqual(['pods'])
  })

  it('weighs the Ra ten times the plain one, except where the game rounds', () => {
    const off = WITH_RA.filter((stat) => {
      const { simple, ra } = RUNE_WEIGHTS[stat]

      return ra !== simple * RA_MULTIPLE
    })

    expect(off).toStrictEqual(['vitality', 'pods'])
  })

  it('rounds only the stats whose point carries a decimal', () => {
    for (const stat of ROUNDED_UP_STATS) {
      expect(Number.isInteger(RUNE_WEIGHTS[stat].unit)).toBe(false)
    }
  })

  it('keeps the weights of vitality and pods rounded up', () => {
    expect(RUNE_WEIGHTS.vitality).toStrictEqual({
      simple: 1,
      pa: 3,
      ra: 8,
      unit: 0.25
    })
    expect(RUNE_WEIGHTS.pods).toStrictEqual({
      simple: 3,
      pa: 8,
      ra: 25,
      unit: 0.25
    })
  })

  it('never makes a rune weigh less than one point of its stat', () => {
    for (const stat of RUNE_STAT_IDS) {
      const { simple, unit } = RUNE_WEIGHTS[stat]

      expect(simple).toBeGreaterThanOrEqual(unit)
    }
  })

  it('raises the weight from the plain one to the Pa, then from the Pa to the Ra', () => {
    for (const stat of RUNE_STAT_IDS) {
      const { simple, pa, ra } = RUNE_WEIGHTS[stat]
      const steps = [simple, pa, ra].filter((weight) => {
        return weight !== null
      })

      expect(steps).toStrictEqual(
        [...steps].toSorted((first, second) => {
          return first - second
        })
      )
    }
  })

  it('gives a Ra only to a stat that already has a Pa', () => {
    for (const stat of WITH_RA) {
      expect(RUNE_WEIGHTS[stat].pa).not.toBeNull()
    }
  })

  it('leaves empty the rune that does not exist, rather than calling it expensive', () => {
    expect(WITH_PA).toStrictEqual([
      'trapDamage',
      'trapPercent',
      'damagePercent',
      'wisdom',
      'prospecting',
      'elements',
      'initiative',
      'vitality',
      'pods'
    ])
    expect(WITH_RA).toStrictEqual([
      'damagePercent',
      'wisdom',
      'elements',
      'initiative',
      'vitality',
      'pods'
    ])
  })
})

describe('the written weight', () => {
  it('takes the decimal mark of the language it is given', () => {
    expect(formatWeight({ weight: 0.25, locale: 'fr' })).toBe('0,25')
    expect(formatWeight({ weight: 0.25, locale: 'en' })).toBe('0.25')
  })

  it('keeps the whole numbers whole', () => {
    expect(formatWeight({ weight: 100, locale: 'fr' })).toBe('100')
  })

  it('cuts at the hundredth, a rune never weighing finer', () => {
    expect(formatWeight({ weight: 0.256, locale: 'fr' })).toBe('0,26')
  })
})
