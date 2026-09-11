import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { RuneWeights } from '@multifus/runes'
import { formatWeight } from '@multifus/runes'

type RuneLineProps = Readonly<{
  stat: string
  weights: RuneWeights
}>

export const RuneLine = ({ stat, weights }: RuneLineProps) => {
  return (
    <tr>
      <th scope="row" className="rune-stat">
        {stat}
      </th>
      <RuneCell weight={weights.simple} />
      <RuneCell weight={weights.pa} />
      <RuneCell weight={weights.ra} />
      <td className="rune-unit">
        {formatWeight({ weight: weights.unit, locale: i18n.locale })}
      </td>
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

  return (
    <td className="rune-cell">
      {formatWeight({ weight, locale: i18n.locale })}
    </td>
  )
}
