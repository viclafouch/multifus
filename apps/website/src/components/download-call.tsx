import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import { DownloadButton } from '@/components/download-button'
import { FREE_AND_SIGNED } from '@/constants/wording'

type DownloadCallProps = Readonly<{
  className?: string
}>

export const DownloadCall = ({ className }: DownloadCallProps) => {
  const { i18n } = useLingui()

  return (
    <div className={cn('flex flex-col items-start gap-2.5', className)}>
      <DownloadButton />
      <p className="engraved text-aside text-khaki">
        {i18n._(FREE_AND_SIGNED)}
      </p>
    </div>
  )
}
