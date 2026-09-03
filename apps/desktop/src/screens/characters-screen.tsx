import { DragDropProvider } from '@dnd-kit/react'
import { t } from '@lingui/core/macro'
import type { Character, Class, Color, Gender, Portrait } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { CharacterRow } from '@/components/character-row'
import { EmptyRoster } from '@/components/empty-roster'
import { GenderToggle } from '@/components/gender-toggle'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Screen } from '@/components/layout/screen'
import { GENDERS } from '@/constants/roster'
import { colorHolders } from '@/helpers/colors'
import {
  genderGroupOf,
  genderlessNicknames,
  matchIsInCycle
} from '@/helpers/cycle'
import {
  genderGroupHint,
  genderGroupLabel,
  missingGenderLine
} from '@/helpers/wording'
import { useCycleOrder } from '@/hooks/use-cycle-order'
import { DRAG_MODIFIERS, dragAccessibility } from '@/lib/drag'
import {
  removeCharacter,
  setClass,
  setColor,
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
  const title = t`Personnages`

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
    handleSetColor: (nickname: string, color: Color | null) => {
      run(setColor(nickname, color))
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
      <Screen title={title}>
        <EmptyRoster />
      </Screen>
    )
  }

  const note = missingGenderLine(genderlessNicknames(characters))
  const takenColors = colorHolders(characters)

  return (
    <Screen
      title={title}
      subtitle={t`Tirez une ligne par sa poignée pour changer l’ordre du défilement. Un raccourci vous ramène direct sur votre personnage principal.`}
    >
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
            title={t`Exclusion`}
            description={t`Un personnage exclu est sauté par le défilement et par le Déplacement rapide, et l’AutoFocus ne le fait plus passer devant. Ses messages privés continuent d’arriver.`}
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
    </Screen>
  )
}

const rankOf = (rows: readonly Character[], character: Character) => {
  if (!matchIsInCycle(character)) {
    return null
  }

  return rows.filter(matchIsInCycle).indexOf(character) + 1
}
