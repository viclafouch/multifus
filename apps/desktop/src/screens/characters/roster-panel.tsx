import { DragDropProvider } from '@dnd-kit/react'
import { t } from '@lingui/core/macro'
import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { CharacterRow } from '@/components/character-row'
import { GenderToggle } from '@/components/gender-toggle'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { GENDERS } from '@/constants/roster'
import { colorHolders } from '@/helpers/colors'
import { genderGroupOf, genderlessNicknames, rankOf } from '@/helpers/cycle'
import {
  genderGroupHint,
  genderGroupLabel,
  missingGenderLine
} from '@/helpers/wording'
import { useCycleOrder } from '@/hooks/use-cycle-order'
import { characterMarks } from '@/lib/character-marks'
import { DRAG_MODIFIERS, dragAccessibility } from '@/lib/drag'
import { setGenderExcluded, setMain, toggleExcluded } from '@/lib/multifus'

type RosterPanelProps = Readonly<{
  characters: readonly Character[]
  paintPortraits: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const RosterPanel = ({
  characters,
  paintPortraits,
  run
}: RosterPanelProps) => {
  const cycle = useCycleOrder({ characters, run })
  const note = missingGenderLine(genderlessNicknames(characters))
  const takenColors = colorHolders(characters)

  const actions = {
    ...characterMarks({ run }),
    handleToggleExcluded: (nickname: string) => {
      run(toggleExcluded(nickname))
    },
    handleSetMain: (nickname: string, main: boolean) => {
      run(setMain(nickname, main))
    }
  }

  return (
    <DragDropProvider
      modifiers={DRAG_MODIFIERS}
      plugins={(defaults) => {
        return [...defaults, dragAccessibility()]
      }}
      onDragStart={cycle.handleDragStart}
      onDragEnd={cycle.handleDragEnd}
    >
      <Panel>
        <PanelHeader
          title={t`Votre roster`}
          description={t`Cliquez une tête pour changer sa classe, son sexe ou sa couleur. Tirez une ligne pour changer l’ordre, la croix retire un déconnecté.`}
        >
          {GENDERS.map((gender) => {
            const { isEmpty, isIncluded } = genderGroupOf({
              characters,
              gender
            })

            return (
              <GenderToggle
                key={gender}
                gender={gender}
                isIncluded={isIncluded}
                label={genderGroupLabel(gender)}
                hint={genderGroupHint({ gender, isEmpty, isIncluded })}
                note={note}
                onToggle={() => {
                  run(setGenderExcluded(gender, isIncluded))
                }}
              />
            )
          })}
        </PanelHeader>
        <ol className="p-1.5">
          {cycle.rows.map((character, index) => {
            return (
              <CharacterRow
                key={character.nickname}
                character={character}
                rank={rankOf(cycle.rows, character)}
                index={index}
                paintPortraits={paintPortraits}
                takenColors={takenColors}
                actions={actions}
              />
            )
          })}
        </ol>
      </Panel>
    </DragDropProvider>
  )
}
