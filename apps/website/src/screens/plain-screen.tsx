import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { DownloadButton } from '@/components/download-button'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PAGES } from '@/constants/pages'
import { FOLD_ANCHOR } from '@/constants/site'

export const PlainScreen = ({ page }: PageScreenProps) => {
  const { kin } = PAGES[page]

  return (
    <>
      <Band id={FOLD_ANCHOR} className="pb-8">
        <PageHead page={page} />
      </Band>
      {kin.length === 0 ? null : <PageKin pages={kin} />}
      <Band className="pb-20">
        <DownloadButton />
      </Band>
    </>
  )
}
