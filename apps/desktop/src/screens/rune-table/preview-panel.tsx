import { Eye } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { RuneTableStatus } from '@/@types/rune'
import type { Snapshot } from '@/@types/snapshot'
import { GaugeRow } from '@/components/gauge-row'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Button } from '@/components/ui/button'
import { useDraft } from '@/hooks/use-draft'
import {
  fadeRuneTable,
  previewRuneTable,
  setRuneTableTransparency,
  setRuneTableWidth,
  sizeRuneTable
} from '@/lib/multifus'
import { ignore } from '@/lib/utils'

type PreviewPanelProps = Readonly<{
  runeTable: RuneTableStatus
  run: (action: Promise<Snapshot>) => void
}>

export const PreviewPanel = ({ runeTable, run }: PreviewPanelProps) => {
  const size = useDraft(runeTable.width)
  const veil = useDraft(runeTable.transparency)

  return (
    <Panel className="mb-3">
      <PanelHeader
        title={t`L’aperçu`}
        description={t`Le vrai tableau, posé au milieu de Multifus. Une jauge pour la taille, une pour ce qu’on voit du jeu derrière.`}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            run(previewRuneTable())
          }}
        >
          <Eye aria-hidden />
          {t`Voir en vrai`}
        </Button>
      </PanelHeader>
      <div className="flex flex-col gap-2.5 px-4 py-4">
        <GaugeRow
          label={t`Taille`}
          reading={t`${size.draft} px`}
          current={size.draft}
          min={runeTable.narrowest}
          max={runeTable.widest}
          step={runeTable.step}
          onChange={(width) => {
            size.setDraft(width)
            sizeRuneTable(width).catch(ignore)
          }}
          onCommit={(width) => {
            run(setRuneTableWidth(width))
          }}
        />
        <GaugeRow
          label={t`Transparence`}
          reading={t`${veil.draft} %`}
          current={veil.draft}
          min={0}
          max={runeTable.clearest}
          step={runeTable.veilStep}
          onChange={(transparency) => {
            veil.setDraft(transparency)
            fadeRuneTable(transparency).catch(ignore)
          }}
          onCommit={(transparency) => {
            run(setRuneTableTransparency(transparency))
          }}
        />
      </div>
    </Panel>
  )
}
