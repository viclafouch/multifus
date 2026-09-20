import type { MessageDescriptor } from '@lingui/core'
import type { Picture } from '@/@types/media'
import type { PageId } from '@/@types/page'
import { AppShot } from '@/components/app-shot'
import { Band } from '@/components/band'
import { DownloadCall } from '@/components/download-call'
import { PageHead } from '@/components/page-head'
import { FOLD_ANCHOR } from '@/constants/site'

type SystemStageProps = Readonly<{
  page: PageId
  shot: Picture
  alt: MessageDescriptor
  isBare?: boolean
}>

export const SystemStage = ({
  page,
  shot,
  alt,
  isBare = false
}: SystemStageProps) => {
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
        <AppShot shot={shot} alt={alt} isBare={isBare} />
      </div>
    </Band>
  )
}
