import { DragDropProvider } from '@dnd-kit/react'
import type { Character, Class, Gender, Portrait } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { CharacterRow } from '@/components/character-row'
import { EmptyRoster } from '@/components/empty-roster'
import { GenderToggle } from '@/components/gender-toggle'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Screen } from '@/components/layout/screen'
import { GENDERS } from '@/constants/roster'
import { strings } from '@/constants/strings'
import {
  genderGroupOf,
  genderlessNicknames,
  matchIsInCycle
} from '@/helpers/cycle'
import { genderGroupHint, missingGenderLine } from '@/helpers/wording'
import { useCycleOrder } from '@/hooks/use-cycle-order'
import { DRAG_ACCESSIBILITY, DRAG_MODIFIERS } from '@/lib/drag'
import {
  removeCharacter,
  setClass,
  setGender,
  setGenderExcluded,
  setMain,
  toggleExcluded
} from '@/lib/multifus'

type CharactersScreenProps = Readonly<{
  characters: readonly Character[]
  paintPortraits: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const CharactersScreen = ({
  characters,
  paintPortraits,
  run
}: CharactersScreenProps) => {
  const cycle = useCycleOrder({ characters, run })

  const actions = {
    handleToggleExcluded: (nickname: string) => {
      run(toggleExcluded(nickname))
    },
    handleSetMain: (nickname: string, main: boolean) => {
      run(setMain(nickname, main))
    },
    handleSetGender: (nickname: string, gender: Gender | null) => {
      run(setGender(nickname, gender))
    },
    handleSetClass: (nickname: string, characterClass: Class | null) => {
      run(setClass(nickname, characterClass))
    },
    handleSetPortrait: (nickname: string, portrait: Portrait) => {
      run(
        setClass(nickname, portrait.class).then(() => {
          return setGender(nickname, portrait.gender)
        })
      )
    },
    handleRemove: (nickname: string) => {
      run(removeCharacter(nickname))
    }
  }

  if (characters.length === 0) {
    return (
      <Screen title={strings.characters.title}>
        <EmptyRoster />
      </Screen>
    )
  }

  const note = missingGenderLine(genderlessNicknames(characters))

  return (
    <Screen
      title={strings.characters.title}
      subtitle={strings.characters.subtitle}
    >
      <DragDropProvider
        modifiers={DRAG_MODIFIERS}
        plugins={(defaults) => {
          return [...defaults, DRAG_ACCESSIBILITY]
        }}
        onDragStart={cycle.handleDragStart}
        onDragEnd={cycle.handleDragEnd}
      >
        <Panel>
          <PanelHeader
            title={strings.characters.exclusionTitle}
            description={strings.characters.exclusionDescription}
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
                  label={strings.characters.groupLabel[gender]}
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
                  actions={actions}
                />
              )
            })}
          </ol>
        </Panel>
      </DragDropProvider>
    </Screen>
  )
}

const rankOf = (rows: readonly Character[], character: Character) => {
  if (!matchIsInCycle(character)) {
    return null
  }

  return rows.filter(matchIsInCycle).indexOf(character) + 1
}
