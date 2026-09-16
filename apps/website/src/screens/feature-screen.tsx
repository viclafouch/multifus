import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { BoonCard } from '@/components/boon-card'
import { CaveatList } from '@/components/caveat-list'
import { FeatureStage } from '@/components/feature-stage'
import { Opening } from '@/components/opening'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
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
        <Band id={FOLD_ANCHOR} className="pt-10 pb-0">
          <FeatureStage page={page} loop={loop} />
        </Band>
      )}
      {body === null ? null : (
        <>
          <Band className="pt-14 pb-8">
            <Opening>{i18n._(body.lead)}</Opening>
          </Band>
          <Band className="reveal py-8">
            <ul className="grid gap-drop sm:grid-cols-2">
              {body.boons.map((boon) => {
                return <BoonCard key={i18n._(boon.title)} boon={boon} />
              })}
            </ul>
          </Band>
          {body.caveats.length === 0 ? null : (
            <Band className="reveal pt-8 pb-16">
              <CaveatList caveats={body.caveats} />
            </Band>
          )}
        </>
      )}
      {kin.length === 0 ? null : <PageKin pages={kin} />}
    </>
  )
}
