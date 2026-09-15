import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check'

type PerkListProps = Readonly<{
  perks: readonly MessageDescriptor[]
}>

export const PerkList = ({ perks }: PerkListProps) => {
  const { i18n } = useLingui()

  return (
    <ul className="flex flex-wrap gap-2.5">
      {perks.map((perk) => {
        const said = i18n._(perk)

        return (
          <li key={said} className="perk text-aside">
            <CheckIcon weight="bold" aria-hidden />
            {said}
          </li>
        )
      })}
    </ul>
  )
}
