import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import logo from '@multifus/retro/assets/logo.png'
import type { PageId } from '@/@types/page'
import { Cartouche } from '@/components/cartouche'
import { FeaturesMenu } from '@/components/features-menu'
import { LanguageOffer } from '@/components/language-offer'
import { MastLink } from '@/components/mast-link'
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
  const isOnDownload = page === 'download'

  return (
    <>
      <div className="ledge">
        <p className="mx-auto max-w-world px-4 py-2 text-aside text-band">
          {i18n._(INDEPENDENCE)}
        </p>
      </div>
      <header className="mast sticky top-0 z-40">
        <nav
          aria-label={i18n._(SITE_NAV)}
          className="relative mx-auto flex min-h-mast max-w-world flex-wrap items-center gap-x-7 gap-y-3 px-4 py-2.5"
        >
          <PageLink
            page="home"
            className="flex items-center gap-2.5 font-carve text-action tracking-chapter text-cream"
          >
            <img src={logo} alt="" className="size-8" />
            Multifus
          </PageLink>
          <FeaturesMenu page={page} />
          <MastLink page="comparison" />
          <Cartouche page={page} className="ml-auto" />
          <Button
            variant={isOnDownload ? 'slate' : 'leaf'}
            nativeButton={false}
            render={<PageLink page="download" isBare className="sighted" />}
          >
            {i18n._(PAGE_NAMES.download)}
          </Button>
        </nav>
        {offered === null ? null : (
          <LanguageOffer page={page} offered={offered} onHide={hide} />
        )}
      </header>
    </>
  )
}
