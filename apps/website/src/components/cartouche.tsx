import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { cn, Flag } from '@multifus/retro'
import type { Language } from '@/@types/language'
import type { PageId } from '@/@types/page'
import { LANGUAGE_NAMES, LANGUAGES } from '@/constants/languages'
import { pathOf } from '@/helpers/page'

const TONGUES = msg`La langue du site`

type CartoucheProps = Readonly<{
  page: PageId
  current: Language
  className?: string
}>

export const Cartouche = ({ page, current, className }: CartoucheProps) => {
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
            <a
              href={pathOf({ page, language })}
              hrefLang={language}
              lang={language}
              aria-current={language === current}
              aria-label={name}
              title={name}
              className="ensign h-4 w-6 sighted"
            >
              <Flag language={language} />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
