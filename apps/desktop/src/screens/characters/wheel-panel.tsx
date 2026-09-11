import React from 'react'
import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import { Button, Panel } from '@multifus/retro'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WheelSize } from '@/@types/wheel'
import { GaugeRow } from '@/components/gauge-row'
import { Note } from '@/components/layout/note'
import { PanelHeader } from '@/components/layout/panel-header'
import { ShortcutRecall } from '@/components/shortcut-recall'
import { HELD, SHORTCUT_ACTIONS } from '@/constants/shortcuts'
import { DEMO_FEWEST, DEMO_USUAL } from '@/constants/wheel'
import { useDraft } from '@/hooks/use-draft'
import { useWheelDisplay } from '@/hooks/use-wheel-display'
import { previewWheel, setWheelDiameter } from '@/lib/multifus'
import { WheelDrawing } from '@/screens/characters/wheel-drawing'

type WheelPanelProps = Readonly<{
  wheel: WheelSize
  shortcuts: readonly ShortcutBinding[]
  run: (action: Promise<Snapshot>) => void
}>

export const WheelPanel = ({ wheel, shortcuts, run }: WheelPanelProps) => {
  const screen = useWheelDisplay()
  const { draft, setDraft } = useDraft(wheel.diameter)
  const [crowd, setCrowd] = React.useState(DEMO_USUAL)

  const accelerator =
    shortcuts.find((shortcut) => {
      return shortcut.action === 'wheel'
    })?.accelerator ?? null

  return (
    <Panel>
      <PanelHeader
        title={i18n._(SHORTCUT_ACTIONS.wheel.label)}
        description={t`Maintenez vos touches dans le jeu, et nulle part ailleurs. Visez une tête au milieu de l’écran, lâchez : ce personnage s’affiche.`}
      >
        <ShortcutRecall accelerator={accelerator} mention={i18n._(HELD)} />
      </PanelHeader>
      <div className="flex flex-col gap-3 px-4 py-4">
        {accelerator === null ? (
          <Note>{t`Sans touches, la roue n’existe pas. Posez-en dans l’écran Raccourcis.`}</Note>
        ) : null}
        <WheelDrawing
          screen={screen}
          size={{ ...wheel, diameter: draft }}
          crowd={crowd}
        />
        <GaugeRow
          label={t`Taille`}
          reading={t`${draft} px`}
          current={draft}
          min={wheel.smallest}
          max={wheel.widest}
          step={wheel.step}
          onChange={setDraft}
          onCommit={(diameter) => {
            run(setWheelDiameter(diameter))
          }}
        />
        <GaugeRow
          label={t`Personnages`}
          reading={new Intl.NumberFormat(i18n.locale).format(crowd)}
          current={crowd}
          min={DEMO_FEWEST}
          max={wheel.demo.length}
          step={1}
          onChange={setCrowd}
          onCommit={setCrowd}
        />
        <div className="flex items-center gap-3 pt-1">
          <p className="min-w-0 flex-1 text-aside text-khaki">
            {t`De faux personnages ici comme à l’essai, les vôtres en jeu.`}
          </p>
          <Button
            variant="slate"
            size="sm"
            onClick={() => {
              run(previewWheel(crowd))
            }}
          >
            {t`Voir en vrai`}
          </Button>
        </div>
      </div>
    </Panel>
  )
}
