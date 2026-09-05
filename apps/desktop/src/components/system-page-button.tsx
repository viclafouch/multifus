import type { SystemPage } from '@/@types/onboarding'
import type { ButtonLook } from '@/components/button-look'
import { LinkButton } from '@/components/link-button'
import { openLabel } from '@/helpers/wording'
import { openSystemPage } from '@/lib/multifus'

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
