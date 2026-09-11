import type { Language } from '@/@types/language'
import type { LoopId, PageId } from '@/@types/page'
import { LOOPS } from '@/constants/loops'
import { PAGES } from '@/constants/pages'
import { HOST, RELEASES } from '@/constants/site'
import { SYSTEM_IDS, SYSTEM_VERSIONS } from '@/constants/systems'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'
import type { PathParams } from '@/helpers/page'
import { addressOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'

export type SchemaNode = Readonly<{
  '@context': 'https://schema.org'
  '@type': string
  '@id': string
  [key: string]: unknown
}>

const CONTEXT = 'https://schema.org'

const SYSTEMS = SYSTEM_IDS.map((system) => {
  return SYSTEM_VERSIONS[system]
}).join(', ')

const softwareOf = (language: Language) => {
  const speaker = SPEAKERS[language]
  const home = addressOf({ page: 'home', language })

  return {
    '@context': CONTEXT,
    '@type': 'SoftwareApplication',
    '@id': `${home}#multifus`,
    name: 'Multifus',
    url: home,
    description: speaker._(PAGE_PROMISES.home),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: SYSTEMS,
    downloadUrl: RELEASES,
    inLanguage: language,
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR'
    }
  } satisfies SchemaNode
}

type VideoOfParams = Readonly<{
  page: PageId
  language: Language
  loop: LoopId
}>

const videoOf = ({ page, language, loop }: VideoOfParams) => {
  const speaker = SPEAKERS[language]
  const address = addressOf({ page, language })
  const { source, poster, seconds, filmed } = LOOPS[loop]

  return {
    '@context': CONTEXT,
    '@type': 'VideoObject',
    '@id': `${address}#video`,
    name: speaker._(PAGE_NAMES[page]),
    description: speaker._(PAGE_PROMISES[page]),
    contentUrl: `${HOST}${source}`,
    thumbnailUrl: `${HOST}${poster}`,
    uploadDate: filmed,
    duration: `PT${seconds}S`,
    inLanguage: language
  } satisfies SchemaNode
}

const crumbsOf = ({ page, language }: PathParams) => {
  const speaker = SPEAKERS[language]
  const address = addressOf({ page, language })

  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    '@id': `${address}#crumbs`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: speaker._(PAGE_NAMES.home),
        item: addressOf({ page: 'home', language })
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: speaker._(PAGE_NAMES[page]),
        item: address
      }
    ]
  } satisfies SchemaNode
}

export const schemaOf = ({
  page,
  language
}: PathParams): readonly SchemaNode[] => {
  const { kind, loop } = PAGES[page]
  const software =
    kind === 'home' || kind === 'download' ? softwareOf(language) : null
  const video = loop === null ? null : videoOf({ page, language, loop })
  const crumbs = page === 'home' ? null : crumbsOf({ page, language })

  return [software, video, crumbs].filter((node) => {
    return node !== null
  })
}

export const scriptOf = ({ page, language }: PathParams) => {
  return JSON.stringify(schemaOf({ page, language })).replaceAll('<', '\\u003c')
}
