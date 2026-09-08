import React from 'react'
import { X } from 'lucide-react'
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
  const [isPlaying, setIsPlaying] = React.useState(false)

  const isReady = source === null || isPlaying

  const handleReady = () => {
    setIsPlaying(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        steady
        showCloseButton={false}
        data-ready={isReady ? '' : undefined}
        className="reel block overflow-clip bg-transparent p-0 ring-0 sm:max-w-loop"
      >
        <LoopStage source={source} caption={caption} onReady={handleReady} />
        <div
          aria-hidden
          className="reel-veil hem-deep pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-4">
          <DialogTitle className="reel-word font-carve text-deed tracking-wide uppercase">
            {title}
          </DialogTitle>
          <DialogDescription className="reel-word max-w-tale">
            {description}
          </DialogDescription>
        </div>
        <DialogClose
          render={
            <Button
              variant="slate"
              size="icon"
              aria-label={t`Fermer`}
              className="absolute top-3.5 right-3.5 shadow-xs"
            />
          }
        >
          <X aria-hidden />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
