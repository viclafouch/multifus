import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RUNE_FAMILIES } from '@/constants/runes'
import { strings } from '@/constants/strings'
import type { useWindowDrag } from '@/hooks/use-window-drag'
import { RuneLine } from '@/screens/rune-table-window/rune-line'

type RuneSheetProps = Readonly<{
  drag: ReturnType<typeof useWindowDrag>
  look: number
  onClose: () => void
  ref: React.Ref<HTMLDivElement>
}>

export const RuneSheet = ({ drag, look, onClose, ref }: RuneSheetProps) => {
  const words = strings.runeTable.sheet

  return (
    <div
      {...drag}
      ref={ref}
      role="group"
      aria-label={words.title}
      className="rune-plate"
      style={{ opacity: look }}
    >
      <header className="rune-crown">
        <h1 className="min-w-0 flex-1 truncate text-row leading-none font-medium">
          {words.title}
        </h1>
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground hover:bg-destructive/20 hover:text-foreground"
          aria-label={words.close}
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
          onClick={onClose}
        >
          <X aria-hidden strokeWidth={2} />
        </Button>
      </header>
      <table className="rune-grid">
        <caption className="sr-only">{words.caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="rune-head">
              {words.stat}
            </th>
            <th scope="col" className="rune-head" data-weight>
              {words.simple}
            </th>
            <th scope="col" className="rune-head" data-weight>
              {words.pa}
            </th>
            <th scope="col" className="rune-head" data-weight>
              {words.ra}
            </th>
            <th scope="col" className="rune-head" data-weight>
              {words.unit}
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
                  {words.families[family.name]}
                </th>
              </tr>
              {family.rows.map((row) => {
                return <RuneLine key={row.stat} row={row} />
              })}
            </tbody>
          )
        })}
      </table>
    </div>
  )
}
