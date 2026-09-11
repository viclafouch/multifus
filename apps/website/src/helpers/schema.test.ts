import { describe, expect, it } from 'vitest'
import type { Language } from '@/@types/language'
import type { PageId } from '@/@types/page'
import { LOOPS } from '@/constants/loops'
import { PAGES, PAGE_IDS } from '@/constants/pages'
import { HOST, RELEASES } from '@/constants/site'
import type { PathParams } from '@/helpers/page'
import { schemaOf, scriptOf } from '@/helpers/schema'

const ADDRESS_KEYS = new Set([
  '@id',
  'url',
  'item',
  'contentUrl',
  'thumbnailUrl',
  'downloadUrl'
])

type NodeOfParams = Readonly<{
  page: PageId
  language: Language
  type: string
}>

const typesOf = ({ page, language }: PathParams) => {
  return schemaOf({ page, language }).map((node) => {
    return node['@type']
  })
}

const nodeOf = ({ page, language, type }: NodeOfParams) => {
  return schemaOf({ page, language }).find((node) => {
    return node['@type'] === type
  })
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

describe('la fiche du logiciel', () => {
  it('se pose sur l’accueil et sur le téléchargement', () => {
    expect(typesOf({ page: 'home', language: 'fr' })).toContain(
      'SoftwareApplication'
    )
    expect(typesOf({ page: 'download', language: 'fr' })).toContain(
      'SoftwareApplication'
    )
  })

  it.each(WITHOUT_SOFTWARE)('ne se pose pas sur %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).not.toContain(
      'SoftwareApplication'
    )
  })

  it('dit le logiciel gratuit, et où le prendre', () => {
    expect(
      nodeOf({ page: 'home', language: 'fr', type: 'SoftwareApplication' })
    ).toMatchObject({
      name: 'Multifus',
      downloadUrl: RELEASES,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
    })
  })

  it('nomme les deux systèmes', () => {
    const software = nodeOf({
      page: 'home',
      language: 'fr',
      type: 'SoftwareApplication'
    })
    const systems = String(software?.operatingSystem)

    expect(systems).toContain('macOS')
    expect(systems).toContain('Windows')
  })

  it('ne décrit qu’un seul logiciel sur les deux pages', () => {
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

describe('la fiche de la vidéo', () => {
  it.each(FILMED)('se pose sur %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('VideoObject')
  })

  it.each(UNFILMED)('ne se pose pas sur %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).not.toContain('VideoObject')
  })

  it('donne à la vidéo son adresse, sa vignette, sa durée et sa date', () => {
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

  it('compte la durée de chaque boucle en secondes entières', () => {
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

  it('ne raconte pas la vidéo en français aux autres langues', () => {
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

describe('le fil d’Ariane', () => {
  it.each(WITHOUT_HOME)('se pose sur %s', (page) => {
    expect(typesOf({ page, language: 'fr' })).toContain('BreadcrumbList')
  })

  it('ne se pose pas sur l’accueil, qui est la première marche', () => {
    expect(typesOf({ page: 'home', language: 'fr' })).not.toContain(
      'BreadcrumbList'
    )
  })

  it('part de l’accueil et s’arrête sur la page', () => {
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

  it('suit la langue de la page', () => {
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

describe('tout le balisage', () => {
  it.each(PAGE_IDS)('donne au moins une fiche à %s', (page) => {
    expect(schemaOf({ page, language: 'fr' }).length).toBeGreaterThan(0)
  })

  it.each(PAGE_IDS)('met chaque fiche de %s sous schema.org', (page) => {
    for (const node of schemaOf({ page, language: 'fr' })) {
      expect(node['@context']).toBe('https://schema.org')
    }
  })

  it.each(PAGE_IDS)('n’écrit que des adresses absolues sur %s', (page) => {
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

  it.each(PAGE_IDS)('garde chez nous les adresses de %s', (page) => {
    for (const node of schemaOf({ page, language: 'fr' })) {
      expect(node['@id'].startsWith(HOST)).toBe(true)
    }
  })
})

describe('le balisage posé dans la page', () => {
  it.each(PAGE_IDS)('ne laisse aucun chevron sortir de %s', (page) => {
    expect(scriptOf({ page, language: 'fr' })).not.toContain('<')
  })

  it('reste lisible comme du JSON', () => {
    const written = scriptOf({ page: 'wheel', language: 'fr' })

    expect(JSON.parse(written)).toStrictEqual(
      schemaOf({ page: 'wheel', language: 'fr' })
    )
  })
})
