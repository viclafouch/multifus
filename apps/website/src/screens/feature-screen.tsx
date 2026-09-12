import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { FeatureStage } from '@/components/feature-stage'
import { LimitPlate } from '@/components/limit-plate'
import { Opening } from '@/components/opening'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { Passage } from '@/components/passage'
import { PAGE_BODIES } from '@/constants/bodies'
import { PAGES } from '@/constants/pages'
import { FOLD_ANCHOR } from '@/constants/site'

export const FeatureScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { loop, kin } = PAGES[page]
  const body = PAGE_BODIES[page]

  return (
    <>
      {loop === null ? (
        <Band id={FOLD_ANCHOR} className="pt-12 pb-2">
          <PageHead page={page} />
        </Band>
      ) : (
        <Band id={FOLD_ANCHOR} className="max-w-theatre pt-10 pb-0">
          <FeatureStage page={page} loop={loop} />
        </Band>
      )}
      {body === null ? null : (
        <>
          <Band className="max-w-theatre pt-14 pb-10">
            <Opening>{i18n._(body.lead)}</Opening>
          </Band>
          <Band className="reveal grid gap-12 py-10 lg:grid-cols-2 lg:gap-16">
            {body.passages.map((passage) => {
              return <Passage key={i18n._(passage.title)} passage={passage} />
            })}
          </Band>
          <Band className="reveal py-14">
            <LimitPlate limit={body.limit} />
          </Band>
        </>
      )}
      {kin.length === 0 ? null : <PageKin pages={kin} />}
    </>
  )
}
