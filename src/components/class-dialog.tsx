import React from 'react'
import { Ban, X } from 'lucide-react'
import type { Character, Class, Gender } from '@/@types/roster'
import { CharacterMedallion } from '@/components/character-medallion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { CLASSES, CLASS_PORTRAITS } from '@/constants/classes'
import { strings } from '@/constants/strings'
import { portraitFor } from '@/helpers/portrait'
import { characterState } from '@/helpers/wording'
import { cn } from '@/lib/utils'

const GENDERS = ['male', 'female'] as const satisfies readonly Gender[]

type ClassDialogProps = Readonly<{
  character: Character
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSetGender: (gender: Gender | null) => void
  onSetClass: (characterClass: Class | null) => void
}>

export const ClassDialog = ({
  character,
  isOpen,
  onOpenChange,
  onSetGender,
  onSetClass
}: ClassDialogProps) => {
  const { nickname, gender } = character
  const words = strings.characters

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-5 sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3">
          <CharacterMedallion
            nickname={nickname}
            portrait={portraitFor(character)}
            state={characterState(character)}
          />
          <div className="flex min-w-0 flex-col gap-0.5 pr-8">
            <DialogTitle className="truncate text-heading">
              {nickname}
            </DialogTitle>
            {gender === null ? (
              <DialogDescription className="text-note">
                {words.classDialogNeedsGender}
              </DialogDescription>
            ) : null}
          </div>
          <DialogClose
            aria-label={words.classDialogClose}
            className="absolute top-4 right-4"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <X aria-hidden strokeWidth={2} />
          </DialogClose>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Legend>{words.classDialogGender}</Legend>
          <div className="flex w-fit items-center rounded-md border border-border/60 p-0.5">
            {GENDERS.map((candidate) => {
              return (
                <Button
                  key={candidate}
                  variant="ghost"
                  size="xs"
                  aria-pressed={gender === candidate}
                  className="px-3 aria-pressed:bg-primary/15 aria-pressed:text-primary"
                  onClick={() => {
                    onSetGender(gender === candidate ? null : candidate)
                  }}
                >
                  {words.genders[candidate]}
                </Button>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Legend>{words.classDialogClasses}</Legend>
          <ul className="grid grid-cols-4 gap-1.5">
            {CLASSES.map((candidate) => {
              return (
                <li key={candidate}>
                  <Vignette
                    label={words.classes[candidate]}
                    isCurrent={character.class === candidate}
                    isReachable={gender !== null}
                    ariaLabel={words.classLabel(
                      nickname,
                      words.classes[candidate]
                    )}
                    onPick={() => {
                      onSetClass(candidate)
                    }}
                  >
                    <img
                      alt=""
                      src={CLASS_PORTRAITS[candidate][gender ?? 'male']}
                      className="size-vignette rounded-md object-cover"
                    />
                  </Vignette>
                </li>
              )
            })}
            <li>
              <Vignette
                label={words.noClass}
                isCurrent={false}
                isReachable
                ariaLabel={words.noClassLabel(nickname)}
                onPick={() => {
                  onSetClass(null)
                }}
              >
                <span className="flex size-vignette items-center justify-center rounded-md border border-dashed border-border text-muted-foreground/60">
                  <Ban aria-hidden className="size-4" strokeWidth={1.75} />
                </span>
              </Vignette>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type LegendProps = Readonly<{
  children: React.ReactNode
}>

const Legend = ({ children }: LegendProps) => {
  return (
    <p className="text-micro font-medium tracking-micro text-muted-foreground/70 uppercase">
      {children}
    </p>
  )
}

type VignetteProps = Readonly<{
  label: string
  ariaLabel: string
  isCurrent: boolean
  isReachable: boolean
  onPick: () => void
  children: React.ReactNode
}>

const Vignette = ({
  label,
  ariaLabel,
  isCurrent,
  isReachable,
  onPick,
  children
}: VignetteProps) => {
  return (
    <Button
      variant="ghost"
      aria-label={ariaLabel}
      aria-pressed={isCurrent}
      disabled={!isReachable}
      onClick={onPick}
      className={cn(
        'h-auto w-full flex-col gap-1 rounded-lg p-1.5 whitespace-normal',
        'aria-pressed:bg-primary/12 aria-pressed:ring-1 aria-pressed:ring-primary/40',
        isReachable ? null : 'grayscale'
      )}
    >
      {children}
      <span className="w-full truncate text-center text-mini text-muted-foreground">
        {label}
      </span>
    </Button>
  )
}
