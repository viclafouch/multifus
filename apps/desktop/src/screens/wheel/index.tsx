import { Keyboard } from 'lucide-react'
import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WheelSize } from '@/@types/wheel'
import { FieldRow } from '@/components/layout/field-row'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { ShortcutRecall } from '@/components/shortcut-recall'
import { HELD } from '@/constants/shortcuts'
import { useWheelDisplay } from '@/hooks/use-wheel-display'
import { SizePanel } from '@/screens/wheel/size-panel'

type WheelScreenProps = Readonly<{
  wheel: WheelSize
  shortcuts: readonly ShortcutBinding[]
  run: (action: Promise<Snapshot>) => void
}>

export const WheelScreen = ({ wheel, shortcuts, run }: WheelScreenProps) => {
  const screen = useWheelDisplay()

  const accelerator =
    shortcuts.find((shortcut) => {
      return shortcut.action === 'wheel'
    })?.accelerator ?? null

  return (
    <Screen
      title={t`La roue des personnages`}
      subtitle={t`Maintenez vos touches dans le jeu : la roue s’ouvre au milieu de l’écran. Visez une tête, lâchez ou cliquez, la fenêtre passe devant.`}
    >
      {accelerator === null ? (
        <Note className="mb-3">{t`Sans touches, la roue n’existe pas. Posez-en dans l’écran Raccourcis.`}</Note>
      ) : null}
      <Panel className="mb-3">
        <FieldRow
          label={t`Raccourci`}
          description={t`Depuis une fenêtre du jeu, et nulle part ailleurs.`}
          icon={
            <Keyboard className="size-glyph" strokeWidth={1.75} aria-hidden />
          }
        >
          <ShortcutRecall accelerator={accelerator} mention={i18n._(HELD)} />
        </FieldRow>
      </Panel>
      <SizePanel size={wheel} screen={screen} run={run} />
    </Screen>
  )
}
