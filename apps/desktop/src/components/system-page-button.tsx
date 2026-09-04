import type { VariantProps } from 'class-variance-authority'
import type { SystemPage } from '@/@types/onboarding'
import { LinkButton } from '@/components/link-button'
import type { buttonVariants } from '@/components/ui/button'
import { openLabel } from '@/helpers/wording'
import { openSystemPage } from '@/lib/multifus'

type ButtonLook = VariantProps<typeof buttonVariants>

type SystemPageButtonProps = Readonly<{
  page: SystemPage
  variant?: ButtonLook['variant']
  size?: ButtonLook['size']
}>

export const SystemPageButton = ({
  page,
  variant,
  size
}: SystemPageButtonProps) => {
  return (
    <LinkButton
      variant={variant}
      size={size}
      label={openLabel(page)}
      onOpen={() => {
        return openSystemPage(page)
      }}
    />
  )
}
