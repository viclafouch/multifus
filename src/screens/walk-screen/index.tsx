import { Footprints, Keyboard } from 'lucide-react'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WalkStatus } from '@/@types/walk'
import { KeyCap } from '@/components/key-cap'
import { FieldRow } from '@/components/layout/field-row'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { Switch } from '@/components/ui/switch'
import { strings } from '@/constants/strings'
import { acceleratorParts } from '@/helpers/accelerator'
import { setWalkEnabled } from '@/lib/multifus'
import { BannerPanel } from '@/screens/walk-screen/banner-panel'

type WalkScreenProps = Readonly<{
  walk: WalkStatus
  shortcuts: readonly ShortcutBinding[]
  run: (action: Promise<Snapshot>) => void
}>

export const WalkScreen = ({ walk, shortcuts, run }: WalkScreenProps) => {
  const accelerator =
    shortcuts.find((shortcut) => {
      return shortcut.action === 'walk'
    })?.accelerator ?? null

  return (
    <Screen title={strings.walk.title} subtitle={strings.walk.subtitle}>
      <Panel className="mb-3">
        <FieldRow
          label={strings.walk.switchLabel}
          description={strings.walk.switchDescription}
          icon={
            <Footprints className="size-glyph" strokeWidth={1.75} aria-hidden />
          }
        >
          <Switch
            checked={walk.enabled}
            aria-label={strings.walk.switchLabel}
            onCheckedChange={(enabled) => {
              run(setWalkEnabled(enabled))
            }}
          />
        </FieldRow>
        <FieldRow
          label={strings.walk.shortcutLabel}
          description={strings.walk.shortcutDescription}
          icon={
            <Keyboard className="size-glyph" strokeWidth={1.75} aria-hidden />
          }
        >
          <ShortcutRecall accelerator={accelerator} />
        </FieldRow>
      </Panel>
      <BannerPanel place={walk.banner} run={run} />
      <Note>{strings.walk.startsOff}</Note>
      <Note>{strings.walk.privacy}</Note>
    </Screen>
  )
}

type ShortcutRecallProps = Readonly<{
  accelerator: string | null
}>

const ShortcutRecall = ({ accelerator }: ShortcutRecallProps) => {
  if (accelerator === null) {
    return (
      <span className="text-note text-muted-foreground">
        {strings.walk.shortcutEmpty}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1">
      {acceleratorParts(accelerator).map((token) => {
        return <KeyCap key={token} token={token} />
      })}
    </span>
  )
}
