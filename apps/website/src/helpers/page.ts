import type { Language } from '../@types/language.ts'
import type { PageId } from '../@types/page.ts'
import { LANGUAGES, SOURCE_LANGUAGE } from '../constants/languages.ts'
import { PAGES, PAGE_IDS } from '../constants/pages.ts'

export type PathParams = Readonly<{
  page: PageId
  language: Language
}>

export const pathOf = ({ page, language }: PathParams) => {
  const slug = PAGES[page].slugs[language]

  if (slug === '') {
    return language === SOURCE_LANGUAGE ? '/' : `/${language}`
  }

  return language === SOURCE_LANGUAGE ? `/${slug}` : `/${language}/${slug}`
}

type PageOfParams = Readonly<{
  slug: string
  language: Language
}>

export const pageOf = ({ slug, language }: PageOfParams) => {
  const found = PAGE_IDS.find((page) => {
    return PAGES[page].slugs[language] === slug
  })

  return found ?? null
}

export const everyPath = () => {
  return LANGUAGES.flatMap((language) => {
    return PAGE_IDS.map((page) => {
      return pathOf({ page, language })
    })
  })
}
