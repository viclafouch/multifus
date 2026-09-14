import { useLingui } from '@lingui/react'
import type { FeatureId } from '@/@types/page'
import { PageLink } from '@/components/page-link'
import { LOOPS, PEEKS } from '@/constants/loops'
import { PAGES } from '@/constants/pages'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'
import { usePeek } from '@/hooks/use-peek'

type FeatureCardProps = Readonly<{
  page: FeatureId
  hasPeek?: boolean
}>

export const FeatureCard = ({ page, hasPeek = false }: FeatureCardProps) => {
  const { i18n } = useLingui()
  const { isPeeking, isReady, handleLoad, handlers } = usePeek({ hasPeek })
  const { loop } = PAGES[page]

  return (
    <PageLink
      {...handlers}
      page={page}
      isBare
      className="card sighted flex h-full flex-col"
    >
      <span className="thumbnail">
        <img
          src={LOOPS[loop].poster}
          alt=""
          loading="lazy"
          decoding="async"
          className="plane poster"
        />
        {isPeeking ? (
          <img
            src={PEEKS[page]}
            alt=""
            decoding="async"
            fetchPriority="high"
            data-ready={isReady ? '' : undefined}
            onLoad={handleLoad}
            className="plane peek"
          />
        ) : null}
      </span>
      <span className="nameplate px-5 pt-5">{i18n._(PAGE_NAMES[page])}</span>
      <span className="px-5 pt-1.5 pb-5 text-tale text-band">
        {i18n._(PAGE_PROMISES[page])}
      </span>
    </PageLink>
  )
}
