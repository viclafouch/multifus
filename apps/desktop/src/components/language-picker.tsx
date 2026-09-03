import React from 'react'
import { Languages } from 'lucide-react'
import { t } from '@lingui/core/macro'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
      <Select
        items={LANGUAGE_LABELS}
        value={current}
        onValueChange={(picked) => {
          if (picked === null || picked === current) {
            return
          }

          setAsked(picked)
        }}
      >
        <SelectTrigger
          size="sm"
          aria-label={t`La langue de Multifus`}
          className="h-6 gap-1 border-transparent px-1.5 text-mini font-normal text-muted-foreground shadow-none hover:bg-accent/60 hover:text-foreground data-popup-open:bg-accent/60 data-popup-open:text-foreground [&>svg:last-child]:size-3"
        >
          <Languages
            className="size-3.5 shrink-0"
            strokeWidth={1.75}
            aria-hidden
          />
          <SelectValue render={<span lang={current} />} />
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false}>
          {LANGUAGES.map((language) => {
            return (
              <SelectItem
                key={language}
                value={language}
                lang={language}
                className="text-note"
              >
                {LANGUAGE_LABELS[language]}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
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
