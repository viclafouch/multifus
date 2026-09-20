import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { buttonVariants } from '@multifus/retro'
import type { Icon } from '@phosphor-icons/react'
import { GithubLogoIcon } from '@phosphor-icons/react/dist/ssr/GithubLogo'
import { XLogoIcon } from '@phosphor-icons/react/dist/ssr/XLogo'
import type { PageId } from '@/@types/page'
import { BrandMark } from '@/components/brand-mark'
import { LanguageNav } from '@/components/language-nav'
import { OutLink } from '@/components/out-link'
import { PageNav } from '@/components/page-nav'
import { PerkList } from '@/components/perk-list'
import { MENU_FEATURES, PROJECT_PAGES, SOFTWARE_PAGES } from '@/constants/pages'
import { AUTHOR, AUTHOR_NAME, REPOSITORY } from '@/constants/site'
import {
  FEATURES_TITLE,
  PERKS,
  PROJECT_TITLE,
  SOFTWARE_TITLE
} from '@/constants/wording'

const ANKAMA_CREDIT = msg`Images et vidéos © Ankama Games. Dofus Retro est une marque d’Ankama.`

const FOOTER_PITCH = msg`Le gestionnaire de fenêtres qui amène devant vous le personnage qui joue, sur Mac comme sur Windows.`

const ELSEWHERE = msg`Multifus ailleurs`

const SOURCE_CODE = msg`Le code de Multifus sur GitHub`

const AUTHOR_ON_X = msg`L’auteur sur X`

type Signet = Readonly<{
  href: string
  name: MessageDescriptor
  Mark: Icon
}>

const SIGNETS = [
  { href: REPOSITORY, name: SOURCE_CODE, Mark: GithubLogoIcon },
  { href: AUTHOR, name: AUTHOR_ON_X, Mark: XLogoIcon }
] as const satisfies readonly Signet[]

const SIGNET_LOOK = buttonVariants({
  variant: 'slate',
  size: 'icon',
  className: 'size-10'
})

type SiteFooterProps = Readonly<{
  page: PageId
}>

export const SiteFooter = ({ page }: SiteFooterProps) => {
  const { i18n } = useLingui()

  return (
    <footer className="plinth relative">
      <span aria-hidden className="seam" />
      <div className="gutter hemmed mx-auto flex max-w-world flex-col gap-10 pt-12">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-brand">
          <div className="flex flex-col items-start gap-5">
            <BrandMark />
            <p className="engraved max-w-blurb text-aside text-band">
              {i18n._(FOOTER_PITCH)}
            </p>
            <PerkList perks={PERKS} />
            <ul
              aria-label={i18n._(ELSEWHERE)}
              className="flex items-center gap-2.5"
            >
              {SIGNETS.map(({ href, name, Mark }) => {
                const said = i18n._(name)

                return (
                  <li key={href}>
                    <OutLink href={href} isBare className={SIGNET_LOOK}>
                      <Mark weight="fill" aria-hidden className="size-5" />
                      <span className="sr-only">{said}</span>
                    </OutLink>
                  </li>
                )
              })}
            </ul>
          </div>
          <PageNav title={FEATURES_TITLE} pages={MENU_FEATURES} />
          <PageNav title={SOFTWARE_TITLE} pages={SOFTWARE_PAGES} />
          <PageNav title={PROJECT_TITLE} pages={PROJECT_PAGES} />
          <div className="lg:hidden">
            <LanguageNav page={page} />
          </div>
        </div>
        <div className="rule flex flex-col gap-1.5 border-t pt-6">
          <p className="text-aside text-khaki">© {AUTHOR_NAME}</p>
          <p className="text-aside text-band">{i18n._(ANKAMA_CREDIT)}</p>
        </div>
      </div>
    </footer>
  )
}
