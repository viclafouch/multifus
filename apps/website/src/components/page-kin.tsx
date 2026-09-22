import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { FeatureId } from '@/@types/page'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { FeatureCard } from '@/components/feature-card'
import { PAIR_SIZES } from '@/lib/media'

const ALSO_SEE = msg`À voir aussi`

type PageKinProps = Readonly<{
  pages: readonly FeatureId[]
}>

export const PageKin = ({ pages }: PageKinProps) => {
  const { i18n } = useLingui()

  return (
    <Band className="reveal pt-rest pb-rest-xl">
      <BandTitle>{i18n._(ALSO_SEE)}</BandTitle>
      <ul className="grid gap-drop sm:grid-cols-2">
        {pages.map((page) => {
          return (
            <li key={page}>
              <FeatureCard page={page} sizes={PAIR_SIZES} />
            </li>
          )
        })}
      </ul>
    </Band>
  )
}
