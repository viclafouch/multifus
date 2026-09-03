import React from 'react'
import { RotateCcw } from 'lucide-react'
import { t } from '@lingui/core/macro'
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
import { reset } from '@/lib/multifus'

type ResetPanelProps = Readonly<{
  run: (action: Promise<Snapshot>) => void
}>

export const ResetPanel = ({ run }: ResetPanelProps) => {
  const [isConfirming, setIsConfirming] = React.useState(false)

  return (
    <Panel className="border-destructive/25 bg-destructive/8">
      <SectionRow
        title={t`Tout remettre à neuf`}
        description={t`Multifus repart comme au premier lancement. Vos personnages Dofus Retro ne risquent rien.`}
      >
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setIsConfirming(true)
          }}
        >
          <RotateCcw aria-hidden />
          {t`Tout réinitialiser`}
        </Button>
      </SectionRow>
      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t`Tout remettre à neuf ?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {t`Réglages, roster et raccourcis repartent d’origine. Vos personnages connectés reviendront dans la seconde, sans sexe ni classe.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t`Annuler`}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsConfirming(false)
                run(reset())
              }}
            >
              {t`Réinitialiser`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  )
}
