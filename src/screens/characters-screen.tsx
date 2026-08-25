import { Mars, RefreshCw, Venus } from 'lucide-react'
import { DragDropProvider } from '@dnd-kit/react'
import type { Character, Gender } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { CharacterRow } from '@/components/character-row'
import { EmptyState } from '@/components/layout/empty-state'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { useCycleOrder } from '@/hooks/use-cycle-order'
import { DRAG_ACCESSIBILITY, DRAG_MODIFIERS } from '@/lib/drag'
import {
  refresh,
  removeCharacter,
  setGender,
  setGenderAsleep,
  toggleAsleep
} from '@/lib/multifus'

type CharactersScreenProps = Readonly<{
  characters: readonly Character[]
  run: (action: Promise<Snapshot>) => void
}>

export const CharactersScreen = ({
  characters,
  run
}: CharactersScreenProps) => {
  const cycle = useCycleOrder({ characters, run })

  const actions = {
    handleToggleAsleep: (nickname: string) => {
      run(toggleAsleep(nickname))
    },
    handleSetGender: (nickname: string, gender: Gender | null) => {
      run(setGender(nickname, gender))
    },
    handleRemove: (nickname: string) => {
      run(removeCharacter(nickname))
    }
  }

  const hasGender = characters.some((character) => {
    return character.gender !== null
  })

  if (characters.length === 0) {
    return (
      <Screen title={strings.characters.title}>
        <EmptyState
          title={strings.characters.emptyTitle}
          body={strings.characters.emptyBody}
          hint={strings.characters.emptyHint}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              run(refresh())
            }}
          >
            <RefreshCw aria-hidden />
            {strings.characters.refresh}
          </Button>
        </EmptyState>
      </Screen>
    )
  }

  return (
    <Screen
      title={strings.characters.title}
      subtitle={strings.characters.subtitle}
    >
      <GroupedActions
        onSet={(gender, asleep) => {
          run(setGenderAsleep(gender, asleep))
        }}
      />
      <DragDropProvider
        modifiers={DRAG_MODIFIERS}
        plugins={(defaults) => {
          return [...defaults, DRAG_ACCESSIBILITY]
        }}
        onDragStart={cycle.handleDragStart}
        onDragEnd={cycle.handleDragEnd}
      >
        <Panel className="p-1.5">
          <ol>
            {cycle.rows.map((character, index) => {
              return (
                <CharacterRow
                  key={character.nickname}
                  character={character}
                  rank={rankOf(cycle.rows, character)}
                  index={index}
                  actions={actions}
                />
              )
            })}
          </ol>
        </Panel>
      </DragDropProvider>
      {hasGender ? null : <Note>{strings.characters.noGenderYet}</Note>}
    </Screen>
  )
}

type GroupedActionsProps = Readonly<{
  onSet: (gender: Gender, asleep: boolean) => void
}>

const GroupedActions = ({ onSet }: GroupedActionsProps) => {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="text-mini font-medium tracking-micro text-muted-foreground/70 uppercase">
        {strings.characters.groupedActions}
      </span>
      <GroupedAction gender="male" onSet={onSet} />
      <GroupedAction gender="female" onSet={onSet} />
    </div>
  )
}

type GroupedActionProps = Readonly<{
  gender: Gender
  onSet: (gender: Gender, asleep: boolean) => void
}>

const GroupedAction = ({ gender, onSet }: GroupedActionProps) => {
  const Icon = gender === 'male' ? Mars : Venus

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border/70 bg-card/40 py-1 pr-1 pl-2">
      <Icon
        aria-hidden
        className="size-3.5 text-muted-foreground"
        strokeWidth={2}
      />
      <span className="text-log text-muted-foreground">
        {strings.characters.groupLabel[gender]}
      </span>
      <Button
        variant="ghost"
        size="xs"
        aria-label={strings.characters.sleepGroupLabel[gender]}
        onClick={() => {
          onSet(gender, true)
        }}
      >
        {strings.characters.sleepGroup}
      </Button>
      <Button
        variant="ghost"
        size="xs"
        aria-label={strings.characters.wakeGroupLabel[gender]}
        onClick={() => {
          onSet(gender, false)
        }}
      >
        {strings.characters.wakeGroup}
      </Button>
    </div>
  )
}

const rankOf = (rows: readonly Character[], character: Character) => {
  if (!character.online || character.asleep) {
    return null
  }

  const inCycle = rows.filter((other) => {
    return other.online && !other.asleep
  })

  return inCycle.indexOf(character) + 1
}
