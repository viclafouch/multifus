import type { WalkMeasure, WalkStatus } from '@/@types/walk'
import { Legend } from '@/components/layout/legend'
import { Panel } from '@/components/layout/panel'
import { strings } from '@/constants/strings'
import { measureVerdict, walkSummary } from '@/helpers/walk'
import { SwitchRuler } from '@/screens/walk-screen/switch-ruler'

type MeasuresPanelProps = Readonly<{
  walk: WalkStatus
}>

export const MeasuresPanel = ({ walk }: MeasuresPanelProps) => {
  const summary = walkSummary(walk.measures)

  return (
    <Panel>
      <div className="flex items-baseline justify-between border-b border-border/70 px-4 py-3.5">
        <h2 className="text-row font-medium">{strings.walk.measures.title}</h2>
        <Legend>{strings.walk.measures.legend(walk.measures.length)}</Legend>
      </div>
      {summary === null ? (
        <p className="max-w-prose px-4 py-4 text-note text-muted-foreground">
          {strings.walk.measures.empty}
        </p>
      ) : (
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex items-start gap-8">
            <Reading
              label={strings.walk.measures.last}
              measure={summary.last}
              budget={walk.budget}
            />
            <Reading
              label={strings.walk.measures.worst}
              measure={summary.worst}
              budget={walk.budget}
            />
          </div>
          <SwitchRuler
            measures={walk.measures}
            budget={walk.budget}
            ceiling={walk.ceiling}
          />
          <p className="max-w-prose text-note text-muted-foreground">
            {strings.walk.measures.reading}
          </p>
        </div>
      )}
    </Panel>
  )
}

type ReadingProps = Readonly<{
  label: string
  measure: WalkMeasure
  budget: number
}>

const Reading = ({ label, measure, budget }: ReadingProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <Legend>{label}</Legend>
      <p
        data-verdict={measureVerdict(measure, budget)}
        className="font-mono text-heading leading-none font-medium data-[verdict=lost]:text-destructive data-[verdict=over]:text-idle data-[verdict=within]:text-live"
      >
        {measure.milliseconds}
        <span className="pl-1 text-note text-muted-foreground">
          {strings.walk.measures.unit}
        </span>
      </p>
      {measure.landed ? null : (
        <p className="text-note text-destructive">
          {strings.walk.measures.lost}
        </p>
      )}
    </div>
  )
}
