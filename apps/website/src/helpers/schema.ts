import type {
  BreadcrumbList,
  FAQPage,
  Graph,
  ImageObject,
  JsonLdObject,
  Person,
  Question,
  SoftwareApplication,
  VideoObject,
  WebPage,
  WebSite
} from 'schema-dts'
import type { AskId } from '@/@types/ask'
import type { Language } from '@/@types/language'
import type { LoopId, PageId } from '@/@types/page'
import { HOST } from '@/constants/host'
import { LANGUAGES } from '@/constants/languages'
import { captionOf, LOOP_FORMAT, LOOPS } from '@/constants/loops'
import { OG_HEIGHT, OG_IMAGE, OG_WIDTH } from '@/constants/og'
import { MENU_FEATURES, PAGES } from '@/constants/pages'
import { PAGE_QUESTIONS, QUESTIONS } from '@/constants/questions'
import { SYSTEM_SHOT_ALTS, SYSTEM_SHOTS } from '@/constants/shots'
import {
  AUTHOR,
  AUTHOR_CODE,
  AUTHOR_NAME,
  RELEASES,
  REPOSITORY
} from '@/constants/site'
import { SYSTEM_IDS, SYSTEM_VERSIONS } from '@/constants/systems'
import {
  PAGE_DESCRIPTIONS,
  PAGE_NAMES,
  SOFTWARE_CATEGORY
} from '@/constants/wording'
import { addressOf, ogAddressOf } from '@/helpers/address'
import type { PathParams } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'

type Addressed<Node> = Node & Required<Pick<JsonLdObject, '@id'>>

export type SchemaNode =
  | ReturnType<typeof crumbsOf>
  | ReturnType<typeof faqPageOf>
  | ReturnType<typeof personOf>
  | ReturnType<typeof siteOf>
  | ReturnType<typeof softwareOf>
  | ReturnType<typeof videoOf>
  | ReturnType<typeof webPageOf>

const CONTEXT = 'https://schema.org'

const SYSTEMS = SYSTEM_IDS.map((system) => {
  return SYSTEM_VERSIONS[system]
}).join(', ')

const LICENSE = `${REPOSITORY}/blob/main/LICENSE`

const IN_STOCK = 'https://schema.org/InStock'

const AUTHOR_AT = `${HOST}/#author`

const websiteAt = (language: Language) => {
  return `${addressOf({ page: 'home', language })}#website`
}

const softwareAt = (language: Language) => {
  return `${addressOf({ page: 'home', language })}#multifus`
}

const matchHasSoftware = (page: PageId) => {
  return page !== 'legal'
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
    '@id': websiteAt(language),
    name: 'Multifus',
    url: addressOf({ page: 'home', language }),
    description: speaker._(PAGE_DESCRIPTIONS.home),
    inLanguage: language,
    publisher: { '@id': AUTHOR_AT }
  } satisfies Addressed<WebSite>
}

const softwareOf = (language: Language) => {
  const speaker = SPEAKERS[language]
  const release = __RELEASE__

  return {
    '@type': 'SoftwareApplication',
    '@id': softwareAt(language),
    name: 'Multifus',
    url: addressOf({ page: 'home', language }),
    description: speaker._(PAGE_DESCRIPTIONS.home),
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: speaker._(SOFTWARE_CATEGORY),
    operatingSystem: SYSTEMS,
    softwareVersion: release?.version,
    dateModified: release?.published,
    downloadUrl: RELEASES,
    installUrl: RELEASES,
    releaseNotes: addressOf({ page: 'journal', language }),
    softwareHelp: {
      '@id': `${addressOf({ page: 'download', language })}#page`
    },
    screenshot: SYSTEM_IDS.map((system) => {
      const { full } = SYSTEM_SHOTS[system][language]

      return {
        '@type': 'ImageObject',
        contentUrl: `${HOST}${full.src}`,
        width: String(full.width),
        height: String(full.height),
        caption: speaker._(SYSTEM_SHOT_ALTS[system])
      } satisfies ImageObject
    }),
    image: ogAddressOf({ page: 'home', language }),
    featureList: MENU_FEATURES.map((feature) => {
      return speaker._(PAGE_NAMES[feature])
    }),
    license: LICENSE,
    sameAs: REPOSITORY,
    author: { '@id': AUTHOR_AT },
    publisher: { '@id': AUTHOR_AT },
    inLanguage: [...LANGUAGES],
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: IN_STOCK,
      url: RELEASES
    }
  } satisfies Addressed<SoftwareApplication>
}

