import { describe, expect, it } from 'vitest'
import type { Language } from '@/@types/language'
import type { PageId } from '@/@types/page'
import { HOST } from '@/constants/host'
import { LANGUAGES } from '@/constants/languages'
import { captionOf, LOOP_FORMAT, LOOPS } from '@/constants/loops'
import { PAGES, PAGE_IDS } from '@/constants/pages'
import { PAGE_QUESTIONS, QUESTIONS } from '@/constants/questions'
import { SYSTEM_SHOT_ALTS, SYSTEM_SHOTS } from '@/constants/shots'
import { RELEASES } from '@/constants/site'
import { SYSTEM_IDS } from '@/constants/systems'
import type { PathParams } from '@/helpers/page'
import type { SchemaNode } from '@/helpers/schema'
import { graphOf, schemaOf, scriptOf } from '@/helpers/schema'
import { SPEAKERS } from '@/lib/i18n'

const ADDRESS_KEYS = new Set([
  '@id',
  'url',
  'item',
  'contentUrl',
  'thumbnailUrl',
  'downloadUrl',
  'installUrl',
  'releaseNotes',
  'screenshot',
  'image',
  'license'
])

const DAY = /^\d{4}-\d{2}-\d{2}$/u

const DAY_AND_HOUR = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/u

type SchemaType = SchemaNode['@type']

type NodeOfParams<Wanted extends SchemaType> = Readonly<{
  page: PageId
  language: Language
  type: Wanted
}>

const typesOf = ({ page, language }: PathParams) => {
  return schemaOf({ page, language }).map((node) => {
    return node['@type']
  })
}

const nodeOf = <Wanted extends SchemaType>({
  page,
  language,
  type
}: NodeOfParams<Wanted>) => {
  return schemaOf({ page, language }).find(
    (node): node is Extract<SchemaNode, { '@type': Wanted }> => {
      return node['@type'] === type
    }
  )
}

const EVERY_FAQ_ANSWER = LANGUAGES.flatMap((language) => {
  const written = nodeOf({ page: 'faq', language, type: 'FAQPage' })

  return written === undefined
    ? []
    : written.mainEntity.map((question) => {
        return question.acceptedAnswer.text
      })
})

const FILMED = PAGE_IDS.filter((page) => {
  return PAGES[page].loop !== null
})

const UNFILMED = PAGE_IDS.filter((page) => {
  return PAGES[page].loop === null
})

const WITHOUT_HOME = PAGE_IDS.filter((page) => {
  return page !== 'home'
})

const WITH_SOFTWARE = PAGE_IDS.filter((page) => {
  return page !== 'legal'
})

const ASKING = PAGE_IDS.filter((page) => {
  return PAGE_QUESTIONS[page] !== null
})

const SILENT = PAGE_IDS.filter((page) => {
  return PAGE_QUESTIONS[page] === null
})

const ASKED_ON = PAGE_IDS.flatMap((page) => {
  const asked = PAGE_QUESTIONS[page]

  return asked === null ? [] : [{ page, asked }]
})

const ABOUT_SOFTWARE = SILENT.filter((page) => {
  return page !== 'home' && page !== 'legal'
})

