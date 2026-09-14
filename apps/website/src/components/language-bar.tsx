import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { cn, Flag } from '@multifus/retro'
import type { PageId } from '@/@types/page'
import { PageLink } from '@/components/page-link'
import { LANGUAGE_NAMES, LANGUAGES } from '@/constants/languages'

const TONGUES = msg`La langue du site`

type LanguageBarProps = Readonly<{
  page: PageId
  className?: string
}>

export const LanguageBar = ({ page, className }: LanguageBarProps) => {
  const { i18n } = useLingui()

  return (
    <ul
      aria-label={i18n._(TONGUES)}
      className={cn('flex shrink-0 items-center gap-1.5', className)}
    >
      {LANGUAGES.map((language) => {
        const name = LANGUAGE_NAMES[language]

        return (
          <li key={language} className="flex">
            <PageLink
              page={page}
              language={language}
              isBare
              hrefLang={language}
              lang={language}
              aria-label={name}
              title={name}
              className="ensign h-4 w-6 sighted"
            >
              <Flag language={language} />
            </PageLink>
          </li>
        )
      })}
    </ul>
  )
}
