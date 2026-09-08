import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { Character } from '@/@types/roster'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { WheelSize } from '@/@types/wheel'
import { EmptyRoster } from '@/components/empty-roster'
import { Screen } from '@/components/layout/screen'
import { MAP_NAMES } from '@/constants/world'
import { RosterPanel } from '@/screens/characters/roster-panel'
import { WheelPanel } from '@/screens/characters/wheel-panel'

type CharactersScreenProps = Readonly<{
  characters: readonly Character[]
  paintPortraits: boolean
  wheel: WheelSize
  shortcuts: readonly ShortcutBinding[]
  run: (action: Promise<Snapshot>) => void
}>

export const CharactersScreen = ({
  characters,
  paintPortraits,
  wheel,
  shortcuts,
  run
}: CharactersScreenProps) => {
  const isRosterEmpty = characters.length === 0

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
      <WheelPanel wheel={wheel} shortcuts={shortcuts} run={run} />
    </Screen>
  )
}
