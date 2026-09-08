import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WalkStatus } from '@/@types/walk'
import { Note } from '@/components/layout/note'
import { Screen } from '@/components/layout/screen'
import { IS_APPLE } from '@/constants/keyboard'
import { MAP_NAMES } from '@/constants/world'
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
    <Screen
      title={i18n._(MAP_NAMES.walk)}
      subtitle={t`Un clic déplace le personnage devant vous, et le suivant prend sa place à l’écran.`}
    >
      <StatePanel walk={walk} accelerator={accelerator} run={run} />
      <BannerPanel place={walk.banner} run={run} />
      {IS_APPLE ? (
        <Note>{t`Sur Mac, Multifus tourne mieux sans plein écran : gardez tous vos clients Dofus Retro sur le même bureau, en fenêtre agrandie.`}</Note>
      ) : null}
    </Screen>
  )
}
