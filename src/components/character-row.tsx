import React from 'react'
import { GripVertical, Mars, Venus, X } from 'lucide-react'
import { Lamp } from '@/components/lamp'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { Character, Gender } from '@/lib/multifus'
import { strings } from '@/lib/strings'

/** How long each row waits before rising, so the list powers up in sequence. */
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
  /** Its place in the cycle, or `null` when the cycle does not stop on it. */
  rank: number | null
  /** Its place in the list, which only sets the entrance delay. */
  index: number
  isDragging: boolean
  actions: RowActions
}>

/**
 * One character of the roster.
 *
 * The row is dragged to change the cycle order, and the grip is a real button so
 * that the arrow keys do the same thing without a mouse. A character that is
 * offline keeps its place, greyed, and is the only one that can be removed: a
 * connected one would walk straight back in on the next scan, minus the gender
 * that had been assigned to it.
 */
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

    // Nothing here used to say what to drag, and left to its own heuristic the
    // webview lifts a slab of the whole interface instead of this one row. The
    // row names itself, and the grab point is kept under the pointer so the
    // ghost sits exactly where the row was rather than jumping to a corner.
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
    // The counterpart of the `effectAllowed` set on the source: without it the
    // pointer keeps the refusal cursor over a row that does accept the drop.
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
      className="rise transition-row group relative flex h-row items-center gap-3 rounded-lg border border-transparent px-2 hover:border-border hover:bg-card/70 data-dragging:border-primary/35 data-dragging:bg-card data-dragging:shadow-lg data-offline:opacity-55"
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
      <Lamp isOnline={online} isAsleep={asleep} />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="selectable truncate text-row font-medium group-data-offline:text-muted-foreground">
          {nickname}
        </p>
        <p className="text-micro font-medium tracking-micro text-muted-foreground/65 uppercase">
          {stateLabel(online, asleep)}
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
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={strings.characters.remove(nickname)}
            onClick={() => {
              actions.handleRemove(nickname)
            }}
            className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
          >
            <X strokeWidth={2.2} />
          </Button>
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

/**
 * Half of the gender toggle. Clicking the one already on takes the gender back
 * off, since a gender assigned by mistake has to be undoable and there is no
 * third button for it.
 */
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

/** The row is a drop target, and a drop target has to say so. */
const handleDrop = (event: React.DragEvent<HTMLLIElement>) => {
  event.preventDefault()
}

const stateLabel = (online: boolean, asleep: boolean) => {
  if (!online) {
    return strings.characters.offline
  }

  return asleep ? strings.characters.asleep : strings.characters.inCycle
}
