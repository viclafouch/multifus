import React from 'react'
import { t } from '@lingui/core/macro'
import { Flag } from '@multifus/retro'
import type { Language } from '@/@types/language'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { LANGUAGES, LANGUAGE_LABELS } from '@/constants/language'
import { setLanguage } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

type LanguagePickerProps = Readonly<{
  current: Language
}>

export const LanguagePicker = ({ current }: LanguagePickerProps) => {
  const [asked, setAsked] = React.useState<Language | null>(null)

  return (
    <>
      <ul
        aria-label={t`La langue de Multifus`}
        className="flex items-center gap-1.5"
      >
        {LANGUAGES.map((language) => {
          return (
            <li key={language} className="flex">
              <button
                type="button"
                lang={language}
                aria-pressed={language === current}
                aria-label={LANGUAGE_LABELS[language]}
                title={LANGUAGE_LABELS[language]}
                onClick={() => {
                  if (language !== current) {
                    setAsked(language)
                  }
                }}
                className="ensign h-4 w-6 sighted"
              >
                <Flag language={language} />
              </button>
            </li>
          )
        })}
      </ul>
      {asked === null ? null : (
        <LanguageConfirm
          asked={asked}
          onGiveUp={() => {
            setAsked(null)
          }}
        />
      )}
    </>
  )
}

type LanguageConfirmProps = Readonly<{
  asked: Language
  onGiveUp: () => void
}>

const LanguageConfirm = ({ asked, onGiveUp }: LanguageConfirmProps) => {
  const name = LANGUAGE_LABELS[asked]

  return (
    <AlertDialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onGiveUp()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t`Passer Multifus en ${name} ?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {t`Multifus se recharge d’un coup et vous laisse sur l’écran où vous êtes. Vos clients Dofus Retro ne bougent pas.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t`Annuler`}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setLanguage(asked).catch(ignore)
            }}
          >
            {t`Changer la langue`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