describe('the software record', () => {
  it.each(WITH_SOFTWARE)('lands on %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('SoftwareApplication')
  })

  it('stays out of the legal notice, which talks about the site', () => {
    expect(typesOf({ page: 'legal', language: 'fr' })).not.toContain(
      'SoftwareApplication'
    )
  })

  it('says the software is free, and where to get it', () => {
    expect(
      nodeOf({ page: 'home', language: 'fr', type: 'SoftwareApplication' })
    ).toMatchObject({
      name: 'Multifus',
      downloadUrl: RELEASES,
      releaseNotes: `${HOST}/journal`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: RELEASES
      }
    })
  })

  it('names the two systems', () => {
    const software = nodeOf({
      page: 'home',
      language: 'fr',
      type: 'SoftwareApplication'
    })
    expect(software?.operatingSystem).toContain('macOS')
    expect(software?.operatingSystem).toContain('Windows')
  })

  it('speaks the three languages of the site, whatever the page reads in', () => {
    const software = nodeOf({
      page: 'home',
      language: 'es',
      type: 'SoftwareApplication'
    })

    expect(software?.inLanguage).toStrictEqual(['fr', 'en', 'es'])
  })

  it.each(LANGUAGES)(
    'shows the window of the software in %s, one system at a time',
    (language) => {
      expect(
        nodeOf({ page: 'home', language, type: 'SoftwareApplication' })
          ?.screenshot
      ).toStrictEqual(
        SYSTEM_IDS.map((system) => {
          const { full } = SYSTEM_SHOTS[system][language]

          return {
            '@type': 'ImageObject',
            contentUrl: `${HOST}${full.src}`,
            width: String(full.width),
            height: String(full.height),
            caption: SPEAKERS[language]._(SYSTEM_SHOT_ALTS[system])
          }
        })
      )
    }
  )

  it('tells no version while no release is published', () => {
    const software = nodeOf({
      page: 'home',
      language: 'fr',
      type: 'SoftwareApplication'
    })

    expect(software?.softwareVersion).toBeUndefined()
    expect(software?.dateModified).toBeUndefined()
  })

  it('gives the software one record per language, and one per language only', () => {
    const french = nodeOf({
      page: 'home',
      language: 'fr',
      type: 'SoftwareApplication'
    })
    const english = nodeOf({
      page: 'download',
      language: 'en',
      type: 'SoftwareApplication'
    })
    const alsoEnglish = nodeOf({
      page: 'wheel',
      language: 'en',
      type: 'SoftwareApplication'
    })

    expect(french?.['@id']).not.toBe(english?.['@id'])
    expect(english?.['@id']).toBe(alsoEnglish?.['@id'])
  })
})

describe('the video record', () => {
  it.each(FILMED)('lands on %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('VideoObject')
  })

  it.each(UNFILMED)('does not land on %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).not.toContain('VideoObject')
  })

  it('gives the video its address, its thumbnail, its duration and its date', () => {
    expect(
      nodeOf({ page: 'wheel', language: 'fr', type: 'VideoObject' })
    ).toMatchObject({
      name: 'Le choix de vos personnages au premier plan.',
      contentUrl: `${HOST}${LOOPS.wheel.source}`,
      thumbnailUrl: `${HOST}${LOOPS.wheel.poster}`,
      duration: 'PT12S',
      uploadDate: LOOPS.wheel.filmed
    })
  })

  it('gives the file its format and its size', () => {
    expect(
      nodeOf({ page: 'wheel', language: 'fr', type: 'VideoObject' })
    ).toMatchObject({
      encodingFormat: LOOP_FORMAT,
      width: String(LOOPS.wheel.size.width),
      height: String(LOOPS.wheel.size.height)
    })
  })

  it.each(FILMED)('dates the loop of %s to the hour and the zone', (page) => {
    expect(
      nodeOf({ page, language: 'fr', type: 'VideoObject' })?.uploadDate
    ).toMatch(DAY_AND_HOUR)
  })

  it('names the loop of the home page after what it shows', () => {
    expect(
      nodeOf({ page: 'home', language: 'fr', type: 'VideoObject' })?.name
    ).toBe(SPEAKERS.fr._(captionOf('home')))
  })

  it('counts the duration of each loop in whole seconds', () => {
    expect(
      nodeOf({ page: 'runeTable', language: 'fr', type: 'VideoObject' })
    ).toMatchObject({
      duration: 'PT14S'
    })
    expect(
      nodeOf({ page: 'autoFocus', language: 'fr', type: 'VideoObject' })
    ).toMatchObject({
      duration: 'PT13S'
    })
  })

  it('does not tell the video in French to the other languages', () => {
    const french = nodeOf({
      page: 'wheel',
      language: 'fr',
      type: 'VideoObject'
    })
    const english = nodeOf({
      page: 'wheel',
      language: 'en',
      type: 'VideoObject'
    })

    expect(english?.name).not.toBe(french?.name)
    expect(english?.description).not.toBe(french?.description)
  })
})

