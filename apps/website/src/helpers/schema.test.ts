import { describe, expect, it } from 'vitest'
import type { Language } from '@/@types/language'
import type { PageId } from '@/@types/page'
import { HOST } from '@/constants/host'
import { LOOPS } from '@/constants/loops'
import { PAGES, PAGE_IDS } from '@/constants/pages'
import { RELEASES } from '@/constants/site'
import type { PathParams } from '@/helpers/page'
import type { SchemaNode } from '@/helpers/schema'
import { graphOf, schemaOf, scriptOf } from '@/helpers/schema'

const ADDRESS_KEYS = new Set([
  '@id',
  'url',
  'item',
  'contentUrl',
  'thumbnailUrl',
  'downloadUrl',
  'installUrl',
  'screenshot',
  'image',
  'license'
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

const WITH_SOFTWARE = [
  'home',
  'download',
  'mac',
  'windows'
] as const satisfies readonly PageId[]

const WITHOUT_SOFTWARE = PAGE_IDS.filter((page) => {
  return !WITH_SOFTWARE.some((carrier) => {
    return carrier === page
  })
})

describe('the software record', () => {
  it.each(WITH_SOFTWARE)('lands on %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('SoftwareApplication')
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
      description: 'Une roue de têtes, et la bonne fenêtre arrive.',
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

describe('the site and its author', () => {
  it.each(PAGE_IDS)('names both on %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('WebSite')
    expect(typesOf({ page, language: 'fr' })).toContain('Person')
  })

  it('gives the site one address for the three languages', () => {
    const french = nodeOf({ page: 'home', language: 'fr', type: 'WebSite' })
    const spanish = nodeOf({ page: 'wheel', language: 'es', type: 'WebSite' })

    expect(french?.['@id']).toBe(spanish?.['@id'])
    expect(french?.url).not.toBe(spanish?.url)
  })

  it('makes the author the publisher of the site', () => {
    const site = nodeOf({ page: 'home', language: 'fr', type: 'WebSite' })
    const author = nodeOf({ page: 'home', language: 'fr', type: 'Person' })

    expect(site?.publisher).toStrictEqual({ '@id': author?.['@id'] })
  })
})

describe('the page record', () => {
  it.each(PAGE_IDS)('lands on %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('WebPage')
  })

  it('hangs the page under the site', () => {
    const site = nodeOf({ page: 'wheel', language: 'fr', type: 'WebSite' })

    expect(
      nodeOf({ page: 'wheel', language: 'fr', type: 'WebPage' })
    ).toMatchObject({
      url: `${HOST}/roue-des-personnages`,
      name: 'Roue des personnages',
      inLanguage: 'fr',
      isPartOf: { '@id': site?.['@id'] }
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

  it('makes the software the subject of the two pages that carry it', () => {
    const software = nodeOf({
      page: 'home',
      language: 'fr',
      type: 'SoftwareApplication'
    })

    expect(
      nodeOf({ page: 'download', language: 'fr', type: 'WebPage' })?.mainEntity
    ).toStrictEqual({ '@id': software?.['@id'] })
    expect(
      nodeOf({ page: 'wheel', language: 'fr', type: 'WebPage' })?.mainEntity
    ).toBeUndefined()
  })

  it('shows the Open Graph image of the page', () => {
    expect(
      nodeOf({ page: 'mac', language: 'en', type: 'WebPage' })
        ?.primaryImageOfPage
    ).toMatchObject({
      '@type': 'ImageObject',
      contentUrl: `${HOST}/og/en/mac.webp`
    })
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
