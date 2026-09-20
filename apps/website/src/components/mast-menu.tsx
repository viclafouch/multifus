import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr/DownloadSimple'
import { ListIcon } from '@phosphor-icons/react/dist/ssr/List'
import { XIcon } from '@phosphor-icons/react/dist/ssr/X'
import type { PageId } from '@/@types/page'
import { BrandMark } from '@/components/brand-mark'
import { PageLink } from '@/components/page-link'
import { PageNav } from '@/components/page-nav'
import { MENU_FEATURES, PROJECT_PAGES, SOFTWARE_PAGES } from '@/constants/pages'
import { MENU_ANCHOR } from '@/constants/site'
import {
  FEATURES_TITLE,
  PAGE_NAMES,
  PROJECT_TITLE,
  SOFTWARE_TITLE
} from '@/constants/wording'
import { useDrawer } from '@/hooks/use-drawer'

export const MENU_NAME = msg`Le menu du site`

export const MENU_OPEN = msg`Ouvrir le menu`

export const MENU_SHUT = msg`Fermer le menu`

type MastMenuProps = Readonly<{
  page: PageId
}>

export const MastMenu = ({ page }: MastMenuProps) => {
  const { i18n } = useLingui()
  const { drawer, isOpen, open, close, handleClosed, handleClick } = useDrawer()
  const isOnDownload = page === 'download'

  return (
    <>
      <div className="ml-auto flex items-center gap-2 lg:hidden">
        <Button
          variant={isOnDownload ? 'slate' : 'leaf'}
          size="icon-thumb"
          nativeButton={false}
          aria-label={i18n._(PAGE_NAMES.download)}
          render={<PageLink page="download" isBare className="sighted" />}
        >
          <DownloadSimpleIcon weight="bold" aria-hidden className="size-5" />
        </Button>
        <Button
          variant="slate"
          size="icon-thumb"
          aria-label={i18n._(MENU_OPEN)}
          aria-expanded={isOpen}
          aria-controls={MENU_ANCHOR}
          onClick={open}
        >
          <ListIcon weight="bold" aria-hidden className="size-5" />
        </Button>
      </div>
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- the click only serves the backdrop, which no keyboard reaches, and Escape already closes the dialog */}
      <dialog
        id={MENU_ANCHOR}
        ref={drawer}
        aria-label={i18n._(MENU_NAME)}
        onClick={handleClick}
        onClose={handleClosed}
        className="drawer"
      >
        <div className="sheet flex flex-col gap-8">
          <div className="flex items-center justify-between gap-4">
            <BrandMark onGo={close} />
            <Button
              variant="slate"
              size="icon-thumb"
              aria-label={i18n._(MENU_SHUT)}
              onClick={close}
            >
              <XIcon weight="bold" aria-hidden className="size-5" />
            </Button>
          </div>
          <PageNav title={FEATURES_TITLE} pages={MENU_FEATURES} onGo={close} />
          <PageNav title={SOFTWARE_TITLE} pages={SOFTWARE_PAGES} onGo={close} />
          <PageNav title={PROJECT_TITLE} pages={PROJECT_PAGES} onGo={close} />
        </div>
      </dialog>
    </>
  )
}
