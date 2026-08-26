import type { WalkMeasure } from '@/@types/walk'
import { Legend } from '@/components/layout/legend'
import { strings } from '@/constants/strings'
import { rulerTicks, ruledAt } from '@/helpers/walk'

type SwitchRulerProps = Readonly<{
  measures: readonly WalkMeasure[]
  budget: number
  ceiling: number
}>

export const SwitchRuler = ({
  measures,
  budget,
  ceiling
}: SwitchRulerProps) => {
  const ticks = rulerTicks({ measures, budget, ceiling })
  const budgetAt = ruledAt(budget, ceiling)

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-20 overflow-hidden rounded-lg border border-border bg-background/45">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-primary/7"
          style={{ width: `${budgetAt}%` }}
        />
        <span
          aria-hidden
          className="absolute inset-y-0 w-px bg-primary/70"
          style={{ left: `${budgetAt}%` }}
        />
        <Legend
          aria-hidden
          className="absolute top-2 whitespace-nowrap text-primary/80"
          style={{ left: `calc(${budgetAt}% + 0.5rem)` }}
        >
          {`${strings.walk.measures.budget} ${budget} ${strings.walk.measures.unit}`}
        </Legend>
        {ticks.map((tick) => {
          return (
            <span
              key={tick.key}
              aria-hidden
              data-verdict={tick.verdict}
              className="absolute bottom-3 h-8 w-0.5 rounded-full data-[verdict=lost]:bg-destructive data-[verdict=over]:bg-idle data-[verdict=within]:bg-live"
              style={{ left: `${tick.at}%`, opacity: tick.weight }}
            />
          )
        })}
      </div>
      <div className="flex items-baseline justify-between">
        <Legend>0</Legend>
        <Legend>{`${ceiling} ${strings.walk.measures.unit}`}</Legend>
      </div>
    </div>
  )
}
