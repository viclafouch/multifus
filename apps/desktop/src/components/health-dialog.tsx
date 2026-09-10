import { t } from '@lingui/core/macro'
import type { Onboarding } from '@/@types/onboarding'
import type { Snapshot } from '@/@types/snapshot'
import { MoveButton } from '@/components/move-button'
import { Button } from '@/components/retro/button'
import { StepState } from '@/components/retro/step-state'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { healthReport } from '@/helpers/health'

type HealthDialogProps = Readonly<{
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onboarding: Onboarding
  isAutoFocusEnabled: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const HealthDialog = ({
  isOpen,
  onOpenChange,
  onboarding,
  isAutoFocusEnabled,
  run
}: HealthDialogProps) => {
  const report = healthReport({ onboarding, isAutoFocusEnabled })

  const leave = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-scene">
        <DialogHeader>
          <DialogTitle className="text-bar tracking-wide uppercase">
            {t`Vérification`}
          </DialogTitle>
          {report.check === null ? (
            <p className="text-aside font-medium text-cream">
              {report.verdict}
            </p>
          ) : (
            <StepState check={report.check} line={report.verdict} />
          )}
          <DialogDescription>{report.body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {report.move === null ? null : (
            <MoveButton
              move={report.move}
              onLeave={leave}
              run={run}
              size="sm"
            />
          )}
          <DialogClose render={<Button variant="slate" size="sm" />}>
            {t`Fermer`}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
