import type { VariantProps } from 'class-variance-authority'
import { Expand, X } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button, type buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

type ButtonLook = VariantProps<typeof buttonVariants>

type ShotDialogProps = Readonly<{
  source: string
  alt: string
  variant?: ButtonLook['variant']
  size?: ButtonLook['size']
}>

export const ShotDialog = ({
  source,
  alt,
  variant = 'ghost',
  size = 'sm'
}: ShotDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant={variant} size={size} />}>
        <Expand aria-hidden />
        {t`Voir l’image`}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="pointer-events-none inset-0 flex max-w-none translate-x-0 translate-y-0 items-center justify-center bg-transparent p-6 ring-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="pointer-events-auto relative min-w-0 rounded-xl bg-popover p-2 ring-1 ring-foreground/10">
          <img
            src={source}
            alt={alt}
            className="max-h-fullshot max-w-full rounded-sm object-contain"
          />
          <DialogClose
            render={
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={t`Fermer`}
                className="absolute top-3.5 right-3.5 shadow-xs"
              />
            }
          >
            <X aria-hidden />
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
