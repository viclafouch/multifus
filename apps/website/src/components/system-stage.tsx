import type { PageId } from '@/@types/page'
import type { SystemId } from '@/@types/system'
import { Band } from '@/components/band'
import { DownloadCall } from '@/components/download-call'
import { PageHead } from '@/components/page-head'
import { SystemShot } from '@/components/system-shot'
import { FOLD_ANCHOR } from '@/constants/site'

type SystemStageProps = Readonly<{
  page: PageId
  system: SystemId
}>

export const SystemStage = ({ page, system }: SystemStageProps) => {
  return (
    <Band
      id={FOLD_ANCHOR}
      className="marquee grid gap-x-12 gap-y-10 pt-rest-sm pb-rest"
    >
      <div className="flex flex-col gap-7">
        <PageHead page={page} />
        <DownloadCall className="surface-4" />
      </div>
      <div className="unveil">
        <SystemShot system={system} />
      </div>
    </Band>
  )
}
