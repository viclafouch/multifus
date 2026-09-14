import type { Language } from '../@types/language.ts'
import type { PageId } from '../@types/page.ts'
import { LANGUAGES, SOURCE_LANGUAGE } from '../constants/languages.ts'
import { OG_DIR, OG_IMAGE } from '../constants/og.ts'
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

export const ogPathOf = ({ page, language }: PathParams) => {
  const slug = PAGES[page].slugs[language]

  const name = slug === '' ? 'index' : slug

  return `/${OG_DIR}/${language}/${name}.${OG_IMAGE.extension}`
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

const pathsOf = (pages: readonly PageId[]) => {
  return LANGUAGES.flatMap((language) => {
    return pages.map((page) => {
      return pathOf({ page, language })
    })
  })
}

export const everyPath = () => {
  return pathsOf(PAGE_IDS)
}

const LOOP_PATHS = new Set(
  pathsOf(
    PAGE_IDS.filter((page) => {
      return PAGES[page].loop !== null
    })
  )
)

export const matchHasLoop = (pathname: string) => {
  return LOOP_PATHS.has(pathname)
}
