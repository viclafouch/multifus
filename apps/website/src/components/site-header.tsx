import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr/DownloadSimple'
import type { PageId } from '@/@types/page'
import { BrandMark } from '@/components/brand-mark'
import { FeaturesMenu } from '@/components/features-menu'
import { HelpMenu } from '@/components/help-menu'
import { LanguageBar } from '@/components/language-bar'
import { LanguageOffer } from '@/components/language-offer'
import { MastLink } from '@/components/mast-link'
import { MastMenu } from '@/components/mast-menu'
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
        <p className="gutter mx-auto max-w-world py-2 text-aside text-band">
          {i18n._(INDEPENDENCE)}
        </p>
      </div>
      <header className="mast sticky top-0 z-40">
        <nav
          aria-label={i18n._(SITE_NAV)}
          className="gutter relative mx-auto flex min-h-mast max-w-world items-center gap-x-7 py-2 lg:py-2.5"
        >
          <BrandMark />
          <FeaturesMenu page={page} />
          <MastLink page="comparison" />
          <HelpMenu page={page} />
          <LanguageBar page={page} className="ml-auto hidden lg:flex" />
          <Button
            variant={isOnDownload ? 'slate' : 'leaf'}
            nativeButton={false}
            className="hidden lg:inline-flex"
            render={<PageLink page="download" isBare className="sighted" />}
          >
            <DownloadSimpleIcon weight="bold" aria-hidden />
            {i18n._(PAGE_NAMES.download)}
          </Button>
          <MastMenu page={page} />
        </nav>
        {offered === null ? null : (
          <LanguageOffer page={page} offered={offered} onHide={hide} />
        )}
      </header>
    </>
  )
}
