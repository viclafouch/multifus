import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { DownloadButton } from '@/components/download-button'
import { DownloadCall } from '@/components/download-call'
import { FeatureStage } from '@/components/feature-stage'
import { LimitPlate } from '@/components/limit-plate'
import { Opening } from '@/components/opening'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { Passage } from '@/components/passage'
import { Sheet } from '@/components/sheet'
import { Wash } from '@/components/wash'
import { PAGE_BODIES } from '@/constants/bodies'
import { PAGES } from '@/constants/pages'
import { FOLD_ANCHOR } from '@/constants/site'

export const FeatureScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { loop, kin } = PAGES[page]
  const body = PAGE_BODIES[page]

  return (
    <>
      <Band id={FOLD_ANCHOR} className="max-w-theatre pt-10 pb-0">
        {loop === null ? (
          <Wash className="max-w-roll gap-6">
            <PageHead page={page} />
          </Wash>
        ) : (
          <FeatureStage page={page} loop={loop} />
        )}
      </Band>
      <Sheet>
        {body === null ? null : (
          <>
            <Band className="max-w-theatre grid gap-8 pt-10 pb-12 lg:grid-cols-2 lg:gap-16">
              <DownloadCall />
              <Opening>{i18n._(body.lead)}</Opening>
            </Band>
            <Band className="grid gap-12 pb-6 lg:grid-cols-2">
              {body.passages.map((passage) => {
                return <Passage key={i18n._(passage.title)} passage={passage} />
              })}
            </Band>
            <Band className="reveal py-10">
              <LimitPlate limit={body.limit} />
            </Band>
          </>
        )}
        {kin.length === 0 ? null : <PageKin pages={kin} />}
        <Band className="pt-10 pb-24">
          <DownloadButton />
        </Band>
      </Sheet>
    </>
  )
}
