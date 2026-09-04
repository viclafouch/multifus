import { t } from '@lingui/core/macro'
import type { RuneRow } from '@/constants/runes'
import { runeWeight } from '@/helpers/rune'

type RuneLineProps = Readonly<{
  row: RuneRow
  stat: string
}>

export const RuneLine = ({ row, stat }: RuneLineProps) => {
  return (
    <tr>
      <th scope="row" className="rune-stat">
        {stat}
      </th>
      <RuneCell weight={row.simple} />
      <RuneCell weight={row.pa} />
      <RuneCell weight={row.ra} />
      <td className="rune-unit">{runeWeight(row.unit)}</td>
    </tr>
  )
}

type RuneCellProps = Readonly<{
  weight: number | null
}>

const RuneCell = ({ weight }: RuneCellProps) => {
  if (weight === null) {
    return (
      <td className="rune-cell" data-missing>
        <span className="sr-only">{t`La rune n’existe pas`}</span>
        <span aria-hidden>—</span>
      </td>
    )
  }

  return <td className="rune-cell">{runeWeight(weight)}</td>
}
