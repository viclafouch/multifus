import React from 'react'
import { X } from 'lucide-react'
import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import { Button } from '@/components/ui/button'
import { RUNE_FAMILIES } from '@/constants/runes'
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
      <header className="rune-crown">
        <h1 className="min-w-0 flex-1 truncate text-row leading-none font-medium">
          {title}
        </h1>
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground hover:bg-destructive/20 hover:text-foreground"
          aria-label={t`Fermer le tableau des runes`}
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
          onClick={onClose}
        >
          <X aria-hidden strokeWidth={2} />
        </Button>
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
        {RUNE_FAMILIES.map((family) => {
          return (
            <tbody
              key={family.name}
              className="rune-family"
              data-family={family.name}
            >
              <tr>
                <th scope="colgroup" colSpan={5} className="rune-clan">
                  {i18n._(family.label)}
                </th>
              </tr>
              {family.rows.map((row) => {
                const stat = i18n._(row.stat)

                return <RuneLine key={stat} stat={stat} row={row} />
              })}
            </tbody>
          )
        })}
      </table>
    </div>
  )
}
