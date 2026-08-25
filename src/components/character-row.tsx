import React from 'react'
import { GripVertical, Mars, Venus } from 'lucide-react'
import type { Character, Gender } from '@/@types/roster'
import { Lamp } from '@/components/lamp'
import { RemoveButton } from '@/components/remove-button'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { strings } from '@/constants/strings'
import { characterState, characterStateLine } from '@/helpers/wording'

const STAGGER_MS = 38

type RowActions = Readonly<{
  handleMove: (nickname: string, delta: number) => void
  handleDragStart: (nickname: string) => void
  handleDragOver: (nickname: string) => void
  handleDragEnd: () => void
  handleToggleAsleep: (nickname: string) => void
  handleSetGender: (nickname: string, gender: Gender | null) => void
  handleRemove: (nickname: string) => void
}>

type CharacterRowProps = Readonly<{
  character: Character
  rank: number | null
  index: number
  isDragging: boolean
  actions: RowActions
}>

export const CharacterRow = ({
  character,
  rank,
  index,
  isDragging,
  actions
}: CharacterRowProps) => {
  const { nickname, gender, asleep, online } = character

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      actions.handleMove(nickname, -1)
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      actions.handleMove(nickname, 1)
    }
  }

  const handleDragStart = (event: React.DragEvent<HTMLLIElement>) => {
    const row = event.currentTarget
    const { left, top } = row.getBoundingClientRect()

    event.dataTransfer.setDragImage(
      row,
      event.clientX - left,
      event.clientY - top
    )
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', nickname)

    actions.handleDragStart(nickname)
  }

  const handleDragOver = (event: React.DragEvent<HTMLLIElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    actions.handleDragOver(nickname)
  }

  return (
    <li
      draggable
      data-dragging={isDragging ? '' : undefined}
      data-offline={online ? undefined : ''}
      style={{ animationDelay: `${index * STAGGER_MS}ms` }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={actions.handleDragEnd}
      onDrop={handleDrop}
      className="rise transition-row group relative flex h-row items-center gap-3 rounded-lg border border-transparent px-2 hover:border-border hover:bg-card/70 data-dragging:border-primary/35 data-dragging:bg-card data-dragging:shadow-lg data-offline:dimmed"
    >
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={strings.characters.handle(nickname)}
        onKeyDown={handleKeyDown}
        className="cursor-grab text-muted-foreground/30 group-hover:text-muted-foreground/70 active:cursor-grabbing"
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
      <Lamp state={characterState(character)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="selectable truncate text-row font-medium group-data-offline:text-muted-foreground">
          {nickname}
        </p>
        <p className="text-micro font-medium tracking-micro text-muted-foreground/65 uppercase">
          {characterStateLine(character)}
        </p>
      </div>
      <div className="flex shrink-0 items-center rounded-md border border-border/60 p-0.5">
        <GenderButton
          nickname={nickname}
          gender="male"
          current={gender}
          onSetGender={actions.handleSetGender}
        />
        <GenderButton
          nickname={nickname}
          gender="female"
          current={gender}
          onSetGender={actions.handleSetGender}
        />
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
    </li>
  )
}

type GenderButtonProps = Readonly<{
  nickname: string
  gender: Gender
  current: Gender | null
  onSetGender: (nickname: string, gender: Gender | null) => void
}>

const GenderButton = ({
  nickname,
  gender,
  current,
  onSetGender
}: GenderButtonProps) => {
  const isActive = current === gender
  const Icon = gender === 'male' ? Mars : Venus

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-pressed={isActive}
      aria-label={strings.characters.genderLabel(nickname, gender)}
      onClick={() => {
        onSetGender(nickname, isActive ? null : gender)
      }}
      className="text-muted-foreground/40 aria-pressed:bg-primary/15 aria-pressed:text-primary"
    >
      <Icon strokeWidth={2} />
    </Button>
  )
}

const handleDrop = (event: React.DragEvent<HTMLLIElement>) => {
  event.preventDefault()
}
