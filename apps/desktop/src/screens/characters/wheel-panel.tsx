import React from 'react'
import { i18n } from '@lingui/core'
import { plural, t } from '@lingui/core/macro'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WheelSize } from '@/@types/wheel'
import { GaugeRow } from '@/components/gauge-row'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Button } from '@/components/retro/button'
import { ShortcutRecall } from '@/components/shortcut-recall'
import { HELD, SHORTCUT_ACTIONS } from '@/constants/shortcuts'
import { DEMO_FEWEST, DEMO_USUAL } from '@/constants/wheel'
import { useDraft } from '@/hooks/use-draft'
import { useLateOpening } from '@/hooks/use-late-opening'
import { useWheelDisplay } from '@/hooks/use-wheel-display'
import {
  previewWheel,
  setWheelDiameter,
  setWheelLoopSeen
} from '@/lib/multifus'
import { WheelDrawing } from '@/screens/characters/wheel-drawing'
import { WheelLoopDialog } from '@/screens/characters/wheel-loop-dialog'

type WheelPanelProps = Readonly<{
  wheel: WheelSize
  shortcuts: readonly ShortcutBinding[]
  run: (action: Promise<Snapshot>) => void
}>

export const WheelPanel = ({ wheel, shortcuts, run }: WheelPanelProps) => {
  const screen = useWheelDisplay()
  const { draft, setDraft } = useDraft(wheel.diameter)
  const [crowd, setCrowd] = React.useState(DEMO_USUAL)
  const loop = useLateOpening(!wheel.loopSeen)
  const isSeenTold = React.useRef(false)

  const accelerator =
    shortcuts.find((shortcut) => {
      return shortcut.action === 'wheel'
    })?.accelerator ?? null

  const handleLoopOpenChange = (isOpen: boolean) => {
    loop.setIsOpen(isOpen)

    if (!isOpen && !wheel.loopSeen && !isSeenTold.current) {
      isSeenTold.current = true
      run(setWheelLoopSeen())
    }
  }

  return (
    <Panel>
      <PanelHeader
        title={i18n._(SHORTCUT_ACTIONS.wheel.label)}
        description={t`Maintenez vos touches depuis une fenêtre du jeu, et nulle part ailleurs. La roue s’ouvre au milieu de l’écran : visez une tête, lâchez ou cliquez, sa fenêtre passe devant.`}
      >
        <ShortcutRecall accelerator={accelerator} mention={i18n._(HELD)} />
        <Button
          variant="slate"
          size="sm"
          onClick={() => {
            loop.setIsOpen(true)
          }}
        >
          {t`Revoir la vidéo`}
        </Button>
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
          label={t`Le monde`}
          reading={plural(crowd, { one: 'Tout seul', other: 'À #' })}
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
      <WheelLoopDialog
        isOpen={loop.isOpen}
        onOpenChange={handleLoopOpenChange}
      />
    </Panel>
  )
}
