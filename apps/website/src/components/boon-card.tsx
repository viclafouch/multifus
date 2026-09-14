import { useLingui } from '@lingui/react'
import type { Boon } from '@/@types/body'

type BoonCardProps = Readonly<{
  boon: Boon
}>

export const BoonCard = ({ boon }: BoonCardProps) => {
  const { i18n } = useLingui()
  const { icon: BoonIcon, title, line } = boon

  return (
    <li className="boon torch flex flex-col gap-5 p-6">
      <span className="rosette">
        <BoonIcon weight="duotone" aria-hidden />
      </span>
      <span className="flex flex-col gap-2">
        <h2 className="nameplate">{i18n._(title)}</h2>
        <span className="text-tale text-band">{i18n._(line)}</span>
      </span>
    </li>
  )
}
