import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { PageLink } from '@/components/page-link'
import { LANGUAGE_NAMES, LANGUAGES } from '@/constants/languages'
import { REPOSITORY } from '@/constants/site'
import { PAGE_NAMES } from '@/constants/wording'
import { pathOf } from '@/helpers/page'

const ANKAMA_CREDIT = msg`Images et vidéos © Ankama Games. Dofus Retro est une marque d’Ankama.`

const LANGUAGES_NAV = msg`La langue du site`

const FOOTER_NAV = msg`Le pied de page`

export const SiteFooter = () => {
  const { i18n } = useLingui()

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-world flex-col gap-3 px-4 py-8 text-aside text-muted-foreground">
        <nav aria-label={i18n._(LANGUAGES_NAV)}>
          <ul className="flex flex-wrap gap-4">
            {LANGUAGES.map((language) => {
              return (
                <li key={language}>
                  <a
                    href={pathOf({ page: 'home', language })}
                    hrefLang={language}
                    lang={language}
                    className="sighted transition-colors hover:text-foreground"
                  >
                    {LANGUAGE_NAMES[language]}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        <nav aria-label={i18n._(FOOTER_NAV)}>
          <ul className="flex flex-wrap gap-4">
            <li>
              <PageLink page="journal">{i18n._(PAGE_NAMES.journal)}</PageLink>
            </li>
            <li>
              <PageLink page="images">{i18n._(PAGE_NAMES.images)}</PageLink>
            </li>
            <li>
              <a
                href={REPOSITORY}
                className="sighted transition-colors hover:text-foreground"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
        <p>{i18n._(ANKAMA_CREDIT)}</p>
      </div>
    </footer>
  )
}
