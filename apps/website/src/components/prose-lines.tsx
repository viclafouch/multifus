import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'
import { Prose } from '@/components/prose'

type ProseLinesProps = Readonly<{
  lines: readonly MessageDescriptor[]
}>

export const ProseLines = ({ lines }: ProseLinesProps) => {
  const { i18n } = useLingui()

  return (
    <>
      {lines.map((line) => {
        const written = i18n._(line)

        return <Prose key={written}>{written}</Prose>
      })}
    </>
  )
}
