import { Keyboard, Layers, Move, RotateCcw } from 'lucide-react'
import { t } from '@lingui/core/macro'
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
  const everywhereLabel = t`Afficher sur tous les personnages connectés`

  const accelerator =
    shortcuts.find((shortcut) => {
      return shortcut.action === 'runeTable'
    })?.accelerator ?? null

  return (
    <Screen
      title={t`Tableau des runes`}
      subtitle={t`Les poids des runes, affichés par-dessus le jeu. Plus besoin d’aller les chercher ailleurs pendant que vous cassez.`}
    >
      {accelerator === null ? (
        <Note className="mb-3">{t`Sans touches, le tableau ne s’affiche plus. Posez-en dans l’écran Raccourcis.`}</Note>
      ) : null}
      <Panel className="mb-3">
        <FieldRow
          label={t`Raccourci`}
          description={t`Depuis une fenêtre du jeu, et nulle part ailleurs.`}
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
          title={t`Où il se montre`}
          description={t`Le tableau ne s’affiche que sur le personnage où vous l’avez ouvert.`}
        />
        <FieldRow
          label={everywhereLabel}
          description={t`En général, un seul personnage forge.`}
          icon={
            <Layers className="size-glyph" strokeWidth={1.75} aria-hidden />
          }
        >
          <Switch
            checked={runeTable.everywhere}
            aria-label={everywhereLabel}
            onCheckedChange={(everywhere) => {
              run(setRuneTableEverywhere(everywhere))
            }}
          />
        </FieldRow>
        <FieldRow
          label={t`Remettre à sa position initiale`}
          description={t`Si vous l’avez poussé hors de l’écran, il revient en haut à droite du client.`}
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
            {t({ message: 'Remettre', context: 'tableau des runes' })}
          </Button>
        </FieldRow>
      </Panel>
      {IS_APPLE ? (
        <Note className="mt-3">{t`Le tableau ne s’affiche pas sur un client en plein écran. Forgez dans une fenêtre agrandie.`}</Note>
      ) : null}
    </Screen>
  )
}
