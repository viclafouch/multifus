import React from 'react'
import { GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/react/sortable'
import type { Character, Class, Gender, Portrait } from '@/@types/roster'
import { CharacterMedallion } from '@/components/character-medallion'
import { ClassDialog } from '@/components/class-dialog'
import { RemoveButton } from '@/components/remove-button'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { strings } from '@/constants/strings'
import { portraitFor } from '@/helpers/portrait'
import {
  characterPortraitLabel,
  characterPortraitTooltip,
  characterState,
  characterSubLine
} from '@/helpers/wording'

const STAGGER_MS = 38

type RowActions = Readonly<{
  handleToggleAsleep: (nickname: string) => void
  handleSetGender: (nickname: string, gender: Gender | null) => void
  handleSetClass: (nickname: string, characterClass: Class | null) => void
  handleSetPortrait: (nickname: string, portrait: Portrait) => void
  handleRemove: (nickname: string) => void
}>

type CharacterRowProps = Readonly<{
  character: Character
  rank: number | null
  index: number
  actions: RowActions
}>

export const CharacterRow = ({
  character,
  rank,
  index,
  actions
}: CharacterRowProps) => {
  const { nickname, asleep, online } = character
  const { ref, handleRef, isDragging } = useSortable({ id: nickname, index })
  const [isEntering, setIsEntering] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const portraitLabel = characterPortraitLabel(character)
  const portraitTooltip = characterPortraitTooltip(character)

  return (
    <li
      ref={ref}
      data-entering={isEntering ? '' : undefined}
      data-dragging={isDragging ? '' : undefined}
      data-offline={online ? undefined : ''}
      style={{ animationDelay: `${index * STAGGER_MS}ms` }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          setIsEntering(false)
        }
      }}
      className="transition-row group relative flex h-row items-center gap-3 rounded-lg border border-transparent px-2 hover:border-border hover:bg-card/70 data-dragging:border-primary/35 data-dragging:bg-card data-dragging:shadow-lg data-entering:rise data-offline:dimmed"
    >
      <Button
        ref={handleRef}
        variant="ghost"
        size="icon-xs"
        aria-label={strings.characters.handle(nickname)}
        className="cursor-grab touch-none text-muted-foreground/30 group-hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical strokeWidth={1.75} />
      </Button>
      <span
        aria-hidden
        className="w-5 shrink-0 text-right font-mono text-log tabular-nums text-muted-foreground/45"
      >
        {rank === null
          ? strings.characters.rankNone
          : String(rank).padStart(2, '0')}
      </span>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" />}
          aria-label={portraitLabel}
          className="group/portrait size-fit shrink-0 rounded-full border-0 p-0.5"
          onClick={() => {
            setIsDialogOpen(true)
          }}
        >
          <CharacterMedallion
            portrait={portraitFor(character)}
            state={characterState(character)}
          />
        </TooltipTrigger>
        <TooltipContent>{portraitTooltip}</TooltipContent>
      </Tooltip>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="selectable truncate text-row font-medium group-data-offline:text-muted-foreground">
          {nickname}
        </p>
        <p className="text-micro font-medium tracking-micro text-muted-foreground/65 uppercase">
          {characterSubLine(character)}
        </p>
      </div>
      <Switch
        checked={online && !asleep}
        disabled={!online}
        aria-label={strings.characters.cycleToggle(nickname)}
        onCheckedChange={() => {
          actions.handleToggleAsleep(nickname)
        }}
      />
      <span className="flex w-6 shrink-0 justify-end">
        {online ? null : (
          <RemoveButton
            label={strings.characters.remove(nickname)}
            onRemove={() => {
              actions.handleRemove(nickname)
            }}
          />
        )}
      </span>
      <ClassDialog
        character={character}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSetGender={(gender) => {
          actions.handleSetGender(nickname, gender)
        }}
        onSetClass={(characterClass) => {
          actions.handleSetClass(nickname, characterClass)
        }}
        onSetPortrait={(portrait) => {
          actions.handleSetPortrait(nickname, portrait)
        }}
      />
    </li>
  )
}
