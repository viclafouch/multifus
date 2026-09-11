import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { PageLink } from '@/components/page-link'
import { MENU_FEATURES } from '@/constants/pages'
import { INDEPENDENCE, PAGE_NAMES } from '@/constants/wording'

const FEATURES_NAV = msg`Les fonctionnalités de Multifus`

export const SiteHeader = () => {
  const { i18n } = useLingui()

  return (
    <header className="border-b border-border">
      <p className="bg-iron px-4 py-1.5 text-center text-legend text-muted-foreground">
        {i18n._(INDEPENDENCE)}
      </p>
      <nav
        aria-label={i18n._(FEATURES_NAV)}
        className="mx-auto flex max-w-world items-center gap-6 px-4 py-4"
      >
        <PageLink page="home" className="font-carve text-sign tracking-wide">
          Multifus
        </PageLink>
        <ul className="flex flex-wrap items-center gap-4 text-way">
          {MENU_FEATURES.map((page) => {
            return (
              <li key={page}>
                <PageLink page={page}>{i18n._(PAGE_NAMES[page])}</PageLink>
              </li>
            )
          })}
        </ul>
        <PageLink page="comparison" className="ml-auto text-way">
          {i18n._(PAGE_NAMES.comparison)}
        </PageLink>
        <PageLink page="download" className="text-way">
          {i18n._(PAGE_NAMES.download)}
        </PageLink>
      </nav>
    </header>
  )
}
