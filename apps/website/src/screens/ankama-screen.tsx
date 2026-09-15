import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { AnkamaSource } from '@/components/ankama-source'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PlateBlock } from '@/components/plate-block'
import { PointList } from '@/components/point-list'
import { Prose } from '@/components/prose'
import { RuleCard } from '@/components/rule-card'
import {
  ANKAMA_LIMIT,
  ANKAMA_RULES,
  ANKAMA_SOURCE_IDS
} from '@/constants/ankama'
import { PAGES } from '@/constants/pages'
import { FOLD_ANCHOR } from '@/constants/site'

const RULES_TITLE = msg`La règle d’Ankama`

const SOURCES_TITLE = msg`Les sources`

const SOURCES_LEAD = msg`Ankama n’a jamais publié de règle écrite sur ces logiciels, mais a répondu deux fois en public. Tout ce qui est écrit plus haut vient de ces deux messages.`

const LIMIT_TITLE = msg`Ce que cette page ne promet pas`

export const AnkamaScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]

  return (
    <>
      <Band id={FOLD_ANCHOR} className="pt-12 pb-2">
        <PageHead page={page} />
      </Band>
      <Band className="gap-7 pt-8 pb-10">
        <BandTitle>{i18n._(RULES_TITLE)}</BandTitle>
        <ul className="surface-4 grid gap-drop md:grid-cols-2">
          {ANKAMA_RULES.map((rule) => {
            return <RuleCard key={rule.tone} rule={rule} />
          })}
        </ul>
      </Band>
      <Band className="reveal gap-7 py-10">
        <BandTitle>{i18n._(SOURCES_TITLE)}</BandTitle>
        <Prose>{i18n._(SOURCES_LEAD)}</Prose>
        <ul className="grid gap-drop md:grid-cols-2 md:grid-rows-[auto_auto]">
          {ANKAMA_SOURCE_IDS.map((source) => {
            return <AnkamaSource key={source} source={source} />
          })}
        </ul>
      </Band>
      <Band className="reveal gap-10 pt-10 pb-12">
        <PlateBlock title={i18n._(LIMIT_TITLE)}>
          <PointList points={ANKAMA_LIMIT} />
        </PlateBlock>
      </Band>
      <PageKin pages={kin} />
    </>
  )
}
