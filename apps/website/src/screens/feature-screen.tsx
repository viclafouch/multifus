import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { DownloadButton } from '@/components/download-button'
import { LoopPlate } from '@/components/loop-plate'
import { Opening } from '@/components/opening'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PlateBlock } from '@/components/plate-block'
import { ProseBlock } from '@/components/prose-block'
import { ProseLines } from '@/components/prose-lines'
import { PAGE_BODIES } from '@/constants/bodies'
import { PAGES } from '@/constants/pages'
import { PAGE_PROMISES } from '@/constants/wording'

export const FeatureScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { loop, kin } = PAGES[page]
  const body = PAGE_BODIES[page]

  return (
    <>
      <Band className="pb-8">
        <PageHead page={page} />
        {loop === null ? null : (
          <LoopPlate loop={loop} caption={i18n._(PAGE_PROMISES[page])} />
        )}
      </Band>
      {body === null ? null : (
        <>
          <Band className="pt-2">
            <Opening>{i18n._(body.lead)}</Opening>
            {body.passages.map((passage) => {
              const title = i18n._(passage.title)

              return (
                <ProseBlock key={title} level={2} title={title}>
                  <ProseLines lines={passage.lines} />
                </ProseBlock>
              )
            })}
          </Band>
          <Band className="pt-0">
            <PlateBlock title={i18n._(body.limit.title)}>
              <ProseLines lines={body.limit.lines} />
            </PlateBlock>
          </Band>
        </>
      )}
      {kin.length === 0 ? null : <PageKin pages={kin} />}
      <Band className="pb-20">
        <DownloadButton />
      </Band>
    </>
  )
}
