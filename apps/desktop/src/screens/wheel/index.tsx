import { Keyboard } from 'lucide-react'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WheelSize } from '@/@types/wheel'
import { FieldRow } from '@/components/layout/field-row'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { ShortcutRecall } from '@/components/shortcut-recall'
import { strings } from '@/constants/strings'
import { useWheelDisplay } from '@/hooks/use-wheel-display'
import { SizePanel } from '@/screens/wheel/size-panel'

type WheelScreenProps = Readonly<{
  wheel: WheelSize
  shortcuts: readonly ShortcutBinding[]
  run: (action: Promise<Snapshot>) => void
}>

export const WheelScreen = ({ wheel, shortcuts, run }: WheelScreenProps) => {
  const screen = useWheelDisplay()
  const words = strings.wheel

  const accelerator =
    shortcuts.find((shortcut) => {
      return shortcut.action === 'wheel'
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
          <ShortcutRecall
            accelerator={accelerator}
            mention={strings.shortcuts.held}
          />
        </FieldRow>
      </Panel>
      <SizePanel size={wheel} screen={screen} run={run} />
    </Screen>
  )
}
