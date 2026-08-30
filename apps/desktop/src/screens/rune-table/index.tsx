import { Keyboard, Layers, Move, RotateCcw } from 'lucide-react'
import type { RuneTableStatus } from '@/@types/rune'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Screen } from '@/components/layout/screen'
import { ShortcutRecall } from '@/components/shortcut-recall'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { IS_APPLE } from '@/constants/keyboard'
import { strings } from '@/constants/strings'
import { recallRuneTable, setRuneTableEverywhere } from '@/lib/multifus'
import { PreviewPanel } from '@/screens/rune-table/preview-panel'

type RuneTableScreenProps = Readonly<{
  runeTable: RuneTableStatus
  shortcuts: readonly ShortcutBinding[]
  run: (action: Promise<Snapshot>) => void
}>

export const RuneTableScreen = ({
  runeTable,
  shortcuts,
  run
}: RuneTableScreenProps) => {
  const words = strings.runeTable

  const accelerator =
    shortcuts.find((shortcut) => {
      return shortcut.action === 'runeTable'
    })?.accelerator ?? null

  return (
    <Screen title={words.title} subtitle={words.subtitle}>
      {accelerator === null ? (
        <Note className="mb-3">{words.unbound}</Note>
      ) : null}
      <Panel className="mb-3">
        <FieldRow
          label={words.shortcutLabel}
          description={words.shortcutDescription}
          icon={
            <Keyboard className="size-glyph" strokeWidth={1.75} aria-hidden />
          }
        >
          <ShortcutRecall accelerator={accelerator} />
        </FieldRow>
      </Panel>
      <PreviewPanel runeTable={runeTable} run={run} />
      <Panel>
        <PanelHeader
          title={words.whereTitle}
          description={words.whereDescription}
        />
        <FieldRow
          label={words.everywhereLabel}
          description={words.everywhereNote}
          icon={
            <Layers className="size-glyph" strokeWidth={1.75} aria-hidden />
          }
        >
          <Switch
            checked={runeTable.everywhere}
            aria-label={words.everywhereLabel}
            onCheckedChange={(everywhere) => {
              run(setRuneTableEverywhere(everywhere))
            }}
          />
        </FieldRow>
        <FieldRow
          label={words.recallLabel}
          description={words.recallNote}
          icon={<Move className="size-glyph" strokeWidth={1.75} aria-hidden />}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              run(recallRuneTable())
            }}
          >
            <RotateCcw aria-hidden />
            {words.recall}
          </Button>
        </FieldRow>
      </Panel>
      {IS_APPLE ? <Note className="mt-3">{words.fullScreenNote}</Note> : null}
    </Screen>
  )
}
