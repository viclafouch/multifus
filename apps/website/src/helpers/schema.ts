import type {
  BreadcrumbList,
  Graph,
  JsonLdObject,
  Person,
  SoftwareApplication,
  VideoObject,
  WebPage,
  WebSite
} from 'schema-dts'
import type { Language } from '@/@types/language'
import type { LoopId, PageId } from '@/@types/page'
import { HOST } from '@/constants/host'
import { LOOPS } from '@/constants/loops'
import { OG_HEIGHT, OG_IMAGE, OG_WIDTH } from '@/constants/og'
import { MENU_FEATURES, PAGES } from '@/constants/pages'
import { HOME_SHOT } from '@/constants/shots'
import {
  AUTHOR,
  AUTHOR_CODE,
  AUTHOR_NAME,
  RELEASES,
  REPOSITORY
} from '@/constants/site'
import { SYSTEM_IDS, SYSTEM_VERSIONS } from '@/constants/systems'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'
import { addressOf, ogAddressOf } from '@/helpers/address'
import type { PathParams } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'

type Addressed<Node> = Node & Required<Pick<JsonLdObject, '@id'>>

export type SchemaNode =
  | ReturnType<typeof crumbsOf>
  | ReturnType<typeof webPageOf>
  | ReturnType<typeof personOf>
  | ReturnType<typeof siteOf>
  | ReturnType<typeof softwareOf>
  | ReturnType<typeof videoOf>

const CONTEXT = 'https://schema.org'

const SYSTEMS = SYSTEM_IDS.map((system) => {
  return SYSTEM_VERSIONS[system]
}).join(', ')

const LICENSE = `${REPOSITORY}/blob/main/LICENSE`

const AUTHOR_AT = `${HOST}/#author`

const WEBSITE_AT = `${HOST}/#website`

const SOFTWARE_AT = `${HOST}/#multifus`

const matchHasSoftware = (page: PageId) => {
  const { kind } = PAGES[page]

  return kind === 'home' || kind === 'download' || kind === 'windows'
}

const personOf = () => {
  return {
    '@type': 'Person',
    '@id': AUTHOR_AT,
    name: AUTHOR_NAME,
    url: AUTHOR_CODE,
    sameAs: [AUTHOR, AUTHOR_CODE]
  } satisfies Addressed<Person>
}

const siteOf = (language: Language) => {
  const speaker = SPEAKERS[language]

  return {
    '@type': 'WebSite',
    '@id': WEBSITE_AT,
    name: 'Multifus',
    url: addressOf({ page: 'home', language }),
    description: speaker._(PAGE_PROMISES.home),
    inLanguage: language,
    publisher: { '@id': AUTHOR_AT }
  } satisfies Addressed<WebSite>
}

const softwareOf = (language: Language) => {
  const speaker = SPEAKERS[language]

  return {
    '@type': 'SoftwareApplication',
    '@id': SOFTWARE_AT,
    name: 'Multifus',
    url: addressOf({ page: 'home', language }),
    description: speaker._(PAGE_PROMISES.home),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: SYSTEMS,
    downloadUrl: RELEASES,
    installUrl: RELEASES,
    screenshot: `${HOST}${HOME_SHOT.src}`,
    image: ogAddressOf({ page: 'home', language }),
    featureList: MENU_FEATURES.map((feature) => {
      return speaker._(PAGE_NAMES[feature])
    }),
    license: LICENSE,
    sameAs: REPOSITORY,
    author: { '@id': AUTHOR_AT },
    publisher: { '@id': AUTHOR_AT },
    inLanguage: language,
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR'
    }
  } satisfies Addressed<SoftwareApplication>
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
    '@type': 'VideoObject',
    '@id': `${address}#video`,
    name: speaker._(PAGE_NAMES[page]),
    description: speaker._(PAGE_PROMISES[page]),
    contentUrl: `${HOST}${source}`,
    thumbnailUrl: `${HOST}${poster}`,
    uploadDate: filmed,
    duration: `PT${seconds}S`,
    inLanguage: language,
    isFamilyFriendly: true
  } satisfies Addressed<VideoObject>
}

const crumbsOf = ({ page, language }: PathParams) => {
  const speaker = SPEAKERS[language]
  const address = addressOf({ page, language })

  return {
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
  } satisfies Addressed<BreadcrumbList>
}

const webPageOf = ({ page, language }: PathParams) => {
  const speaker = SPEAKERS[language]
  const address = addressOf({ page, language })

  return {
    '@type': 'WebPage',
    '@id': `${address}#page`,
    url: address,
    name: speaker._(PAGE_NAMES[page]),
    description: speaker._(PAGE_PROMISES[page]),
    inLanguage: language,
    isPartOf: { '@id': WEBSITE_AT },
    breadcrumb: page === 'home' ? undefined : { '@id': `${address}#crumbs` },
    mainEntity: matchHasSoftware(page) ? { '@id': SOFTWARE_AT } : undefined,
    primaryImageOfPage: {
      '@type': 'ImageObject',
      contentUrl: ogAddressOf({ page, language }),
      encodingFormat: OG_IMAGE.type,
      width: String(OG_WIDTH),
      height: String(OG_HEIGHT)
    }
  } satisfies Addressed<WebPage>
}

export const schemaOf = ({
  page,
  language
}: PathParams): readonly SchemaNode[] => {
  const { loop } = PAGES[page]
  const software = matchHasSoftware(page) ? softwareOf(language) : null
  const video = loop === null ? null : videoOf({ page, language, loop })
  const crumbs = page === 'home' ? null : crumbsOf({ page, language })

  return [
    siteOf(language),
    personOf(),
    webPageOf({ page, language }),
    software,
    video,
    crumbs
  ].filter((node) => {
    return node !== null
  })
}

export const graphOf = ({ page, language }: PathParams) => {
  return {
    '@context': CONTEXT,
    '@graph': schemaOf({ page, language })
  } satisfies Graph
}

export const scriptOf = ({ page, language }: PathParams) => {
  return JSON.stringify(graphOf({ page, language })).replaceAll('<', '\\u003c')
}
