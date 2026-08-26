import { describe, expect, it } from 'vitest'
import type { WalkMeasure } from '@/@types/walk'
import {
  measureVerdict,
  ruledAt,
  rulerTicks,
  walkSummary
} from '@/helpers/walk'

const BUDGET = 60

const CEILING = 250

const landed = (milliseconds: number): WalkMeasure => {
  return { milliseconds, landed: true }
}

describe('measureVerdict', () => {
  it('sépare ce qui tient le budget de ce qui le dépasse', () => {
    expect(measureVerdict(landed(41), BUDGET)).toBe('within')
    expect(measureVerdict(landed(BUDGET), BUDGET)).toBe('within')
    expect(measureVerdict(landed(61), BUDGET)).toBe('over')
  })

  it('dit perdue une bascule dont la fenêtre n’est jamais passée devant', () => {
    expect(measureVerdict({ milliseconds: 12, landed: false }, BUDGET)).toBe(
      'lost'
    )
  })
})

describe('ruledAt', () => {
  it('place une mesure en pourcentage du plafond', () => {
    expect(ruledAt(0, CEILING)).toBe(0)
    expect(ruledAt(125, CEILING)).toBe(50)
    expect(ruledAt(CEILING, CEILING)).toBe(100)
  })

  it('ne laisse rien sortir de la règle', () => {
    expect(ruledAt(4000, CEILING)).toBe(100)
    expect(ruledAt(-1, CEILING)).toBe(0)
    expect(ruledAt(41, 0)).toBe(0)
  })
})

describe('rulerTicks', () => {
  it('pose la dernière bascule en pleine lumière et efface les anciennes', () => {
    const ticks = rulerTicks({
      measures: [landed(20), landed(40), landed(80)],
      budget: BUDGET,
      ceiling: CEILING
    })

    expect(
      ticks.map((tick) => {
        return tick.verdict
      })
    ).toStrictEqual(['within', 'within', 'over'])
    expect(ticks[2].weight).toBe(1)
    expect(ticks[0].weight).toBeLessThan(ticks[2].weight)
  })

  it('donne toute sa lumière à une bascule seule', () => {
    const ticks = rulerTicks({
      measures: [landed(20)],
      budget: BUDGET,
      ceiling: CEILING
    })

    expect(ticks[0].weight).toBe(1)
  })

  it('ne dessine rien tant que rien n’a été mesuré', () => {
    expect(
      rulerTicks({ measures: [], budget: BUDGET, ceiling: CEILING })
    ).toStrictEqual([])
  })
})

describe('walkSummary', () => {
  it('retient la dernière bascule et la pire des mesures gardées', () => {
    const summary = walkSummary([landed(80), landed(20), landed(41)])

    expect(summary?.last.milliseconds).toBe(41)
    expect(summary?.worst.milliseconds).toBe(80)
  })

  it('ne promet rien tant qu’aucune bascule n’a été mesurée', () => {
    expect(walkSummary([])).toBeNull()
  })
})
