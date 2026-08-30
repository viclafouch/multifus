import type { RuneRow } from '@/constants/runes'
import { strings } from '@/constants/strings'
import { runeWeight } from '@/helpers/rune'

type RuneLineProps = Readonly<{
  row: RuneRow
}>

export const RuneLine = ({ row }: RuneLineProps) => {
  return (
    <tr className="rune-line">
      <th scope="row" className="rune-stat">
        {row.stat}
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
  const words = strings.runeTable.sheet

  if (weight === null) {
    return (
      <td className="rune-cell" data-missing>
        <span className="sr-only">{words.emptyLabel}</span>
        <span aria-hidden>{words.empty}</span>
      </td>
    )
  }

  return <td className="rune-cell">{runeWeight(weight)}</td>
}
