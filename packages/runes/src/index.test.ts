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

describe('les poids de runes', () => {
  it('porte les vingt stats de la source, dans cinq familles', () => {
    expect(RUNE_FAMILY_IDS).toHaveLength(5)
    expect(RUNE_STAT_IDS).toHaveLength(20)
  })

  it('range chaque stat dans une famille, et dans une seule', () => {
    expect(new Set(RUNE_STAT_IDS).size).toBe(RUNE_STAT_IDS.length)
    expect([...RUNE_STAT_IDS].toSorted(alphabetical)).toStrictEqual(
      Object.keys(RUNE_WEIGHTS).toSorted(alphabetical)
    )
  })

  it('ne laisse aucune famille vide', () => {
    for (const family of RUNE_FAMILY_IDS) {
      expect(RUNE_FAMILY_STATS[family].length).toBeGreaterThan(0)
    }
  })

  it('pèse la Pa trois fois la simple, sauf là où le jeu arrondit', () => {
    const off = WITH_PA.filter((stat) => {
      const { simple, pa } = RUNE_WEIGHTS[stat]

      return pa !== simple * PA_MULTIPLE
    })

    expect(off).toStrictEqual(['pods'])
  })

  it('pèse la Ra dix fois la simple, sauf là où le jeu arrondit', () => {
    const off = WITH_RA.filter((stat) => {
      const { simple, ra } = RUNE_WEIGHTS[stat]

      return ra !== simple * RA_MULTIPLE
    })

    expect(off).toStrictEqual(['vitality', 'pods'])
  })

  it('n’arrondit que des stats dont le point porte une virgule', () => {
    for (const stat of ROUNDED_UP_STATS) {
      expect(Number.isInteger(RUNE_WEIGHTS[stat].unit)).toBe(false)
    }
  })

  it('garde les poids arrondis vers le haut de la vitalité et des pods', () => {
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

  it('ne fait jamais peser une rune moins qu’un point de sa stat', () => {
    for (const stat of RUNE_STAT_IDS) {
      const { simple, unit } = RUNE_WEIGHTS[stat]

      expect(simple).toBeGreaterThanOrEqual(unit)
    }
  })

  it('fait monter le poids de la simple à la Pa, puis de la Pa à la Ra', () => {
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

  it('ne donne une Ra qu’à une stat qui a déjà une Pa', () => {
    for (const stat of WITH_RA) {
      expect(RUNE_WEIGHTS[stat].pa).not.toBeNull()
    }
  })

  it('laisse vide la rune qui n’existe pas, plutôt que de la dire chère', () => {
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

describe('le poids écrit', () => {
  it('prend la virgule de la langue qu’on lui donne', () => {
    expect(formatWeight({ weight: 0.25, locale: 'fr' })).toBe('0,25')
    expect(formatWeight({ weight: 0.25, locale: 'en' })).toBe('0.25')
  })

  it('garde les entiers entiers', () => {
    expect(formatWeight({ weight: 100, locale: 'fr' })).toBe('100')
  })

  it('coupe au centième, une rune ne pesant jamais plus fin', () => {
    expect(formatWeight({ weight: 0.256, locale: 'fr' })).toBe('0,26')
  })
})
