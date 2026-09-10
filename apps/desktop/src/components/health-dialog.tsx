import { t } from '@lingui/core/macro'
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
import type { HealthSubject } from '@/helpers/health'
import { healthReport } from '@/helpers/health'
import { useHealthCheck } from '@/hooks/use-health-check'

type HealthDialogProps = HealthSubject &
  Readonly<{
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    run: (action: Promise<Snapshot>) => void
  }>

export const HealthDialog = ({
  isOpen,
  onOpenChange,
  onboarding,
  isAutoFocusEnabled,
  run
}: HealthDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-scene">
        <HealthVerdict
          onboarding={onboarding}
          isAutoFocusEnabled={isAutoFocusEnabled}
          run={run}
          onLeave={() => {
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

type HealthVerdictProps = HealthSubject &
  Readonly<{
    run: (action: Promise<Snapshot>) => void
    onLeave: () => void
  }>

const HealthVerdict = ({
  onboarding,
  isAutoFocusEnabled,
  run,
  onLeave
}: HealthVerdictProps) => {
  const { read, readAgain } = useHealthCheck(run)
  const report = healthReport({ onboarding, isAutoFocusEnabled, read })

  return (
    <>
      <DialogHeader aria-busy={read.kind === 'reading'}>
        <DialogTitle className="text-bar tracking-wide uppercase">
          {t`Vérification`}
        </DialogTitle>
        {report.check === null ? (
          <p className="text-aside font-medium text-cream">{report.verdict}</p>
        ) : (
          <StepState check={report.check} line={report.verdict} />
        )}
        <DialogDescription>{report.body}</DialogDescription>
        {read.kind === 'failed' ? (
          <span className="selectable font-mono text-log wrap-anywhere text-khaki">
            {read.detail}
          </span>
        ) : null}
      </DialogHeader>
      <DialogFooter>
        {read.kind === 'failed' ? (
          <Button variant="slate" size="sm" onClick={readAgain}>
            {t`Réessayer`}
          </Button>
        ) : null}
        {report.move === null ? null : (
          <MoveButton
            move={report.move}
            onLeave={onLeave}
            run={run}
            size="sm"
          />
        )}
        <DialogClose render={<Button variant="slate" size="sm" />}>
          {t`Fermer`}
        </DialogClose>
      </DialogFooter>
    </>
  )
}
