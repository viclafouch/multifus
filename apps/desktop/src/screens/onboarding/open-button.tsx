import type { VariantProps } from 'class-variance-authority'
import { Button, type buttonVariants } from '@multifus/retro'
import type { SystemPage } from '@/@types/onboarding'
import { openLabel } from '@/helpers/wording'
import { openSystemPage } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

type ButtonLook = VariantProps<typeof buttonVariants>

type OpenButtonProps = Readonly<{
  page: SystemPage
  variant: ButtonLook['variant']
  size: ButtonLook['size']
}>

export const OpenButton = ({ page, variant, size }: OpenButtonProps) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => {
        openSystemPage(page).catch(ignore)
      }}
    >
      {openLabel(page)}
    </Button>
  )
}