describe('the breadcrumb', () => {
  it.each(WITHOUT_HOME)('lands on %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('BreadcrumbList')
  })

  it('does not land on the home page, which is the first step', () => {
    expect(typesOf({ page: 'home', language: 'fr' })).not.toContain(
      'BreadcrumbList'
    )
  })

  it('starts from the home page and stops on the page', () => {
    expect(
      nodeOf({ page: 'wheel', language: 'fr', type: 'BreadcrumbList' })
    ).toMatchObject({
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Multifus',
          item: `${HOST}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Roue des personnages',
          item: `${HOST}/roue-des-personnages`
        }
      ]
    })
  })

  it('follows the language of the page', () => {
    expect(
      nodeOf({ page: 'wheel', language: 'es', type: 'BreadcrumbList' })
    ).toMatchObject({
      itemListElement: [
        { position: 1, item: `${HOST}/es` },
        { position: 2, item: `${HOST}/es/rueda-de-personajes` }
      ]
    })
  })
})

describe('the site and its author', () => {
  it.each(PAGE_IDS)('names both on %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('WebSite')
    expect(typesOf({ page, language: 'fr' })).toContain('Person')
  })

  it('gives the site one record per language, each on its own address', () => {
    const french = nodeOf({ page: 'home', language: 'fr', type: 'WebSite' })
    const spanish = nodeOf({ page: 'wheel', language: 'es', type: 'WebSite' })

    expect(french?.['@id']).toBe(`${HOST}/#website`)
    expect(spanish?.['@id']).toBe(`${HOST}/es#website`)
    expect(french?.url).not.toBe(spanish?.url)
  })

  it('hangs every page of a language under the site of that language', () => {
    const site = nodeOf({ page: 'home', language: 'en', type: 'WebSite' })

    expect(
      nodeOf({ page: 'wheel', language: 'en', type: 'WebPage' })?.isPartOf
    ).toStrictEqual({ '@id': site?.['@id'] })
  })

  it('makes the author the publisher of the site', () => {
    const site = nodeOf({ page: 'home', language: 'fr', type: 'WebSite' })
    const author = nodeOf({ page: 'home', language: 'fr', type: 'Person' })

    expect(site?.publisher).toStrictEqual({ '@id': author?.['@id'] })
  })

  it('keeps one author for the three languages', () => {
    const french = nodeOf({ page: 'home', language: 'fr', type: 'Person' })
    const spanish = nodeOf({ page: 'home', language: 'es', type: 'Person' })

    expect(french).toStrictEqual(spanish)
  })
})

describe('the page record', () => {
  it.each(SILENT)('lands on %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('WebPage')
  })

  it('carries the page, its name and its language', () => {
    expect(
      nodeOf({ page: 'wheel', language: 'fr', type: 'WebPage' })
    ).toMatchObject({
      url: `${HOST}/roue-des-personnages`,
      name: 'Roue des personnages',
      inLanguage: 'fr'
    })
  })

  it('points at the breadcrumb of the page, and at nothing on the home page', () => {
    const crumbs = nodeOf({
      page: 'wheel',
      language: 'fr',
      type: 'BreadcrumbList'
    })

    expect(
      nodeOf({ page: 'wheel', language: 'fr', type: 'WebPage' })?.breadcrumb
    ).toStrictEqual({ '@id': crumbs?.['@id'] })
    expect(
      nodeOf({ page: 'home', language: 'fr', type: 'WebPage' })?.breadcrumb
    ).toBeUndefined()
  })

  it('makes the software the subject of the home page', () => {
    const software = nodeOf({
      page: 'home',
      language: 'fr',
      type: 'SoftwareApplication'
    })

    expect(
      nodeOf({ page: 'home', language: 'fr', type: 'WebPage' })?.mainEntity
    ).toStrictEqual({ '@id': software?.['@id'] })
  })

  it.each(ABOUT_SOFTWARE)('says that %s is about the software', (page) => {
    const software = nodeOf({
      page,
      language: 'fr',
      type: 'SoftwareApplication'
    })

    expect(
      nodeOf({ page, language: 'fr', type: 'WebPage' })?.about
    ).toStrictEqual({ '@id': software?.['@id'] })
  })

  it('leaves the legal notice out of the software', () => {
    const legal = nodeOf({ page: 'legal', language: 'fr', type: 'WebPage' })

    expect(legal?.about).toBeUndefined()
    expect(legal?.mainEntity).toBeUndefined()
  })

  it.each(SILENT)('says the day %s last changed', (page) => {
    expect(
      nodeOf({ page, language: 'fr', type: 'WebPage' })?.dateModified
    ).toMatch(DAY)
  })

  it.each(ASKING)('says the day the questions of %s last changed', (page) => {
    expect(
      nodeOf({ page, language: 'fr', type: 'FAQPage' })?.dateModified
    ).toMatch(DAY)
  })

  it('shows the Open Graph image of the page', () => {
    expect(
      nodeOf({ page: 'mac', language: 'en', type: 'FAQPage' })
        ?.primaryImageOfPage
    ).toMatchObject({
      '@type': 'ImageObject',
      contentUrl: `${HOST}/og/en/mac.webp`
    })
  })
})

