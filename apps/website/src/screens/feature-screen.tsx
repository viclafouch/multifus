import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { FeatureStage } from '@/components/feature-stage'
import { PageBody } from '@/components/page-body'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PAGE_BODIES } from '@/constants/bodies'
import { PAGES } from '@/constants/pages'
import { FOLD_ANCHOR } from '@/constants/site'

export const FeatureScreen = ({ page }: PageScreenProps) => {
  const { loop, kin } = PAGES[page]
  const body = PAGE_BODIES[page]

  return (
    <>
      {loop === null ? (
        <Band id={FOLD_ANCHOR} className="pt-rest-sm pb-2">
          <PageHead page={page} />
        </Band>
      ) : (
        <Band id={FOLD_ANCHOR} className="pt-rest-xs pb-0">
          <FeatureStage page={page} loop={loop} />
        </Band>
      )}
      {body === null ? null : <PageBody body={body} />}
      {kin.length === 0 ? null : <PageKin pages={kin} />}
    </>
  )
}
