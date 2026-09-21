import { useLingui } from '@lingui/react'
import type { Icon } from '@phosphor-icons/react'
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown'
import type { AskId } from '@/@types/ask'
import { Answer } from '@/components/answer'
import { QUESTIONS } from '@/constants/questions'

const ASKS_GROUP = 'faq'

type AskRowProps = Readonly<{
  ask: AskId
  Mark: Icon
}>

export const AskRow = ({ ask, Mark }: AskRowProps) => {
  const { i18n } = useLingui()
  const { ask: said, answer } = QUESTIONS[ask]

  return (
    <details
      id={ask}
      name={ASKS_GROUP}
      data-ask
      className="asked asking swell scroll-mt-fall"
    >
      <summary className="sighted">
        <span className="rosette">
          <Mark weight="duotone" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 font-carve text-bar tracking-wide text-cream uppercase">
          {i18n._(said)}
        </span>
        <span aria-hidden className="clasp">
          <CaretDownIcon weight="bold" />
        </span>
      </summary>
      <div className="answer answered flex flex-col gap-3 text-tale text-band">
        <Answer lines={answer} />
      </div>
    </details>
  )
}
