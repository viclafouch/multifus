import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Language } from '@/@types/language'
import type { PageId } from '@/@types/page'
import { HOST } from '@/constants/host'
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

const LINKS_FILE = resolve(
  import.meta.dirname,
  '../../../desktop/src-tauri/src/app/links.rs'
)

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
    expect(alternateRefsOf({ page: 'wheel', origin: HOST })).toStrictEqual([
      { hreflang: 'fr', href: `${HOST}/roue-des-personnages` },
      { hreflang: 'en', href: `${HOST}/en/character-wheel` },
      { hreflang: 'es', href: `${HOST}/es/rueda-de-personajes` },
      {
        hreflang: 'x-default',
        href: `${HOST}/roue-des-personnages`
      }
    ])
  })

  it('sends the default to the French page', () => {
    const refs = alternateRefsOf({
      page: 'mac',
      origin: HOST
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

const RUST_LANGUAGES = {
  fr: 'Fr',
  en: 'En',
  es: 'Es'
} as const satisfies Record<Language, string>

const RUST_SITE_PAGES = [
  { variant: 'Journal', page: 'journal' },
  { variant: 'Ankama', page: 'ankama' },
  { variant: 'Legal', page: 'legal' }
] as const satisfies readonly { variant: string; page: PageId }[]

type CaptureOfParams = Readonly<{
  source: string
  pattern: string
}>

const captureOf = ({ source, pattern }: CaptureOfParams) => {
  return new RegExp(pattern, 'u').exec(source)?.groups?.captured
}

type SlugWrittenForParams = Readonly<{
  links: string
  variant: (typeof RUST_SITE_PAGES)[number]['variant']
  language: Language
}>

const slugWrittenFor = ({ links, variant, language }: SlugWrittenForParams) => {
  const arms = captureOf({
    source: links,
    pattern: `Self::${variant} => site_page\\(match language \\{(?<captured>[^}]*)\\}`
  })

  return captureOf({
    source: arms ?? '',
    pattern: `Language::${RUST_LANGUAGES[language]} => "(?<captured>[^"]*)"`
  })
}

describe('the site addresses written in Rust', () => {
  const links = readFileSync(LINKS_FILE, 'utf8')

  it('starts from the host the site is served on', () => {
    expect(
      captureOf({
        source: links,
        pattern: 'const SITE_URL: &str = "(?<captured>[^"]+)"'
      })
    ).toBe(HOST)
  })

  it('joins the host and the page with a single slash', () => {
    expect(links).toContain('format!("{SITE_URL}/{slug}")')
  })

  it('match the pages the site serves, in the three languages', () => {
    for (const { variant, page } of RUST_SITE_PAGES) {
      for (const language of LANGUAGES) {
        const written = slugWrittenFor({ links, variant, language })

        expect(written).toBe(pathOf({ page, language }).slice(1))
      }
    }
  })
})
