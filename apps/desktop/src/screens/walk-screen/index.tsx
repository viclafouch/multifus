import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WalkStatus } from '@/@types/walk'
import { Note } from '@/components/layout/note'
import { Screen } from '@/components/layout/screen'
import { IS_APPLE } from '@/constants/keyboard'
import { strings } from '@/constants/strings'
import { BannerPanel } from '@/screens/walk-screen/banner-panel'
import { StatePanel } from '@/screens/walk-screen/state-panel'

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
      {IS_APPLE ? <Note className="mb-4">{strings.maximize.note}</Note> : null}
      <StatePanel walk={walk} accelerator={accelerator} run={run} />
      <BannerPanel place={walk.banner} run={run} />
    </Screen>
  )
}
