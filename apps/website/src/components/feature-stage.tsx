import type { LoopId, PageId } from '@/@types/page'
import { Blazon } from '@/components/blazon'
import { LoopPlate } from '@/components/loop-plate'

type FeatureStageProps = Readonly<{
  page: PageId
  loop: LoopId
}>

export const FeatureStage = ({ page, loop }: FeatureStageProps) => {
  return (
    <div className="flex w-full flex-col gap-8">
      <Blazon page={page} />
      <LoopPlate loop={loop} />
    </div>
  )
}
