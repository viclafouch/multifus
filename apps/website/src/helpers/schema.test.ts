import { describe, expect, it } from 'vitest'
import type { Language } from '@/@types/language'
import type { PageId } from '@/@types/page'
import { HOST } from '@/constants/host'
import { LOOPS } from '@/constants/loops'
import { PAGES, PAGE_IDS } from '@/constants/pages'
import { RELEASES } from '@/constants/site'
import type { PathParams } from '@/helpers/page'
import type { SchemaNode } from '@/helpers/schema'
import { schemaOf, scriptOf } from '@/helpers/schema'

const ADDRESS_KEYS = new Set([
  '@id',
  'url',
  'item',
  'contentUrl',
  'thumbnailUrl',
  'downloadUrl'
])

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

const FILMED = PAGE_IDS.filter((page) => {
  return PAGES[page].loop !== null
})

const UNFILMED = PAGE_IDS.filter((page) => {
  return PAGES[page].loop === null
})

const WITHOUT_HOME = PAGE_IDS.filter((page) => {
  return page !== 'home'
})

const WITHOUT_SOFTWARE = PAGE_IDS.filter((page) => {
  return page !== 'home' && page !== 'download'
})

describe('the software record', () => {
  it('lands on the home page and on the download page', () => {
    expect(typesOf({ page: 'home', language: 'fr' })).toContain(
      'SoftwareApplication'
    )
    expect(typesOf({ page: 'download', language: 'fr' })).toContain(
      'SoftwareApplication'
    )
  })

  it.each(WITHOUT_SOFTWARE)('does not land on %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).not.toContain(
      'SoftwareApplication'
    )
  })

  it('says the software is free, and where to get it', () => {
    expect(
      nodeOf({ page: 'home', language: 'fr', type: 'SoftwareApplication' })
    ).toMatchObject({
      name: 'Multifus',
      downloadUrl: RELEASES,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
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

  it('describes only one software on both pages', () => {
    const home = nodeOf({
      page: 'home',
      language: 'fr',
      type: 'SoftwareApplication'
    })
    const download = nodeOf({
      page: 'download',
      language: 'fr',
      type: 'SoftwareApplication'
    })

    expect(home?.['@id']).toBe(download?.['@id'])
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
      name: 'Roue des personnages',
      description:
        'Un disque de têtes sous le pouce, et la bonne fenêtre arrive.',
      contentUrl: `${HOST}${LOOPS.wheel.source}`,
      thumbnailUrl: `${HOST}${LOOPS.wheel.poster}`,
      duration: 'PT12S',
      uploadDate: LOOPS.wheel.filmed
    })
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

describe('the whole markup', () => {
  it.each(PAGE_IDS)('gives at least one record to %s', (page) => {
    expect(schemaOf({ page, language: 'fr' }).length).toBeGreaterThan(0)
  })

  it.each(PAGE_IDS)('puts each record of %s under schema.org', (page) => {
    for (const node of schemaOf({ page, language: 'fr' })) {
      expect(node['@context']).toBe('https://schema.org')
    }
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

    expect(JSON.parse(written)).toStrictEqual(
      schemaOf({ page: 'wheel', language: 'fr' })
    )
  })
})
