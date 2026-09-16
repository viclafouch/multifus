import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/constants/languages'
import { OG_IMAGE } from '@/constants/og'
import { PAGES, PAGE_IDS } from '@/constants/pages'
import {
  alternateRefsOf,
  everyPage,
  matchHasLoop,
  ogPathOf,
  pageOf,
  pathOf
} from '@/helpers/page'

describe('pathOf', () => {
  it('leaves French at the root', () => {
    expect(pathOf({ page: 'home', language: 'fr' })).toBe('/')
    expect(pathOf({ page: 'wheel', language: 'fr' })).toBe(
      '/roue-des-personnages'
    )
  })

  it('prefixes English and Spanish', () => {
    expect(pathOf({ page: 'home', language: 'en' })).toBe('/en')
    expect(pathOf({ page: 'wheel', language: 'en' })).toBe(
      '/en/character-wheel'
    )
    expect(pathOf({ page: 'wheel', language: 'es' })).toBe(
      '/es/rueda-de-personajes'
    )
  })

  it('translates the address, and not only the page', () => {
    const french = pathOf({ page: 'download', language: 'fr' })
    const spanish = pathOf({ page: 'download', language: 'es' })

    expect(french).toBe('/telecharger')
    expect(spanish).toBe('/es/descargar')
  })
})

describe('pageOf', () => {
  it('finds the page again from its address', () => {
    expect(pageOf({ slug: 'roue-des-personnages', language: 'fr' })).toBe(
      'wheel'
    )
    expect(pageOf({ slug: 'character-wheel', language: 'en' })).toBe('wheel')
  })

  it('refuses the address of another language', () => {
    expect(pageOf({ slug: 'character-wheel', language: 'fr' })).toBeNull()
  })

  it('refuses what is not a page', () => {
    expect(pageOf({ slug: 'n-importe-quoi', language: 'fr' })).toBeNull()
  })

  it('goes round from pathOf, in the three languages', () => {
    for (const language of LANGUAGES) {
      for (const page of PAGE_IDS) {
        const slug = PAGES[page].slugs[language]

        expect(pageOf({ slug, language })).toBe(page)
      }
    }
  })
})

describe('ogPathOf', () => {
  const drawn = OG_IMAGE.extension

  it('files the image under its language', () => {
    expect(ogPathOf({ page: 'wheel', language: 'fr' })).toBe(
      `/og/fr/roue-des-personnages.${drawn}`
    )
    expect(ogPathOf({ page: 'wheel', language: 'es' })).toBe(
      `/og/es/rueda-de-personajes.${drawn}`
    )
  })

  it('names the three home pages', () => {
    expect(ogPathOf({ page: 'home', language: 'fr' })).toBe(
      `/og/fr/index.${drawn}`
    )
    expect(ogPathOf({ page: 'home', language: 'en' })).toBe(
      `/og/en/index.${drawn}`
    )
  })

  it('gives one file per page and per language', () => {
    const files = LANGUAGES.flatMap((language) => {
      return PAGE_IDS.map((page) => {
        return ogPathOf({ page, language })
      })
    })

    expect(new Set(files).size).toBe(PAGE_IDS.length * LANGUAGES.length)
  })
})

const FEATURE_LOOP_PATHS = [
  '/autofocus',
  '/roue-des-personnages',
  '/deplacement-rapide',
  '/tableau-des-runes',
  '/messages-prives',
  '/textes-rapides'
]

describe('matchHasLoop', () => {
  it('counts the six feature pages that carry a loop', () => {
    const carried = FEATURE_LOOP_PATHS.filter((path) => {
      return matchHasLoop(path)
    })

    expect(carried).toStrictEqual(FEATURE_LOOP_PATHS)
  })

  it('counts the three home pages, which carry the ambient loop', () => {
    expect(matchHasLoop('/')).toBe(true)
    expect(matchHasLoop('/en')).toBe(true)
    expect(matchHasLoop('/es')).toBe(true)
  })

  it('sets aside mac, which is a feature without a loop', () => {
    expect(matchHasLoop('/mac')).toBe(false)
    expect(matchHasLoop('/en/mac')).toBe(false)
  })

  it('sets aside the pages that show no loop', () => {
    expect(matchHasLoop('/comparatif')).toBe(false)
    expect(matchHasLoop('/telecharger')).toBe(false)
    expect(matchHasLoop('/journal')).toBe(false)
    expect(matchHasLoop('/ankama')).toBe(false)
    expect(matchHasLoop('/mentions-legales')).toBe(false)
  })

  it('answers the same in the three languages', () => {
    expect(matchHasLoop('/en/character-wheel')).toBe(true)
    expect(matchHasLoop('/es/rueda-de-personajes')).toBe(true)
    expect(matchHasLoop('/en/comparison')).toBe(false)
    expect(matchHasLoop('/es/aviso-legal')).toBe(false)
  })

  it('refuses an address that is not a page', () => {
    expect(matchHasLoop('/n-importe-quoi')).toBe(false)
  })
})

describe('everyPage', () => {
  it('gives one address per page and per language', () => {
    const paths = everyPage().map(({ path }) => {
      return path
    })

    expect(paths).toHaveLength(PAGE_IDS.length * LANGUAGES.length)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('opens the three home pages', () => {
    expect(
      everyPage().map(({ path }) => {
        return path
      })
    ).toStrictEqual(expect.arrayContaining(['/', '/en', '/es']))
  })

  it('carries the page each address belongs to', () => {
    expect(everyPage()).toStrictEqual(
      expect.arrayContaining([
        { page: 'wheel', language: 'en', path: '/en/character-wheel' }
      ])
    )
  })
})

describe('alternateRefsOf', () => {
  it('names the three languages and the default', () => {
    expect(
      alternateRefsOf({ page: 'wheel', origin: 'https://multifus.app' })
    ).toStrictEqual([
      { hreflang: 'fr', href: 'https://multifus.app/roue-des-personnages' },
      { hreflang: 'en', href: 'https://multifus.app/en/character-wheel' },
      { hreflang: 'es', href: 'https://multifus.app/es/rueda-de-personajes' },
      {
        hreflang: 'x-default',
        href: 'https://multifus.app/roue-des-personnages'
      }
    ])
  })

  it('sends the default to the French page', () => {
    const refs = alternateRefsOf({
      page: 'mac',
      origin: 'https://multifus.app'
    })
    const french = refs.find(({ hreflang }) => {
      return hreflang === 'fr'
    })
    const fallback = refs.find(({ hreflang }) => {
      return hreflang === 'x-default'
    })

    expect(fallback?.href).toBe(french?.href)
  })
})
