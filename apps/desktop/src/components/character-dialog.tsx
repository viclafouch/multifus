import React from 'react'
import { Ban, ChevronLeft, X } from 'lucide-react'
import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { Character, Class, Color, Gender, Portrait } from '@/@types/roster'
import { CharacterMedallion } from '@/components/character-medallion'
import { ClassVignette } from '@/components/class-vignette'
import { ColorGrid } from '@/components/color-grid'
import { ColorStripe } from '@/components/color-stripe'
import { GenderSigil } from '@/components/gender-sigil'
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
import { CLASS_LABELS, GENDERS, GENDER_LABELS } from '@/constants/roster'
import type { ColorHolders } from '@/helpers/colors'
import { portraitFor } from '@/helpers/portrait'
import { characterState, dialogNote } from '@/helpers/wording'

const UNANSWERED_GENDER = 'male'

const askedWhich = (asked: Class) => {
  const label = i18n._(CLASS_LABELS[asked])

  return t`${label} : homme ou femme ?`
}

type CharacterDialogProps = Readonly<{
  character: Character
  paintPortraits: boolean
  takenColors: ColorHolders
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSetGender: (gender: Gender | null) => void
  onSetClass: (characterClass: Class | null) => void
  onSetColor: (color: Color | null) => void
  onSetPortrait: (portrait: Portrait) => void
}>

export const CharacterDialog = ({
  character,
  paintPortraits,
  takenColors,
  isOpen,
  onOpenChange,
  onSetGender,
  onSetClass,
  onSetColor,
  onSetPortrait
}: CharacterDialogProps) => {
  const { nickname, gender } = character
  const [asked, setAsked] = React.useState<Class | null>(null)

  const handleCloseComplete = (isNowOpen: boolean) => {
    if (!isNowOpen) {
      setAsked(null)
    }
  }

  const handlePickClass = (candidate: Class | null) => {
    if (candidate !== null && gender === null) {
      setAsked(candidate)

      return
    }

    onSetClass(candidate)
    onOpenChange(false)
  }

  const handlePickGender = (candidate: Gender) => {
    if (asked !== null) {
      onSetPortrait({ class: asked, gender: candidate })
    }

    onOpenChange(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={handleCloseComplete}
    >
      <DialogContent showCloseButton={false} className="gap-5 sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3">
          {character.color === null ? null : (
            <ColorStripe color={character.color} className="h-medallion" />
          )}
          <CharacterMedallion
            portrait={portraitFor(character)}
            state={characterState(character)}
          />
          <div className="flex min-w-0 flex-col gap-0.5 pr-8">
            <DialogTitle className="truncate text-heading">
              {nickname}
            </DialogTitle>
            {asked === null ? null : (
              <DialogDescription className="text-note">
                {askedWhich(asked)}
              </DialogDescription>
            )}
          </div>
          <DialogClose
            aria-label={t`Fermer sans rien changer`}
            className="absolute top-4 right-4"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <X aria-hidden strokeWidth={2} />
          </DialogClose>
        </DialogHeader>
        <div className="dialog-body -mx-1 flex flex-col gap-5 overflow-y-auto px-1">
          {asked === null ? (
            <MarksStep
              character={character}
              takenColors={takenColors}
              note={dialogNote(paintPortraits)}
              onPickClass={handlePickClass}
              onPickColor={onSetColor}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

type MarksStepProps = Readonly<{
  character: Character
  takenColors: ColorHolders
  note: string | null
  onPickClass: (characterClass: Class | null) => void
  onPickColor: (color: Color | null) => void
  onSetGender: (gender: Gender | null) => void
}>

const MarksStep = ({
  character,
  takenColors,
  note,
  onPickClass,
  onPickColor,
  onSetGender
}: MarksStepProps) => {
  const { nickname, gender } = character

  return (
    <>
      <div className="flex flex-col gap-2">
        <Legend>{t`Sexe`}</Legend>
        <ul className="flex gap-2">
          {GENDERS.map((candidate) => {
            return (
              <li key={candidate}>
                <Button
                  variant="ghost"
                  aria-pressed={gender === candidate}
                  className="h-auto flex-col gap-1.5 rounded-lg px-3 py-2 aria-pressed:bg-muted/70"
                  onClick={() => {
                    onSetGender(gender === candidate ? null : candidate)
                  }}
                >
                  <GenderSigil
                    gender={candidate}
                    className="opacity-60 saturate-50 group-hover/button:opacity-100 group-aria-pressed/button:sigil-lit group-aria-pressed/button:opacity-100 group-aria-pressed/button:saturate-100"
                  />
                  <span className="text-mini text-muted-foreground group-aria-pressed/button:text-foreground">
                    {i18n._(GENDER_LABELS[candidate])}
                  </span>
                </Button>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <Legend>{t`Classe`}</Legend>
        <ul className="grid grid-cols-5 gap-1.5">
          {CLASSES.map((candidate) => {
            const label = i18n._(CLASS_LABELS[candidate])

            return (
              <li key={candidate}>
                <ClassVignette
                  label={label}
                  isCurrent={character.class === candidate}
                  ariaLabel={t`Marquer ${nickname} comme ${label}`}
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
              label={t`Aucune`}
              ariaLabel={t`Retirer la classe de ${nickname}`}
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
      <ColorGrid
        nickname={nickname}
        color={character.color}
        takenColors={takenColors}
        onPickColor={onPickColor}
      />
      {note === null ? null : (
        <p className="border-t border-border/60 pt-3.5 text-note text-muted-foreground">
          {note}
        </p>
      )}
    </>
  )
}

type GenderStepProps = Readonly<{
  asked: Class
  onPickGender: (gender: Gender) => void
  onGoBack: () => void
}>

const GenderStep = ({ asked, onPickGender, onGoBack }: GenderStepProps) => {
  const label = i18n._(CLASS_LABELS[asked])

  return (
    <>
      <ul className="flex justify-center gap-3">
        {GENDERS.map((candidate) => {
          return (
            <li key={candidate}>
              <Button
                variant="ghost"
                aria-label={
                  candidate === 'male' ? t`${label} homme` : t`${label} femme`
                }
                className="h-auto flex-col gap-2 rounded-xl p-3 hover:bg-muted/60"
                onClick={() => {
                  onPickGender(candidate)
                }}
              >
                <img
                  alt=""
                  src={CLASS_PORTRAITS[asked][candidate]}
                  className="size-face rounded-lg object-cover"
                />
                <GenderSigil
                  gender={candidate}
                  className="opacity-75 saturate-75 group-hover/button:sigil-lit group-hover/button:opacity-100 group-hover/button:saturate-100"
                />
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
        {t`Changer de classe`}
      </Button>
    </>
  )
}
