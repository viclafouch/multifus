import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { Plate } from '@/components/plate'
import { CAVEATS_TITLE } from '@/constants/wording'

type CaveatListProps = Readonly<{
  caveats: readonly MessageDescriptor[]
}>

export const CaveatList = ({ caveats }: CaveatListProps) => {
  const { i18n } = useLingui()

  return (
    <Plate
      isBare
      className="mx-auto w-full max-w-lintel border-amber/20 bg-amber/5"
    >
      <h2 className="nameplate text-amber">{i18n._(CAVEATS_TITLE)}</h2>
      <ul className="flex flex-col gap-4">
        {caveats.map((caveat) => {
          return (
            <li key={i18n._(caveat)} className="caveat text-tale text-khaki">
              <WarningCircleIcon weight="fill" aria-hidden />
              {i18n._(caveat)}
            </li>
          )
        })}
      </ul>
    </Plate>
  )
}
