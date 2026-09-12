import { describe, expect, it } from 'vitest'
import type { PageId } from '@/@types/page'
import { LANGUAGES } from '@/constants/languages'
import { MENU_FEATURES, PAGES, PAGE_IDS } from '@/constants/pages'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'
import { alphabetical } from '@/test-order'

const SLUG_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

const WITHOUT_HOME = PAGE_IDS.filter((page) => {
  return page !== 'home'
})

const FILMED = ['home', ...MENU_FEATURES] as const satisfies readonly PageId[]

describe('la table des pages', () => {
  it('donne douze pages', () => {
    expect(PAGE_IDS).toHaveLength(12)
  })

  it('énumère exactement ce que la table porte', () => {
    expect(Object.keys(PAGES).toSorted(alphabetical)).toStrictEqual(
      [...PAGE_IDS].toSorted(alphabetical)
    )
  })

  it('laisse la racine à l’accueil, dans les trois langues', () => {
    const rooted = LANGUAGES.map((language) => {
      return PAGES.home.slugs[language]
    })

    expect(rooted).toStrictEqual(['', '', ''])
  })

  it.each(WITHOUT_HOME)('donne une adresse à %s dans chaque langue', (page) => {
    const slugs = LANGUAGES.map((language) => {
      return PAGES[page].slugs[language]
    })

    expect(slugs.filter(Boolean)).toHaveLength(LANGUAGES.length)
  })

  it.each(WITHOUT_HOME)(
    'écrit l’adresse de %s sans majuscule ni accent',
    (page) => {
      for (const language of LANGUAGES) {
        expect(PAGES[page].slugs[language]).toMatch(SLUG_SHAPE)
      }
    }
  )

  it.each(LANGUAGES)(
    'ne donne pas deux fois la même adresse en %s',
    (language) => {
      const slugs = PAGE_IDS.map((page) => {
        return PAGES[page].slugs[language]
      })

      expect(new Set(slugs).size).toBe(slugs.length)
    }
  )

  it.each(PAGE_IDS)('nomme et promet %s', (page) => {
    expect(PAGE_NAMES[page]).toBeDefined()
    expect(PAGE_PROMISES[page]).toBeDefined()
  })

  it.each(MENU_FEATURES)(
    'ne met au menu que des fonctionnalités, %s',
    (page) => {
      expect(PAGES[page].kind).toBe('feature')
    }
  )

  it.each(PAGE_IDS)('ne donne à %s que des voisines connues', (page) => {
    for (const neighbour of PAGES[page].kin) {
      expect(PAGE_IDS).toContain(neighbour)
    }
  })

  it.each(PAGE_IDS)('ne rend pas %s voisine d’elle-même', (page) => {
    expect(PAGES[page].kin).not.toContain(page)
  })

  it.each(PAGE_IDS)('ne nomme pas deux fois la même voisine de %s', (page) => {
    const { kin } = PAGES[page]

    expect(new Set(kin).size).toBe(kin.length)
  })

  it.each(FILMED)('donne sa propre boucle à %s', (page) => {
    expect(PAGES[page].loop).toBe(page)
  })

  it('ne filme que l’accueil et les fonctionnalités du menu', () => {
    const filmed = PAGE_IDS.filter((page) => {
      return PAGES[page].loop !== null
    })

    expect(filmed.toSorted(alphabetical)).toStrictEqual(
      [...FILMED].toSorted(alphabetical)
    )
  })
})
