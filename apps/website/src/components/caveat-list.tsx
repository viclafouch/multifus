import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { CAVEATS_TITLE } from '@/constants/wording'

type CaveatListProps = Readonly<{
  caveats: readonly MessageDescriptor[]
}>

export const CaveatList = ({ caveats }: CaveatListProps) => {
  const { i18n } = useLingui()

  return (
    <section className="flex max-w-tale flex-col gap-4">
      <h2 className="rubric text-amber">{i18n._(CAVEATS_TITLE)}</h2>
      <ul className="flex flex-col gap-2.5">
        {caveats.map((caveat) => {
          return (
            <li key={i18n._(caveat)} className="sidenote text-tale text-khaki">
              <WarningCircleIcon weight="fill" aria-hidden />
              {i18n._(caveat)}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
