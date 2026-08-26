import { Mars, RefreshCw, Venus } from 'lucide-react'
import { DragDropProvider } from '@dnd-kit/react'
import type { Character, Class, Gender, Portrait } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { CharacterRow } from '@/components/character-row'
import { EmptyState } from '@/components/layout/empty-state'
import { Legend } from '@/components/layout/legend'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { strings } from '@/constants/strings'
import { missingGenderLine } from '@/helpers/wording'
import { useCycleOrder } from '@/hooks/use-cycle-order'
import { DRAG_ACCESSIBILITY, DRAG_MODIFIERS } from '@/lib/drag'
import {
  refresh,
  removeCharacter,
  setClass,
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

  const missing = characters
    .filter((character) => {
      return character.online && character.gender === null
    })
    .map((character) => {
      return character.nickname
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
        missing={missing}
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
    </Screen>
  )
}

type GroupedActionsProps = Readonly<{
  missing: readonly string[]
  onSet: (gender: Gender, asleep: boolean) => void
}>

const GroupedActions = ({ missing, onSet }: GroupedActionsProps) => {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <Legend className="text-mini">{strings.characters.groupedActions}</Legend>
      <GroupedAction gender="male" missing={missing} onSet={onSet} />
      <GroupedAction gender="female" missing={missing} onSet={onSet} />
    </div>
  )
}

type GroupedActionProps = Readonly<{
  gender: Gender
  missing: readonly string[]
  onSet: (gender: Gender, asleep: boolean) => void
}>

const GroupedAction = ({ gender, missing, onSet }: GroupedActionProps) => {
  const Icon = gender === 'male' ? Mars : Venus
  const isComplete = missing.length === 0

  const buttons = (
    <div
      aria-hidden={isComplete ? undefined : true}
      data-incomplete={isComplete ? undefined : ''}
      className="flex items-center gap-1.5 rounded-md border border-border/70 bg-card/40 py-1 pr-1 pl-2 data-incomplete:pointer-events-none data-incomplete:opacity-55"
    >
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
        tabIndex={isComplete ? undefined : -1}
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
        tabIndex={isComplete ? undefined : -1}
        aria-label={strings.characters.wakeGroupLabel[gender]}
        onClick={() => {
          onSet(gender, false)
        }}
      >
        {strings.characters.wakeGroup}
      </Button>
    </div>
  )

  if (isComplete) {
    return buttons
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<div />}
        aria-disabled
        aria-label={strings.characters.groupLabel[gender]}
        tabIndex={0}
        className="cursor-not-allowed rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {buttons}
      </TooltipTrigger>
      <TooltipContent>{missingGenderLine(missing)}</TooltipContent>
    </Tooltip>
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
