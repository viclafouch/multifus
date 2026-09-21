import { Trans } from '@lingui/react'
import type { AskLine, AskMark } from '@/@types/ask'
import { OutLink } from '@/components/out-link'
import { PageLink } from '@/components/page-link'

const markOf = (mark: AskMark) => {
  if (mark.kind === 'page') {
    return <PageLink page={mark.page} className="rule border-b text-cream" />
  }

  if (mark.kind === 'out') {
    return <OutLink href={mark.href} isInline />
  }

  return <strong className="font-semibold text-cream" />
}

const markedBy = (marks: readonly AskMark[]) => {
  return Object.fromEntries(
    marks.map((mark, index) => {
      return [index, markOf(mark)]
    })
  )
}

type AnswerProps = Readonly<{
  lines: readonly AskLine[]
  isPointed?: boolean
}>

export const Answer = ({ lines, isPointed = false }: AnswerProps) => {
  const Line = isPointed ? 'li' : 'p'

  return (
    <>
      {lines.map(({ said, marks = [] }) => {
        return (
          <Line key={said.id} className={isPointed ? 'pointed' : undefined}>
            <Trans
              id={said.id}
              message={said.message}
              values={said.values}
              components={markedBy(marks)}
            />
          </Line>
        )
      })}
    </>
  )
}
