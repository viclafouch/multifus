import { useLingui } from '@lingui/react'
import type { LoopId, PageId } from '@/@types/page'
import { Blazon } from '@/components/blazon'
import { LoopPlate } from '@/components/loop-plate'
import { PAGE_PROMISES } from '@/constants/wording'

type FeatureStageProps = Readonly<{
  page: PageId
  loop: LoopId
}>

export const FeatureStage = ({ page, loop }: FeatureStageProps) => {
  const { i18n } = useLingui()

  return (
    <div className="flex w-full flex-col gap-8">
      <Blazon page={page} />
      <LoopPlate loop={loop} caption={i18n._(PAGE_PROMISES[page])} />
    </div>
  )
}
