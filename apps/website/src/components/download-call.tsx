import { cn } from '@multifus/retro'
import { DownloadButton } from '@/components/download-button'
import { PerkList } from '@/components/perk-list'
import { PERKS } from '@/constants/wording'

type DownloadCallProps = Readonly<{
  className?: string
}>

export const DownloadCall = ({ className }: DownloadCallProps) => {
  return (
    <div className={cn('flex flex-col items-start gap-3.5', className)}>
      <DownloadButton />
      <PerkList perks={PERKS} />
    </div>
  )
}
