import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { FeaturesMenu } from '@/components/features-menu'
import { PageLink } from '@/components/page-link'
import { INDEPENDENCE, PAGE_NAMES } from '@/constants/wording'

const SITE_NAV = msg`Les pages de Multifus`

export const SiteHeader = () => {
  const { i18n } = useLingui()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-iron">
      <p className="border-b border-border/60 px-4 py-1.5 text-center text-aside text-muted-foreground">
        {i18n._(INDEPENDENCE)}
      </p>
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
    </header>
  )
}
