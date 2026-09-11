import type { PageId } from '@/@types/page'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'
import { HOST } from '@/constants/site'
import { PAGE_NAMES, PAGE_PROMISES, SITE_TITLE } from '@/constants/wording'
import type { PathParams } from '@/helpers/page'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'

export const addressOf = ({ page, language }: PathParams) => {
  return `${HOST}${pathOf({ page, language })}`
}

export const alternatesOf = (page: PageId) => {
  const translated = LANGUAGES.map((language) => {
    return {
      rel: 'alternate',
      hrefLang: language,
      href: addressOf({ page, language })
    }
  })

  return [
    ...translated,
    {
      rel: 'alternate',
      hrefLang: 'x-default',
      href: addressOf({ page, language: SOURCE_LANGUAGE })
    }
  ]
}

export const headOf = ({ page, language }: PathParams) => {
  const speaker = SPEAKERS[language]
  const address = addressOf({ page, language })
  const description = speaker._(PAGE_PROMISES[page])
  const title =
    page === 'home'
      ? speaker._(SITE_TITLE)
      : `${speaker._(PAGE_NAMES[page])} · Multifus`

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:site_name', content: 'Multifus' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: address },
      { property: 'og:locale', content: language },
      { name: 'twitter:card', content: 'summary' }
    ],
    links: [{ rel: 'canonical', href: address }, ...alternatesOf(page)]
  }
}
