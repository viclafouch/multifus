import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { DownloadButton } from '@/components/download-button'
import { LoopPlate } from '@/components/loop-plate'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SkipLink } from '@/components/skip-link'
import { PAGES } from '@/constants/pages'
import { CONTENT_ANCHOR } from '@/constants/site'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'

type PageScreenProps = Readonly<{
  page: PageId
}>

export const PageScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { loop } = PAGES[page]
  const promise = i18n._(PAGE_PROMISES[page])
  const isHome = page === 'home'

  return (
    <div className="relative flex min-h-screen flex-col">
      <SkipLink />
      <SiteHeader />
      <main
        id={CONTENT_ANCHOR}
        tabIndex={-1}
        className="mx-auto flex w-full max-w-world flex-1 flex-col items-start gap-8 px-4 py-16 outline-none"
      >
        {isHome ? (
          <h1 className="max-w-lead text-chapter text-balance text-cream">
            {promise}
          </h1>
        ) : (
          <>
            <h1 className="font-carve text-chapter tracking-hero text-cream uppercase">
              {i18n._(PAGE_NAMES[page])}
            </h1>
            <p className="max-w-lead text-motto text-balance">{promise}</p>
          </>
        )}
        {loop === null ? null : <LoopPlate loop={loop} caption={promise} />}
        {page === 'download' ? null : <DownloadButton />}
      </main>
      <SiteFooter />
    </div>
  )
}
