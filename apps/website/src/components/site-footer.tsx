import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { PageLink } from '@/components/page-link'
import { REPOSITORY } from '@/constants/site'
import { PAGE_NAMES } from '@/constants/wording'

const ANKAMA_CREDIT = msg`Images et vidéos © Ankama Games. Dofus Retro est une marque d’Ankama.`

const FOOTER_NAV = msg`Le pied de page`

const FOOTER_PAGES = [
  'mac',
  'ankama',
  'journal'
] as const satisfies readonly PageId[]

type SiteFooterProps = Readonly<{
  page: PageId
}>

export const SiteFooter = ({ page }: SiteFooterProps) => {
  const { i18n } = useLingui()

  return (
    <footer className="mt-24 border-t border-border bg-night/25">
      <div className="mx-auto flex max-w-world flex-col gap-8 px-4 py-12">
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
          <PageLink
            page="home"
            isHere={page === 'home'}
            className="font-carve text-action tracking-chapter text-cream"
          >
            Multifus
          </PageLink>
          <nav aria-label={i18n._(FOOTER_NAV)}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-aside text-band">
              {FOOTER_PAGES.map((footer) => {
                return (
                  <li key={footer}>
                    <PageLink page={footer} isHere={footer === page}>
                      {i18n._(PAGE_NAMES[footer])}
                    </PageLink>
                  </li>
                )
              })}
              <li>
                <a
                  href={REPOSITORY}
                  className="sighted transition-colors hover:text-cream"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <p className="rule border-t pt-6 text-aside text-band">
          {i18n._(ANKAMA_CREDIT)}
        </p>
      </div>
    </footer>
  )
}