describe('the questions of a page', () => {
  it.each(ASKING)('turns %s into a page of questions', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('FAQPage')
    expect(typesOf({ page, language: 'fr' })).not.toContain('WebPage')
  })

  it.each(SILENT)('leaves %s a plain page', (page) => {
    expect(typesOf({ page, language: 'fr' })).not.toContain('FAQPage')
  })

  it.each(ASKED_ON)(
    'asks on $page the questions the screen shows',
    ({ page, asked }) => {
      const written = nodeOf({ page, language: 'fr', type: 'FAQPage' })

      expect(
        written?.mainEntity.map((question) => {
          return question.name
        })
      ).toStrictEqual(
        asked.map((id) => {
          return SPEAKERS.fr._(QUESTIONS[id].ask)
        })
      )
    }
  )

  it('joins the lines of an answer that takes three of them', () => {
    const written = nodeOf({ page: 'mac', language: 'fr', type: 'FAQPage' })
    const answer = written?.mainEntity.find((question) => {
      return question.name === SPEAKERS.fr._(QUESTIONS.macAccess.ask)
    })

    expect(answer?.acceptedAnswer.text).toBe(
      QUESTIONS.macAccess.answer
        .map(({ said }) => {
          return SPEAKERS.fr._(said)
        })
        .join(' ')
    )
  })

  it('hands the search engine an answer without any markup in it', () => {
    for (const answered of EVERY_FAQ_ANSWER) {
      expect(answered).not.toMatch(/<\/?\d/u)
    }
  })

  it('asks in the language of the page', () => {
    const spanish = nodeOf({ page: 'windows', language: 'es', type: 'FAQPage' })
    const french = nodeOf({ page: 'windows', language: 'fr', type: 'FAQPage' })

    expect(spanish?.mainEntity[0]?.name).not.toBe(french?.mainEntity[0]?.name)
  })
})

describe('the whole markup', () => {
  it.each(PAGE_IDS)('gives at least one record to %s', (page) => {
    expect(schemaOf({ page, language: 'fr' }).length).toBeGreaterThan(0)
  })

  it.each(PAGE_IDS)('holds every record of %s in one graph', (page) => {
    const graph = graphOf({ page, language: 'fr' })

    expect(graph['@context']).toBe('https://schema.org')
    expect(graph['@graph']).toStrictEqual(schemaOf({ page, language: 'fr' }))
  })

  it.each(PAGE_IDS)('gives each record of %s its own address', (page) => {
    const written = schemaOf({ page, language: 'fr' }).map((node) => {
      return node['@id']
    })

    expect(new Set(written).size).toBe(written.length)
  })

  it.each(PAGE_IDS)('writes only absolute addresses on %s', (page) => {
    const written = JSON.stringify(schemaOf({ page, language: 'fr' }))
    const addresses = [...written.matchAll(/"([^"]+)":"([^"]*)"/gu)].filter(
      (found) => {
        return ADDRESS_KEYS.has(found[1])
      }
    )

    expect(addresses.length).toBeGreaterThan(0)

    for (const [, , address] of addresses) {
      expect(address.startsWith('https://')).toBe(true)
    }
  })

  it.each(PAGE_IDS)('keeps the addresses of %s at home', (page) => {
    for (const node of schemaOf({ page, language: 'fr' })) {
      expect(node['@id'].startsWith(HOST)).toBe(true)
    }
  })
})

describe('the markup laid in the page', () => {
  it.each(PAGE_IDS)('lets no angle bracket out of %s', (page) => {
    expect(scriptOf({ page, language: 'fr' })).not.toContain('<')
  })

  it('stays readable as JSON', () => {
    const written = scriptOf({ page: 'wheel', language: 'fr' })
    const graph = graphOf({ page: 'wheel', language: 'fr' })
    const laid = JSON.stringify(graph)

    expect(JSON.parse(written)).toStrictEqual(JSON.parse(laid))
  })
})
