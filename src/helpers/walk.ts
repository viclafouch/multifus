import type { WalkMeasure } from '@/@types/walk'

const OLDEST_WEIGHT = 0.3

export type RulerTick = {
  readonly key: number
  readonly at: number
  readonly weight: number
  readonly verdict: 'lost' | 'over' | 'within'
}

type RulerTicksParams = {
  readonly measures: readonly WalkMeasure[]
  readonly budget: number
  readonly ceiling: number
}

export const rulerTicks = ({
  measures,
  budget,
  ceiling
}: RulerTicksParams): readonly RulerTick[] => {
  const last = measures.length - 1

  return measures.map((measure, index) => {
    return {
      key: index,
      at: ruledAt(measure.milliseconds, ceiling),
      weight:
        last === 0 ? 1 : OLDEST_WEIGHT + (1 - OLDEST_WEIGHT) * (index / last),
      verdict: measureVerdict(measure, budget)
    }
  })
}

export const ruledAt = (milliseconds: number, ceiling: number) => {
  if (ceiling <= 0) {
    return 0
  }

  return Math.min(Math.max(milliseconds / ceiling, 0), 1) * 100
}

export const measureVerdict = (
  measure: WalkMeasure,
  budget: number
): RulerTick['verdict'] => {
  if (!measure.landed) {
    return 'lost'
  }

  return measure.milliseconds <= budget ? 'within' : 'over'
}

export type WalkSummary = {
  readonly last: WalkMeasure
  readonly worst: WalkMeasure
}

export const walkSummary = (
  measures: readonly WalkMeasure[]
): WalkSummary | null => {
  const last = measures.at(-1)

  if (last === undefined) {
    return null
  }

  const worst = measures.reduce((slowest, measure) => {
    return measure.milliseconds > slowest.milliseconds ? measure : slowest
  }, last)

  return { last, worst }
}
