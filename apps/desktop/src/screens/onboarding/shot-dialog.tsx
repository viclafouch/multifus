import { Expand, X } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { ButtonLook } from '@/components/retro/button'
import { Button } from '@/components/retro/button'
import { ShotSheet } from '@/components/shot-sheet'
import { Dialog, DialogClose, DialogTrigger } from '@/components/ui/dialog'

type ShotDialogProps = Readonly<{
  source: string
  alt: string
  variant?: ButtonLook['variant']
  size?: ButtonLook['size']
}>

export const ShotDialog = ({
  source,
  alt,
  variant = 'bare',
  size = 'sm'
}: ShotDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant={variant} size={size} />}>
        <Expand aria-hidden />
        {t`Voir l’image`}
      </DialogTrigger>
      <ShotSheet alt={alt}>
        <div className="pointer-events-auto relative min-w-0 rounded-xl bg-popover p-2 ring-1 ring-foreground/10">
          <img
            src={source}
            alt={alt}
            className="max-h-fullshot max-w-full rounded-sm object-contain"
          />
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
        </div>
      </ShotSheet>
    </Dialog>
  )
}
