import { Eye } from 'lucide-react'
import type { RuneTableStatus } from '@/@types/rune'
import type { Snapshot } from '@/@types/snapshot'
import { GaugeRow } from '@/components/gauge-row'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
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
  const words = strings.runeTable

  return (
    <Panel className="mb-3">
      <PanelHeader
        title={words.previewTitle}
        description={words.previewDescription}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            run(previewRuneTable())
          }}
        >
          <Eye aria-hidden />
          {words.tryIt}
        </Button>
      </PanelHeader>
      <div className="flex flex-col gap-2.5 px-4 py-4">
        <GaugeRow
          label={words.sizeLabel}
          reading={words.sizeValue(size.draft)}
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
          label={words.veilLabel}
          reading={words.veilValue(veil.draft)}
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
