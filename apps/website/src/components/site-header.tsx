import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { Cartouche } from '@/components/cartouche'
import { FeaturesMenu } from '@/components/features-menu'
import { LanguageOffer } from '@/components/language-offer'
import { PageLink } from '@/components/page-link'
import { INDEPENDENCE, PAGE_NAMES } from '@/constants/wording'
import { useLanguage } from '@/hooks/use-language'
import { useOffer } from '@/hooks/use-offer'

const SITE_NAV = msg`Les pages de Multifus`

type SiteHeaderProps = Readonly<{
  page: PageId
}>

export const SiteHeader = ({ page }: SiteHeaderProps) => {
  const { i18n } = useLingui()
  const current = useLanguage()
  const { offered, hide } = useOffer(current)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-iron">
      <div className="border-b border-border/60">
        <div className="mx-auto flex max-w-world items-center gap-4 px-4 py-1.5">
          <p className="flex-1 text-aside text-muted-foreground">
            {i18n._(INDEPENDENCE)}
          </p>
          <Cartouche page={page} current={current} />
        </div>
      </div>
      <nav
        aria-label={i18n._(SITE_NAV)}
        className="mx-auto flex max-w-world flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3"
      >
        <PageLink
          page="home"
          className="font-carve text-bar tracking-chapter text-cream"
        >
          Multifus
        </PageLink>
        <FeaturesMenu />
        <PageLink page="comparison" className="text-way sm:ml-auto">
          {i18n._(PAGE_NAMES.comparison)}
        </PageLink>
        <PageLink page="download" className="text-way">
          {i18n._(PAGE_NAMES.download)}
        </PageLink>
      </nav>
      {offered === null ? null : (
        <LanguageOffer page={page} offered={offered} onHide={hide} />
      )}
    </header>
  )
}
