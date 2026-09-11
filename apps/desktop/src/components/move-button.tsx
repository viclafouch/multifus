import { t } from '@lingui/core/macro'
import { Button, type ButtonLook } from '@multifus/retro'
import type { Snapshot } from '@/@types/snapshot'
import { useOpenHelp } from '@/components/help-context'
import { useGoToMap } from '@/components/map-navigation-provider'
import type { Move } from '@/constants/moves'
import { MAXIMIZE_ANCHOR } from '@/constants/moves'
import { showAnchor } from '@/lib/anchor'
import { restartOnboarding } from '@/lib/multifus'

type MoveButtonProps = Readonly<{
  move: Move
  onLeave: () => void
  run: (action: Promise<Snapshot>) => void
  size?: ButtonLook['size']
}>

export const MoveButton = ({
  move,
  onLeave,
  run,
  size = 'tight'
}: MoveButtonProps) => {
  const goToMap = useGoToMap()
  const openHelp = useOpenHelp()

  const moves = {
    autoFocus: {
      label: t`Aller à l’AutoFocus`,
      act: () => {
        onLeave()
        goToMap('autoFocus')
      }
    },
    maximizeRow: {
      label: t`Voir le réglage`,
      act: () => {
        showAnchor(MAXIMIZE_ANCHOR, onLeave)
      }
    },
    onboarding: {
      label: t`Revoir la mise en route`,
      act: () => {
        onLeave()
        run(restartOnboarding())
      }
    },
    questions: {
      label: t`Voir les questions fréquentes`,
      act: () => {
        openHelp('questions')
      }
    },
    shortcuts: {
      label: t`Aller aux Raccourcis`,
      act: () => {
        onLeave()
        goToMap('shortcuts')
      }
    }
  } as const satisfies Record<Move, { label: string; act: () => void }>

  const { label, act } = moves[move]

  return (
    <Button variant="slate" size={size} onClick={act}>
      {label}
    </Button>
  )
}
