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

type AlternateRefsOfParams = Readonly<{
  page: PageId
  origin: string
}>

export const alternateRefsOf = ({ page, origin }: AlternateRefsOfParams) => {
  const translated = LANGUAGES.map((language) => {
    return {
      hreflang: language,
      href: `${origin}${pathOf({ page, language })}`
    }
  })

  return [
    ...translated,
    {
      hreflang: 'x-default',
      href: `${origin}${pathOf({ page, language: SOURCE_LANGUAGE })}`
    }
  ]
}

type PageAddress = PathParams & Readonly<{ path: string }>

export const everyPage = (): readonly PageAddress[] => {
  return LANGUAGES.flatMap((language) => {
    return PAGE_IDS.map((page) => {
      return { page, language, path: pathOf({ page, language }) }
    })
  })
}

const LOOP_PATHS = new Set(
  everyPage()
    .filter(({ page }) => {
      return PAGES[page].loop !== null
    })
    .map(({ path }) => {
      return path
    })
)

export const matchHasLoop = (pathname: string) => {
  return LOOP_PATHS.has(pathname)
}
