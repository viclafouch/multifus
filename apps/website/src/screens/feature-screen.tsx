import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { DownloadButton } from '@/components/download-button'
import { LoopPlate } from '@/components/loop-plate'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PAGES } from '@/constants/pages'
import { PAGE_PROMISES } from '@/constants/wording'

export const FeatureScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { loop, kin } = PAGES[page]

  return (
    <>
      <Band className="pb-8">
        <PageHead page={page} />
        {loop === null ? null : (
          <LoopPlate loop={loop} caption={i18n._(PAGE_PROMISES[page])} />
        )}
      </Band>
      {kin.length === 0 ? null : <PageKin pages={kin} />}
      <Band className="pb-20">
        <DownloadButton />
      </Band>
    </>
  )
}
