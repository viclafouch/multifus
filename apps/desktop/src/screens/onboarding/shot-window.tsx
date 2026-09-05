import { t } from '@lingui/core/macro'
import { Button, type ButtonLook } from '@/components/retro/button'
import { ShotSheet } from '@/components/shot-sheet'
import { Dialog, DialogClose, DialogTrigger } from '@/components/ui/dialog'

type ShotWindowProps = Readonly<{
  source: string
  alt: string
  variant: ButtonLook['variant']
  size: ButtonLook['size']
}>

export const ShotWindow = ({ source, alt, variant, size }: ShotWindowProps) => {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant={variant} size={size} />}>
        {t`Voir l’image`}
      </DialogTrigger>
      <ShotSheet alt={alt}>
        <div className="frame pointer-events-auto relative min-w-0 rounded-sm p-2">
          <img
            src={source}
            alt={alt}
            className="max-h-shot max-w-full object-contain"
          />
          <DialogClose
            render={
              <Button
                variant="slate"
                size="sm"
                className="absolute top-4 right-4"
              />
            }
          >
            {t`Fermer`}
          </DialogClose>
        </div>
      </ShotSheet>
    </Dialog>
  )
}
