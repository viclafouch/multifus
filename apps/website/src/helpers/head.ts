import type { MessageDescriptor } from '@lingui/core'
import type { PageId } from '@/@types/page'
import { HOST } from '@/constants/host'
import { LANGUAGES, OPEN_GRAPH_LOCALES } from '@/constants/languages'
import { LOOPS } from '@/constants/loops'
import { OG_HEIGHT, OG_IMAGE, OG_WIDTH } from '@/constants/og'
import { PAGES } from '@/constants/pages'
import { AUTHOR_HANDLE, FOLD_ANCHOR } from '@/constants/site'
import {
  PAGE_DESCRIPTIONS,
  PAGE_NAMES,
  PAGE_PROMISES,
  PAGE_TITLES
} from '@/constants/wording'
import { addressOf, ogAddressOf } from '@/helpers/address'
import type { PathParams } from '@/helpers/page'
import { alternateRefsOf } from '@/helpers/page'
import { scriptOf } from '@/helpers/schema'
import { SPEAKERS } from '@/lib/i18n'

const alternatesOf = (page: PageId) => {
  return alternateRefsOf({ page, origin: HOST }).map(({ hreflang, href }) => {
    return { rel: 'alternate', hrefLang: hreflang, href }
  })
}

const POSTER_PRELOAD = {
  rel: 'preload',
  as: 'image'
} as const

const posterOf = (page: PageId) => {
  const { loop } = PAGES[page]

  if (loop === null) {
    return []
  }

  return [{ ...POSTER_PRELOAD, href: LOOPS[loop].poster }]
}

export const titleOf = (name: string) => {
  return `${name} · Multifus`
}

const TONGUE_SEPARATOR = ' · '

export const everyTongue = (word: MessageDescriptor) => {
  return LANGUAGES.map((language) => {
    return SPEAKERS[language]._(word)
  }).join(TONGUE_SEPARATOR)
}

export const headOf = ({ page, language }: PathParams) => {
  const speaker = SPEAKERS[language]
  const address = addressOf({ page, language })
  const name = speaker._(PAGE_NAMES[page])
  const description = speaker._(PAGE_DESCRIPTIONS[page])
  const title = titleOf(speaker._(PAGE_TITLES[page]))
  const image = ogAddressOf({ page, language })
  const legend = `${name}. ${speaker._(PAGE_PROMISES[page])}`

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:site_name', content: 'Multifus' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: address },
      { property: 'og:locale', content: OPEN_GRAPH_LOCALES[language] },
      { property: 'og:image', content: image },
      { property: 'og:image:type', content: OG_IMAGE.type },
      { property: 'og:image:width', content: String(OG_WIDTH) },
      { property: 'og:image:height', content: String(OG_HEIGHT) },
      { property: 'og:image:alt', content: legend },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: AUTHOR_HANDLE },
      { name: 'twitter:creator', content: AUTHOR_HANDLE },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:image:alt', content: legend }
    ],
    links: [
      { rel: 'canonical', href: address },
      { rel: 'expect', href: `#${FOLD_ANCHOR}`, blocking: 'render' },
      ...posterOf(page),
      ...alternatesOf(page)
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: scriptOf({ page, language })
      }
    ]
  }
}
