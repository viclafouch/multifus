import { X } from 'lucide-react'
import { Accordion } from '@base-ui/react/accordion'
import { t } from '@lingui/core/macro'
import type { Snapshot } from '@/@types/snapshot'
import { QuestionRow } from '@/components/question-row'
import { Button } from '@/components/retro/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { QUESTIONS } from '@/constants/questions'

type QuestionsDialogProps = Readonly<{
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  run: (action: Promise<Snapshot>) => void
}>

export const QuestionsDialog = ({
  isOpen,
  onOpenChange,
  run
}: QuestionsDialogProps) => {
  const leave = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-4 sm:max-w-roll">
        <DialogHeader>
          <DialogTitle className="text-bar tracking-wide uppercase">
            {t`Questions fréquentes`}
          </DialogTitle>
          <DialogDescription>
            {t`Cliquez une question pour voir la réponse.`}
          </DialogDescription>
        </DialogHeader>
        <Accordion.Root className="-mx-2 max-h-answers overflow-y-auto px-2">
          {QUESTIONS.map((question) => {
            return (
              <QuestionRow
                key={question}
                question={question}
                onLeave={leave}
                run={run}
              />
            )
          })}
        </Accordion.Root>
        <DialogClose
          render={
            <Button
              variant="slate"
              size="icon"
              aria-label={t`Fermer`}
              className="absolute top-3.5 right-3.5"
            />
          }
        >
          <X aria-hidden />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
