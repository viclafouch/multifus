import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/constants/languages'
import { PAGES, PAGE_IDS } from '@/constants/pages'
import { everyPath, pageOf, pathOf } from '@/helpers/page'

describe('pathOf', () => {
  it('laisse le français à la racine', () => {
    expect(pathOf({ page: 'home', language: 'fr' })).toBe('/')
    expect(pathOf({ page: 'wheel', language: 'fr' })).toBe(
      '/roue-des-personnages'
    )
  })

  it('préfixe l’anglais et l’espagnol', () => {
    expect(pathOf({ page: 'home', language: 'en' })).toBe('/en')
    expect(pathOf({ page: 'wheel', language: 'en' })).toBe(
      '/en/character-wheel'
    )
    expect(pathOf({ page: 'wheel', language: 'es' })).toBe(
      '/es/rueda-de-personajes'
    )
  })

  it('traduit l’adresse, et pas seulement la page', () => {
    const french = pathOf({ page: 'download', language: 'fr' })
    const spanish = pathOf({ page: 'download', language: 'es' })

    expect(french).toBe('/telecharger')
    expect(spanish).toBe('/es/descargar')
  })
})

describe('pageOf', () => {
  it('retrouve la page depuis son adresse', () => {
    expect(pageOf({ slug: 'roue-des-personnages', language: 'fr' })).toBe(
      'wheel'
    )
    expect(pageOf({ slug: 'character-wheel', language: 'en' })).toBe('wheel')
  })

  it('refuse l’adresse d’une autre langue', () => {
    expect(pageOf({ slug: 'character-wheel', language: 'fr' })).toBeNull()
  })

  it('refuse ce qui n’est pas une page', () => {
    expect(pageOf({ slug: 'n-importe-quoi', language: 'fr' })).toBeNull()
  })

  it('fait le tour depuis pathOf, dans les trois langues', () => {
    for (const language of LANGUAGES) {
      for (const page of PAGE_IDS) {
        const slug = PAGES[page].slugs[language]

        expect(pageOf({ slug, language })).toBe(page)
      }
    }
  })
})

describe('everyPath', () => {
  it('donne une adresse par page et par langue', () => {
    const paths = everyPath()

    expect(paths).toHaveLength(PAGE_IDS.length * LANGUAGES.length)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('ouvre les trois accueils', () => {
    expect(everyPath()).toStrictEqual(
      expect.arrayContaining(['/', '/en', '/es'])
    )
  })
})
