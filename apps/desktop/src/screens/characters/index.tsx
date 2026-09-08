import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { Character } from '@/@types/roster'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WheelSize } from '@/@types/wheel'
import wheelLoop from '@/assets/ankama/wheel-loop.mp4'
import { EmptyRoster } from '@/components/empty-roster'
import { Screen } from '@/components/layout/screen'
import { LoopButton } from '@/components/loop-button'
import { LoopDialog } from '@/components/loop-dialog'
import { MAP_NAMES } from '@/constants/world'
import { useLoopOnce } from '@/hooks/use-loop-once'
import { RosterPanel } from '@/screens/characters/roster-panel'
import { WheelPanel } from '@/screens/characters/wheel-panel'

type CharactersScreenProps = Readonly<{
  characters: readonly Character[]
  paintPortraits: boolean
  wheel: WheelSize
  shortcuts: readonly ShortcutBinding[]
  isLoopSeen: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const CharactersScreen = ({
  characters,
  paintPortraits,
  wheel,
  shortcuts,
  isLoopSeen,
  run
}: CharactersScreenProps) => {
  const isRosterEmpty = characters.length === 0
  const loop = useLoopOnce({ loop: 'wheel', isSeen: isLoopSeen, run })

  return (
    <Screen
      title={i18n._(MAP_NAMES.characters)}
      subtitle={
        isRosterEmpty
          ? undefined
          : t`Vos personnages, l’ordre où vous passez de l’un à l’autre, et la roue qui les affiche au milieu de l’écran.`
      }
    >
      {isRosterEmpty ? (
        <EmptyRoster />
      ) : (
        <RosterPanel
          characters={characters}
          paintPortraits={paintPortraits}
          run={run}
        />
      )}
      <LoopButton onOpen={loop.handleOpen} className="pt-4" />
      <WheelPanel wheel={wheel} shortcuts={shortcuts} run={run} />
      <LoopDialog
        title={t`La roue des personnages`}
        description={t`Maintenez vos touches dans le jeu, visez une tête, lâchez : sa fenêtre passe devant sans que la souris quitte le combat.`}
        caption={t`Les touches maintenues dans le jeu : la roue s’ouvre au milieu de l’écran, la tête visée s’allume, et sa fenêtre passe devant.`}
        source={wheelLoop}
        isOpen={loop.isOpen}
        onOpenChange={loop.handleOpenChange}
      />
    </Screen>
  )
}
