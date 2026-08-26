import React from 'react'
import { Ban, ChevronLeft, X } from 'lucide-react'
import type { Character, Class, Gender, Portrait } from '@/@types/roster'
import { CharacterMedallion } from '@/components/character-medallion'
import { ClassVignette } from '@/components/class-vignette'
import { Legend } from '@/components/layout/legend'
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

const GENDERS = ['male', 'female'] as const satisfies readonly Gender[]

const UNANSWERED_GENDER = 'male'

type ClassDialogProps = Readonly<{
  character: Character
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSetGender: (gender: Gender | null) => void
  onSetClass: (characterClass: Class | null) => void
  onSetPortrait: (portrait: Portrait) => void
}>

export const ClassDialog = ({
  character,
  isOpen,
  onOpenChange,
  onSetGender,
  onSetClass,
  onSetPortrait
}: ClassDialogProps) => {
  const { nickname, gender } = character
  const words = strings.characters
  const [asked, setAsked] = React.useState<Class | null>(null)

  const handleOpenChange = (isNowOpen: boolean) => {
    if (!isNowOpen) {
      setAsked(null)
    }

    onOpenChange(isNowOpen)
  }

  const handlePickClass = (candidate: Class | null) => {
    if (candidate !== null && gender === null) {
      setAsked(candidate)

      return
    }

    onSetClass(candidate)
    handleOpenChange(false)
  }

  const handlePickGender = (candidate: Gender) => {
    if (asked !== null) {
      onSetPortrait({ class: asked, gender: candidate })
    }

    handleOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
            {asked === null ? null : (
              <DialogDescription className="text-note">
                {words.classDialogWhich(words.classes[asked])}
              </DialogDescription>
            )}
          </div>
          <DialogClose
            aria-label={words.classDialogClose}
            className="absolute top-4 right-4"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <X aria-hidden strokeWidth={2} />
          </DialogClose>
        </DialogHeader>
        {asked === null ? (
          <ClassStep
            character={character}
            onPickClass={handlePickClass}
            onSetGender={onSetGender}
          />
        ) : (
          <GenderStep
            asked={asked}
            onPickGender={handlePickGender}
            onGoBack={() => {
              setAsked(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type ClassStepProps = Readonly<{
  character: Character
  onPickClass: (characterClass: Class | null) => void
  onSetGender: (gender: Gender | null) => void
}>

const ClassStep = ({ character, onPickClass, onSetGender }: ClassStepProps) => {
  const { nickname, gender } = character
  const words = strings.characters

  return (
    <>
      <div className="flex flex-col gap-2">
        <Legend>{words.classDialogClasses}</Legend>
        <ul className="grid grid-cols-4 gap-1.5">
          {CLASSES.map((candidate) => {
            return (
              <li key={candidate}>
                <ClassVignette
                  label={words.classes[candidate]}
                  isCurrent={character.class === candidate}
                  ariaLabel={words.classLabel(
                    nickname,
                    words.classes[candidate]
                  )}
                  onPick={() => {
                    onPickClass(candidate)
                  }}
                >
                  <img
                    alt=""
                    src={
                      CLASS_PORTRAITS[candidate][gender ?? UNANSWERED_GENDER]
                    }
                    className="size-vignette rounded-md object-cover"
                  />
                </ClassVignette>
              </li>
            )
          })}
          <li>
            <ClassVignette
              label={words.noClass}
              isCurrent={false}
              ariaLabel={words.noClassLabel(nickname)}
              onPick={() => {
                onPickClass(null)
              }}
            >
              <span className="flex size-vignette items-center justify-center rounded-md border border-dashed border-border text-muted-foreground/60">
                <Ban aria-hidden className="size-4" strokeWidth={1.75} />
              </span>
            </ClassVignette>
          </li>
        </ul>
      </div>
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
    </>
  )
}

type GenderStepProps = Readonly<{
  asked: Class
  onPickGender: (gender: Gender) => void
  onGoBack: () => void
}>

const GenderStep = ({ asked, onPickGender, onGoBack }: GenderStepProps) => {
  const words = strings.characters

  return (
    <>
      <ul className="flex justify-center gap-3">
        {GENDERS.map((candidate) => {
          return (
            <li key={candidate}>
              <Button
                variant="ghost"
                aria-label={words.classGenderLabel(
                  words.classes[asked],
                  candidate
                )}
                className="h-auto flex-col gap-2 rounded-xl p-3 hover:bg-primary/10"
                onClick={() => {
                  onPickGender(candidate)
                }}
              >
                <img
                  alt=""
                  src={CLASS_PORTRAITS[asked][candidate]}
                  className="size-face rounded-lg object-cover"
                />
                <span className="text-row font-medium">
                  {words.genders[candidate]}
                </span>
              </Button>
            </li>
          )
        })}
      </ul>
      <Button
        variant="ghost"
        size="xs"
        className="mx-auto text-muted-foreground"
        onClick={onGoBack}
      >
        <ChevronLeft aria-hidden strokeWidth={2} />
        {words.classDialogBack}
      </Button>
    </>
  )
}
