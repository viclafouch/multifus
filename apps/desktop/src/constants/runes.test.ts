import { describe, expect, it } from 'vitest'
import { i18n } from '@lingui/core'
import type { RuneFamily, RuneRow } from '@/constants/runes'
import { TABLE_DRAWN_WIDTH, RUNE_FAMILIES } from '@/constants/runes'
import SETTINGS_SOURCE from '../../src-tauri/src/config/settings.rs?raw'

const rustCount = (source: string, name: string) => {
  const found = new RegExp(`const ${name}: u32 = (\\d+);`, 'u').exec(source)

  if (found === null) {
    throw new Error(`Aucune constante nommée ${name}`)
  }

  return Number(found[1])
}

const PA_MULTIPLE = 3

const RA_MULTIPLE = 10

const ROUNDED_UP_STATS = [
  'Vitalité',
  'Pods'
] as const satisfies readonly string[]

const FAMILIES: readonly RuneFamily[] = RUNE_FAMILIES

const ROWS = FAMILIES.flatMap((family) => {
  return family.rows
})

const rowOf = (stat: string) => {
  const found = ROWS.find((row) => {
    return i18n._(row.stat) === stat
  })

  if (found === undefined) {
    throw new Error(`Aucune ligne nommée ${stat}`)
  }

  return found
}

const statsOf = (rows: readonly RuneRow[]) => {
  return rows.map((row) => {
    return i18n._(row.stat)
  })
}

const weightsOf = ({ simple, pa, ra, unit }: RuneRow) => {
  return { simple, pa, ra, unit }
}

const stepsOf = (row: RuneRow): readonly number[] => {
  return [row.simple, row.pa, row.ra].filter((weight) => {
    return weight !== null
  })
}

const withPa = ROWS.filter((row) => {
  return row.pa !== null
})

const withRa = ROWS.filter((row) => {
  return row.ra !== null
})

describe('le tableau des poids de runes', () => {
  it('porte les vingt lignes de la source, dans cinq familles', () => {
    expect(FAMILIES).toHaveLength(5)
    expect(ROWS).toHaveLength(20)
  })

  it('est dessiné pour la plus étroite des largeurs que la jauge donne', () => {
    expect(TABLE_DRAWN_WIDTH).toBe(
      rustCount(SETTINGS_SOURCE, 'RUNE_TABLE_NARROWEST')
    )
  })

  it('nomme chaque stat une seule fois', () => {
    expect(new Set(statsOf(ROWS)).size).toBe(ROWS.length)
  })

  it('donne à chaque famille le nom que le tableau écrit', () => {
    const named = FAMILIES.map((family) => {
      return i18n._(family.label)
    })

    expect(named).toStrictEqual([
      'Les lourdes',
      'Dommages',
      'Résistances',
      'Secondaires',
      'Les légères'
    ])
  })

  it('pèse la Pa trois fois la simple, sauf là où le jeu arrondit', () => {
    const off = withPa.filter((row) => {
      return row.pa !== row.simple * PA_MULTIPLE
    })

    expect(statsOf(off)).toStrictEqual(['Pods'])
  })

  it('pèse la Ra dix fois la simple, sauf là où le jeu arrondit', () => {
    const off = withRa.filter((row) => {
      return row.ra !== row.simple * RA_MULTIPLE
    })

    expect(statsOf(off)).toStrictEqual(['Vitalité', 'Pods'])
  })

  it('garde les chiffres arrondis vers le haut de la vitalité et des pods', () => {
    expect(weightsOf(rowOf('Vitalité'))).toStrictEqual({
      simple: 1,
      pa: 3,
      ra: 8,
      unit: 0.25
    })
    expect(weightsOf(rowOf('Pods'))).toStrictEqual({
      simple: 3,
      pa: 8,
      ra: 25,
      unit: 0.25
    })
  })

  it('n’arrondit que les lignes dont l’unité porte une virgule', () => {
    const rounded = ROWS.filter((row) => {
      return ROUNDED_UP_STATS.some((stat) => {
        return stat === i18n._(row.stat)
      })
    })

    expect(statsOf(rounded)).toStrictEqual([...ROUNDED_UP_STATS])
    expect(
      rounded.map((row) => {
        return Number.isInteger(row.unit)
      })
    ).toStrictEqual([false, false])
  })

  it('donne aux lourdes leur poids, celui qu’on ne monte pas', () => {
    expect(rowOf('PA').simple).toBe(100)
    expect(rowOf('PM').simple).toBe(90)
    expect(rowOf('PO').simple).toBe(51)
  })

  it('laisse vide la rune qui n’existe pas, plutôt que de la dire chère', () => {
    expect(statsOf(withPa)).toStrictEqual([
      'Dommages piège',
      '% piège',
      '% dommages',
      'Sagesse',
      'Prospection',
      'Ine / Fo / Age / Cha',
      'Initiative',
      'Vitalité',
      'Pods'
    ])
    expect(statsOf(withRa)).toStrictEqual([
      '% dommages',
      'Sagesse',
      'Ine / Fo / Age / Cha',
      'Initiative',
      'Vitalité',
      'Pods'
    ])
  })

  it('ne pèse jamais une rune moins que rien', () => {
    const weights = ROWS.flatMap((row) => {
      return [...stepsOf(row), row.unit]
    })

    expect(
      weights.filter((weight) => {
        return weight <= 0
      })
    ).toStrictEqual([])
  })

  it('monte du simple à la Pa, et de la Pa à la Ra', () => {
    const climbing = ROWS.map(stepsOf)
    const sorted = climbing.map((steps) => {
      return steps.toSorted((first, second) => {
        return first - second
      })
    })

    expect(climbing).toStrictEqual(sorted)
  })
})
