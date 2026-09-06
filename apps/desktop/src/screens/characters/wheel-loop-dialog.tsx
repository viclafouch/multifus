import { t } from '@lingui/core/macro'
import wheelLoop from '@/assets/ankama/wheel-loop.gif'
import { Button } from '@/components/retro/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import { LoopStage } from '@/components/world/loop-stage'

type WheelLoopDialogProps = Readonly<{
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}>

export const WheelLoopDialog = ({
  isOpen,
  onOpenChange
}: WheelLoopDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="relative block overflow-clip bg-transparent p-0 ring-0 sm:max-w-roll"
      >
        <LoopStage
          source={wheelLoop}
          caption={t`Les touches maintenues dans le jeu : la roue s’ouvre au milieu de l’écran, la tête visée s’allume, et sa fenêtre passe devant.`}
        />
        <div
          aria-hidden
          className="hem-deep pointer-events-none absolute inset-x-0 bottom-0 h-3/4"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-5">
          <DialogTitle className="font-carve text-bar tracking-wide uppercase">
            {t`La roue des personnages`}
          </DialogTitle>
          <DialogDescription className="max-w-tale">
            {t`Maintenez vos touches dans le jeu, visez une tête, lâchez : sa fenêtre passe devant sans que la souris quitte le combat.`}
          </DialogDescription>
          <DialogClose
            render={<Button variant="leaf" size="lead" className="mt-1" />}
          >
            {t`J’ai compris`}
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