type VideoOfParams = PathParams & Readonly<{ loop: LoopId }>

const videoOf = ({ page, language, loop }: VideoOfParams) => {
  const speaker = SPEAKERS[language]
  const address = addressOf({ page, language })
  const { source, poster, size, seconds, filmed } = LOOPS[loop]

  return {
    '@type': 'VideoObject',
    '@id': `${address}#video`,
    name: speaker._(captionOf(loop)),
    description: speaker._(PAGE_DESCRIPTIONS[page]),
    contentUrl: `${HOST}${source}`,
    encodingFormat: LOOP_FORMAT,
    thumbnailUrl: `${HOST}${poster}`,
    width: String(size.width),
    height: String(size.height),
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

const MARKUP = /<\d+\s*\/?>|<\/\d+>/gu

type AskedOfParams = PathParams & Readonly<{ asked: readonly AskId[] }>

const askedOf = ({ page, language, asked }: AskedOfParams) => {
  const speaker = SPEAKERS[language]

  return asked.map((id) => {
    const { ask, answer } = QUESTIONS[id]

    return {
      '@type': 'Question',
      '@id': `${addressOf({ page, language })}#${id}`,
      name: speaker._(ask),
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer
          .map(({ said }) => {
            return speaker._(said).replaceAll(MARKUP, '')
          })
          .join(' ')
      }
    } satisfies Addressed<Question>
  })
}

const pageImageOf = ({ page, language }: PathParams) => {
  return {
    '@type': 'ImageObject',
    contentUrl: ogAddressOf({ page, language }),
    encodingFormat: OG_IMAGE.type,
    width: String(OG_WIDTH),
    height: String(OG_HEIGHT)
  } satisfies ImageObject
}

const sheetOf = ({ page, language }: PathParams) => {
  const speaker = SPEAKERS[language]
  const address = addressOf({ page, language })

  return {
    '@id': `${address}#page`,
    url: address,
    name: speaker._(PAGE_NAMES[page]),
    description: speaker._(PAGE_DESCRIPTIONS[page]),
    inLanguage: language,
    isPartOf: { '@id': websiteAt(language) },
    breadcrumb: page === 'home' ? undefined : { '@id': `${address}#crumbs` },
    dateModified: __WRITTEN_ON__ ?? undefined,
    primaryImageOfPage: pageImageOf({ page, language })
  }
}

const matchIsAboutSoftware = (page: PageId) => {
  return page !== 'home' && matchHasSoftware(page)
}

const webPageOf = ({ page, language }: PathParams) => {
  const software = { '@id': softwareAt(language) }

  return {
    '@type': 'WebPage',
    ...sheetOf({ page, language }),
    mainEntity: page === 'home' ? software : undefined,
    about: matchIsAboutSoftware(page) ? software : undefined
  } satisfies Addressed<WebPage>
}

const faqPageOf = ({ page, language, asked }: AskedOfParams) => {
  return {
    '@type': 'FAQPage',
    ...sheetOf({ page, language }),
    mainEntity: askedOf({ page, language, asked }),
    about: { '@id': softwareAt(language) }
  } satisfies Addressed<FAQPage>
}

export const schemaOf = ({
  page,
  language
}: PathParams): readonly SchemaNode[] => {
  const { loop } = PAGES[page]
  const asked = PAGE_QUESTIONS[page]
  const software = matchHasSoftware(page) ? softwareOf(language) : null
  const video = loop === null ? null : videoOf({ page, language, loop })
  const crumbs = page === 'home' ? null : crumbsOf({ page, language })
  const sheet =
    asked === null
      ? webPageOf({ page, language })
      : faqPageOf({ page, language, asked })

  return [siteOf(language), personOf(), sheet, software, video, crumbs].filter(
    (node) => {
      return node !== null
    }
  )
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
