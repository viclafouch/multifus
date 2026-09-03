import { t } from '@lingui/core/macro'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WalkStatus } from '@/@types/walk'
import { Note } from '@/components/layout/note'
import { Screen } from '@/components/layout/screen'
import { IS_APPLE } from '@/constants/keyboard'
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
      title={t`Déplacement rapide`}
      subtitle={t`Un clic déplace le personnage que vous avez devant vous, et la fenêtre du suivant prend sa place. Vous recliquez au même endroit, et toute la team change de map sans toucher au clavier.`}
    >
      {IS_APPLE ? (
        <Note className="mb-4">{t`Sur Mac, Multifus tourne mieux sans plein écran : gardez tous vos clients Dofus Retro sur le même bureau, en fenêtre agrandie.`}</Note>
      ) : null}
      <StatePanel walk={walk} accelerator={accelerator} run={run} />
      <BannerPanel place={walk.banner} run={run} />
    </Screen>
  )
}
