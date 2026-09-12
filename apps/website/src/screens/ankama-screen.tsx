import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { AnkamaWord } from '@/components/ankama-word'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { DownloadButton } from '@/components/download-button'
import { Opening } from '@/components/opening'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PlateBlock } from '@/components/plate-block'
import { PointList } from '@/components/point-list'
import { ANKAMA_KEPT, ANKAMA_LIMIT, ANKAMA_WORD_IDS } from '@/constants/ankama'
import { PAGES } from '@/constants/pages'
import { FOLD_ANCHOR } from '@/constants/site'

const OPENING = msg`Ankama n’a jamais publié de règle écrite sur les gestionnaires de fenêtres. Il a répondu deux fois en public, et c’est tout ce qui existe. Les voici, en entier.`

const WORDS_TITLE = msg`Les deux messages`

const KEPT_TITLE = msg`Ce que Multifus en retient`

const LIMIT_TITLE = msg`Ce que cette page ne promet pas`

export const AnkamaScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]

  return (
    <>
      <Band id={FOLD_ANCHOR} className="pb-6">
        <PageHead page={page} />
        <Opening>{i18n._(OPENING)}</Opening>
      </Band>
      <Band className="reveal py-10">
        <BandTitle>{i18n._(WORDS_TITLE)}</BandTitle>
        <ul className="flex max-w-roll flex-col gap-6">
          {ANKAMA_WORD_IDS.map((word) => {
            return (
              <li key={word}>
                <AnkamaWord word={word} />
              </li>
            )
          })}
        </ul>
      </Band>
      <Band className="reveal py-10">
        <BandTitle>{i18n._(KEPT_TITLE)}</BandTitle>
        <PointList points={ANKAMA_KEPT} />
      </Band>
      <Band className="reveal pt-4">
        <PlateBlock title={i18n._(LIMIT_TITLE)}>
          <PointList points={ANKAMA_LIMIT} />
        </PlateBlock>
      </Band>
      <PageKin pages={kin} />
      <Band className="pb-20">
        <DownloadButton />
      </Band>
    </>
  )
}
