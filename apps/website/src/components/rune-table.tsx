import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import {
  formatWeight,
  RUNE_FAMILY_IDS,
  RUNE_FAMILY_STATS,
  RUNE_WEIGHTS
} from '@multifus/runes'
import { RUNE_FAMILY_NAMES, RUNE_STAT_NAMES } from '@/constants/runes'

const TABLE_SUMMARY = msg`Le poids de chaque rune, stade par stade, et le poids d’un seul point de la stat.`

const STAT_COLUMN = msg`Stat`

const SIMPLE_COLUMN = msg`Rune simple`

const PA_COLUMN = msg`Rune Pa`

const RA_COLUMN = msg`Rune Ra`

const POINT_COLUMN = msg`Un point`

const NO_RUNE = msg`Cette rune n’existe pas`

const NUMBER_CELL = 'px-3 py-3 text-right text-tale tabular-nums text-cream'

const HEAD_CELL = 'px-3 py-4 text-right text-aside font-normal text-band'

export const RuneTable = () => {
  const { i18n } = useLingui()

  return (
    <div className="glass">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{i18n._(TABLE_SUMMARY)}</caption>
        <thead>
          <tr className="rule border-b">
            <th
              scope="col"
              className="px-4 py-4 text-aside font-normal text-band"
            >
              {i18n._(STAT_COLUMN)}
            </th>
            <th scope="col" className={HEAD_CELL}>
              {i18n._(SIMPLE_COLUMN)}
            </th>
            <th scope="col" className={HEAD_CELL}>
              {i18n._(PA_COLUMN)}
            </th>
            <th scope="col" className={HEAD_CELL}>
              {i18n._(RA_COLUMN)}
            </th>
            <th scope="col" className={cn('rule border-l', HEAD_CELL)}>
              {i18n._(POINT_COLUMN)}
            </th>
          </tr>
        </thead>
        {RUNE_FAMILY_IDS.map((family) => {
          return (
            <tbody key={family}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={5}
                  className="rule border-b px-4 pt-7 pb-2 font-carve text-bar tracking-wide text-band uppercase"
                >
                  {i18n._(RUNE_FAMILY_NAMES[family])}
                </th>
              </tr>
              {RUNE_FAMILY_STATS[family].map((stat) => {
                const { simple, pa, ra, unit } = RUNE_WEIGHTS[stat]

                return (
                  <tr key={stat} className="rule border-b last:border-b-0">
                    <th
                      scope="row"
                      className="px-4 py-3 text-tale font-normal text-cream"
                    >
                      {i18n._(RUNE_STAT_NAMES[stat])}
                    </th>
                    <WeightCell weight={simple} />
                    <WeightCell weight={pa} />
                    <WeightCell weight={ra} />
                    <td className={cn('rule border-l', NUMBER_CELL)}>
                      {formatWeight({ weight: unit, locale: i18n.locale })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          )
        })}
      </table>
    </div>
  )
}

type WeightCellProps = Readonly<{
  weight: number | null
}>

const WeightCell = ({ weight }: WeightCellProps) => {
  const { i18n } = useLingui()

  if (weight === null) {
    return (
      <td className={NUMBER_CELL}>
        <span className="sr-only">{i18n._(NO_RUNE)}</span>
        <span aria-hidden className="text-band">
          —
        </span>
      </td>
    )
  }

  return (
    <td className={NUMBER_CELL}>
      {formatWeight({ weight, locale: i18n.locale })}
    </td>
  )
}
