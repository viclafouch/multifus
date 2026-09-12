import { useLingui } from '@lingui/react'
import type { FeatureId } from '@/@types/page'
import { PageLink } from '@/components/page-link'
import { LOOPS } from '@/constants/loops'
import { PAGES } from '@/constants/pages'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'

type VignetteProps = Readonly<{
  page: FeatureId
}>

export const Vignette = ({ page }: VignetteProps) => {
  const { i18n } = useLingui()
  const { loop } = PAGES[page]

  return (
    <PageLink page={page} isBare className="card sighted flex h-full flex-col">
      <img
        src={LOOPS[loop].poster}
        alt=""
        loading="lazy"
        decoding="async"
        className="vignette"
      />
      <span className="nameplate px-5 pt-5">{i18n._(PAGE_NAMES[page])}</span>
      <span className="px-5 pt-1.5 pb-5 text-tale text-band">
        {i18n._(PAGE_PROMISES[page])}
      </span>
    </PageLink>
  )
}
