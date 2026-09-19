import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'

type AnswerProps = Readonly<{
  lines: readonly MessageDescriptor[]
}>

export const Answer = ({ lines }: AnswerProps) => {
  const { i18n } = useLingui()

  return (
    <>
      {lines.map((line) => {
        return <p key={line.id}>{i18n._(line)}</p>
      })}
    </>
  )
}
