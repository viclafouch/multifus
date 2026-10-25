import { t } from '@lingui/core/macro'
import type { ButtonLook } from '@multifus/retro'
import { LinkButton } from '@/components/link-button'
import { openAboutLink } from '@/lib/multifus'

type DownloadButtonProps = Readonly<{
  variant?: ButtonLook['variant']
  size?: ButtonLook['size']
}>

export const DownloadButton = ({ variant, size }: DownloadButtonProps) => {
  return (
    <LinkButton
      label={t`Télécharger`}
      variant={variant}
      size={size}
      onOpen={() => {
        return openAboutLink('download')
      }}
    />
  )
}
