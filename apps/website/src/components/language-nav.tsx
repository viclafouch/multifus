import type { PageId } from '@/@types/page'
import { NavGroup } from '@/components/nav-group'
import { PageLink } from '@/components/page-link'
import { LANGUAGE_NAMES, LANGUAGES } from '@/constants/languages'
import { TONGUES_TITLE } from '@/constants/wording'

type LanguageNavProps = Readonly<{
  page: PageId
  onGo?: () => void
}>

export const LanguageNav = ({ page, onGo }: LanguageNavProps) => {
  return (
    <NavGroup title={TONGUES_TITLE}>
      {LANGUAGES.map((language) => {
        const name = LANGUAGE_NAMES[language]

        return (
          <li key={language}>
            <PageLink
              page={page}
              language={language}
              isBare
              hrefLang={language}
              lang={language}
              onClick={onGo}
              className="stud sighted"
            >
              {name}
            </PageLink>
          </li>
        )
      })}
    </NavGroup>
  )
}
