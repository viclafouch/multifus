import { t } from '@lingui/core/macro'
import { Button } from '@/components/retro/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import { LoopStage } from '@/components/world/loop-stage'

type LoopDialogProps = Readonly<{
  title: string
  description: string
  caption: string
  source: string | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}>

export const LoopDialog = ({
  title,
  description,
  caption,
  source,
  isOpen,
  onOpenChange
}: LoopDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="block overflow-clip bg-transparent p-0 ring-0 sm:max-w-roll"
      >
        <LoopStage source={source} caption={caption} />
        <div
          aria-hidden
          className="hem-deep pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-5">
          <DialogTitle className="font-carve text-bar tracking-wide uppercase">
            {title}
          </DialogTitle>
          <DialogDescription className="max-w-tale">
            {description}
          </DialogDescription>
          <DialogClose render={<Button variant="leaf" className="mt-1" />}>
            {t`J’ai compris`}
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
