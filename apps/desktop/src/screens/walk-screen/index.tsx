import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WalkStatus } from '@/@types/walk'
import { Note } from '@/components/layout/note'
import { StageScreen } from '@/components/layout/stage-screen'
import { IS_APPLE } from '@/constants/keyboard'
import { MAP_NAMES } from '@/constants/world'
import { BannerDialog } from '@/screens/walk-screen/banner-dialog'
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
    <StageScreen
      title={i18n._(MAP_NAMES.walk)}
      subtitle={t`Un clic déplace le personnage que vous avez devant vous, et la fenêtre du suivant prend sa place.`}
      caption={t`Un clic gauche dans le jeu : le personnage marche, la fenêtre du suivant passe devant, et la bannière se pose dans le coin.`}
      loop={null}
    >
      <StatePanel walk={walk} accelerator={accelerator} run={run} />
      <BannerDialog place={walk.banner} run={run} />
      {IS_APPLE ? (
        <Note>{t`Sur Mac, Multifus tourne mieux sans plein écran : gardez tous vos clients Dofus Retro sur le même bureau, en fenêtre agrandie.`}</Note>
      ) : null}
    </StageScreen>
  )
}
