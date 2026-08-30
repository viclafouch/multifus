import React from 'react'
import { RotateCcw } from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { SectionRow } from '@/components/layout/section-row'
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
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { reset } from '@/lib/multifus'

type ResetPanelProps = Readonly<{
  run: (action: Promise<Snapshot>) => void
}>

export const ResetPanel = ({ run }: ResetPanelProps) => {
  const words = strings.about
  const [isConfirming, setIsConfirming] = React.useState(false)

  return (
    <Panel className="border-destructive/25 bg-destructive/8">
      <SectionRow title={words.resetTitle} description={words.resetBody}>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setIsConfirming(true)
          }}
        >
          <RotateCcw aria-hidden />
          {words.reset}
        </Button>
      </SectionRow>
      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{words.resetConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {words.resetConfirmBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{words.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsConfirming(false)
                run(reset())
              }}
            >
              {words.resetConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  )
}
