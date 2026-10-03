import React from 'react'
import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import {
  RUNE_FAMILY_IDS,
  RUNE_FAMILY_STATS,
  RUNE_WEIGHTS
} from '@multifus/runes'
import { CloseButton } from '@/components/close-button'
import { RUNE_FAMILY_NAMES, RUNE_STAT_NAMES } from '@/constants/runes'
import type { useWindowDrag } from '@/hooks/use-window-drag'
import { RuneLine } from '@/screens/rune-table-window/rune-line'

type RuneSheetProps = Readonly<{
  drag: ReturnType<typeof useWindowDrag>
  look: number
  onClose: () => void
  ref: React.Ref<HTMLDivElement>
}>

export const RuneSheet = ({ drag, look, onClose, ref }: RuneSheetProps) => {
  const title = t`Tableau des runes`

  return (
    <div
      {...drag}
      ref={ref}
      role="group"
      aria-label={title}
      className="rune-sheet"
      style={{ opacity: look }}
    >
      <header className="sheet-crown">
        <h1 className="min-w-0 flex-1 truncate text-tale leading-none font-medium">
          {title}
        </h1>
        <CloseButton label={t`Fermer le tableau des runes`} onClick={onClose} />
      </header>
      <table className="rune-grid">
        <caption className="sr-only">{t`Le poids de chaque rune : la simple, la Pa, la Ra, et le poids d’un point de stat`}</caption>
        <thead>
          <tr>
            <th scope="col" className="rune-head">
              {t`Stat`}
            </th>
            <th scope="col" className="rune-head" data-weight>
              {t`Simple`}
            </th>
            <th scope="col" className="rune-head" data-weight>
              {t`Pa`}
            </th>
            <th scope="col" className="rune-head" data-weight>
              {t`Ra`}
            </th>
            <th scope="col" className="rune-head" data-weight>
              {t`Point`}
            </th>
          </tr>
        </thead>
        {RUNE_FAMILY_IDS.map((family) => {
          return (
            <tbody key={family} className="rune-family" data-family={family}>
              <tr>
                <th scope="colgroup" colSpan={5} className="rune-clan">
                  {i18n._(RUNE_FAMILY_NAMES[family])}
                </th>
              </tr>
              {RUNE_FAMILY_STATS[family].map((stat) => {
                return (
                  <RuneLine
                    key={stat}
                    stat={i18n._(RUNE_STAT_NAMES[stat])}
                    weights={RUNE_WEIGHTS[stat]}
                  />
                )
              })}
            </tbody>
          )
        })}
      </table>
    </div>
  )
}
