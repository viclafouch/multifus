import { t } from '@lingui/core/macro'
import { Button } from '@/components/retro/button'
import { cn } from '@/lib/utils'

type LoopButtonProps = Readonly<{
  onOpen: () => void
  className?: string
}>

export const LoopButton = ({ onOpen, className }: LoopButtonProps) => {
  return (
    <div className={cn('steady flex justify-center', className)}>
      <Button variant="slate" size="sm" onClick={onOpen}>
        {t`Revoir la vidéo`}
      </Button>
    </div>
  )
}
