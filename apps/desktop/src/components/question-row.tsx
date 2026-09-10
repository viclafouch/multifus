import { Accordion } from '@base-ui/react/accordion'
import type { Snapshot } from '@/@types/snapshot'
import { MoveButton } from '@/components/move-button'
import { SettingPath } from '@/components/retro/setting-path'
import { SystemPageButton } from '@/components/system-page-button'
import type { Question } from '@/constants/questions'
import { QUESTION_MOVES, QUESTION_PAGES } from '@/constants/questions'
import { questionLines, questionWay } from '@/helpers/questions'

type QuestionRowProps = Readonly<{
  question: Question
  onLeave: () => void
  run: (action: Promise<Snapshot>) => void
}>

export const QuestionRow = ({ question, onLeave, run }: QuestionRowProps) => {
  const lines = questionLines(question)
  const way = questionWay(question)
  const page = QUESTION_PAGES[question]
  const move = QUESTION_MOVES[question]

  return (
    <Accordion.Item
      value={question}
      className="border-b border-band/25 last:border-b-0"
    >
      <Accordion.Header>
        <Accordion.Trigger className="flex w-full items-center gap-3 py-3.5 text-left text-tale leading-snug text-khaki-lit transition-colors sighted hover:text-cream aria-expanded:text-cream">
          <span aria-hidden className="askmark shrink-0" />
          <span className="flex-1">{lines.asked}</span>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="unroll">
        <div className="flex max-w-tale flex-col items-start gap-2 pb-4 pl-5">
          <p className="text-aside text-khaki">{lines.answer}</p>
          {way.length === 0 ? null : (
            <SettingPath path={way} className="justify-start" />
          )}
          {page === null && move === null ? null : (
            <div className="flex flex-wrap items-center gap-2">
              {page === null ? null : (
                <SystemPageButton page={page} size="tight" />
              )}
              {move === null ? null : (
                <MoveButton move={move} onLeave={onLeave} run={run} />
              )}
            </div>
          )}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  )
}
