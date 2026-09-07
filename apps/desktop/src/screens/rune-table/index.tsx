import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { RuneTableStatus } from '@/@types/rune'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Screen } from '@/components/layout/screen'
import { LoopButton } from '@/components/loop-button'
import { LoopDialog } from '@/components/loop-dialog'
import { Button } from '@/components/retro/button'
import { Tick } from '@/components/retro/tick'
import { ShortcutRecall } from '@/components/shortcut-recall'
import { IS_APPLE } from '@/constants/keyboard'
import { MAP_NAMES } from '@/constants/world'
import { useLoopOnce } from '@/hooks/use-loop-once'
import { recallRuneTable, setRuneTableEverywhere } from '@/lib/multifus'
import { PreviewPanel } from '@/screens/rune-table/preview-panel'

type RuneTableScreenProps = Readonly<{
  runeTable: RuneTableStatus
  shortcuts: readonly ShortcutBinding[]
  isLoopSeen: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const RuneTableScreen = ({
  runeTable,
  shortcuts,
  isLoopSeen,
  run
}: RuneTableScreenProps) => {
  const everywhereLabel = t`Afficher sur tous les personnages connectés`
  const loop = useLoopOnce({ loop: 'runeTable', isSeen: isLoopSeen, run })

  const accelerator =
    shortcuts.find((shortcut) => {
      return shortcut.action === 'runeTable'
    })?.accelerator ?? null

  return (
    <Screen
      title={i18n._(MAP_NAMES.runeTable)}
      subtitle={t`Les poids des runes, affichés par-dessus le jeu. Plus besoin d’aller les chercher ailleurs pendant que vous cassez.`}
      action={<LoopButton onOpen={loop.handleOpen} />}
    >
      {accelerator === null ? (
        <Note>{t`Sans touches, le tableau ne s’affiche plus. Posez-en dans l’écran Raccourcis.`}</Note>
      ) : null}
      <Panel>
        <FieldRow
          label={t`Raccourci`}
          description={t`Depuis une fenêtre du jeu, et nulle part ailleurs.`}
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
        >
          <Tick
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
        >
          <Button
            variant="slate"
            size="sm"
            onClick={() => {
              run(recallRuneTable())
            }}
          >
            {t({ message: 'Remettre', context: 'tableau des runes' })}
          </Button>
        </FieldRow>
      </Panel>
      {IS_APPLE ? (
        <Note>{t`Le tableau ne s’affiche pas sur un client en plein écran. Forgez dans une fenêtre agrandie.`}</Note>
      ) : null}
      <LoopDialog
        title={i18n._(MAP_NAMES.runeTable)}
        description={t`Vos touches ouvrent le tableau par-dessus le client où vous cassez. Il reste là, il suit la fenêtre, et les mêmes touches le referment.`}
        caption={t`Les touches frappées pendant une casse : le tableau s’ouvre sur le jeu, les poids sous les yeux, et la souris ne quitte pas l’atelier.`}
        source={null}
        isOpen={loop.isOpen}
        onOpenChange={loop.handleOpenChange}
      />
    </Screen>
  )
}
