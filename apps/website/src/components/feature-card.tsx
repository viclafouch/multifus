import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import type { FeatureId } from '@/@types/page'
import { PageLink } from '@/components/page-link'
import { LOOPS, PEEK_SIZE, PEEKS, POSTER_SIZE } from '@/constants/loops'
import { PAGES } from '@/constants/pages'
import { PAGE_PORTRAITS, PORTRAIT_SIDE } from '@/constants/portraits'
import { PAGE_TINTS } from '@/constants/tints'
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
      className={cn(
        'card torch sighted flex h-full flex-col',
        PAGE_TINTS[page]
      )}
    >
      <span className="relative block">
        <span className="thumbnail">
          <img
            src={LOOPS[loop].poster}
            alt=""
            {...POSTER_SIZE}
            loading="lazy"
            decoding="async"
            className="plane poster"
          />
          {isPeeking ? (
            <img
              src={PEEKS[page]}
              alt=""
              {...PEEK_SIZE}
              decoding="async"
              fetchPriority="high"
              data-ready={isReady ? '' : undefined}
              onLoad={handleLoad}
              className="plane peek"
            />
          ) : null}
        </span>
        <img
          src={PAGE_PORTRAITS[page]}
          alt=""
          width={PORTRAIT_SIDE}
          height={PORTRAIT_SIDE}
          loading="lazy"
          decoding="async"
          className="signet absolute -bottom-6 left-5 size-14"
        />
      </span>
      <span className="nameplate px-5 pt-9">{i18n._(PAGE_NAMES[page])}</span>
      <span className="px-5 pt-1.5 pb-5 text-tale text-band">
        {i18n._(PAGE_PROMISES[page])}
      </span>
    </PageLink>
  )
}
