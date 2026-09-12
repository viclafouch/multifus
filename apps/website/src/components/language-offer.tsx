import { msg } from '@lingui/core/macro'
import { Button, Cross, Flag } from '@multifus/retro'
import type { Language } from '@/@types/language'
import type { PageId } from '@/@types/page'
import { PageLink } from '@/components/page-link'
import { SPEAKERS } from '@/lib/i18n'

const TONGUE_ASIDE = msg`Le site dans votre langue`

const TONGUE_OFFER = msg`Lire cette page en français`

const TONGUE_CLOSE = msg`Masquer cette proposition`

type LanguageOfferProps = Readonly<{
  page: PageId
  offered: Language
  onHide: () => void
}>

export const LanguageOffer = ({
  page,
  offered,
  onHide
}: LanguageOfferProps) => {
  const speaker = SPEAKERS[offered]

  return (
    <aside
      data-offer
      lang={offered}
      aria-label={speaker._(TONGUE_ASIDE)}
      className="absolute inset-x-0 top-full border-b border-border bg-iron shadow-lg"
    >
      <div className="mx-auto flex max-w-world items-center gap-3 px-4 py-2">
        <span aria-hidden className="h-4 w-6 shrink-0">
          <Flag language={offered} />
        </span>
        <PageLink
          page={page}
          language={offered}
          isBare
          hrefLang={offered}
          className="flex-1 text-aside text-cream underline-offset-4 transition-colors sighted hover:underline"
        >
          {speaker._(TONGUE_OFFER)}
        </PageLink>
        <Button
          variant="bare"
          size="icon-tight"
          aria-label={speaker._(TONGUE_CLOSE)}
          onClick={onHide}
          className="relative"
        >
          <Cross className="absolute inset-0 m-auto size-2/3" />
        </Button>
      </div>
    </aside>
  )
}
