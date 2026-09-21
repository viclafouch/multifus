import { describe, expect, it } from 'vitest'
import type { PageId } from '@/@types/page'
import { LANGUAGES } from '@/constants/languages'
import { MENU_FEATURES, PAGES, PAGE_IDS } from '@/constants/pages'
import { MENU_HINTS, PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'
import { alphabetical } from '@/test-order'

const SLUG_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

const HINT_LENGTH = 38

const WITHOUT_HOME = PAGE_IDS.filter((page) => {
  return page !== 'home'
})

const FILMED = ['home', ...MENU_FEATURES] as const satisfies readonly PageId[]

describe('the table of the pages', () => {
  it('gives fifteen pages', () => {
    expect(PAGE_IDS).toHaveLength(15)
  })

  it('lists exactly what the table carries', () => {
    expect(Object.keys(PAGES).toSorted(alphabetical)).toStrictEqual(
      [...PAGE_IDS].toSorted(alphabetical)
    )
  })

  it('leaves the root to the home page, in the three languages', () => {
    const rooted = LANGUAGES.map((language) => {
      return PAGES.home.slugs[language]
    })

    expect(rooted).toStrictEqual(['', '', ''])
  })

  it.each(WITHOUT_HOME)('gives an address to %s in each language', (page) => {
    const slugs = LANGUAGES.map((language) => {
      return PAGES[page].slugs[language]
    })

    expect(slugs.filter(Boolean)).toHaveLength(LANGUAGES.length)
  })

  it.each(WITHOUT_HOME)(
    'writes the address of %s without a capital nor an accent',
    (page) => {
      for (const language of LANGUAGES) {
        expect(PAGES[page].slugs[language]).toMatch(SLUG_SHAPE)
      }
    }
  )

  it.each(LANGUAGES)(
    'does not give the same address twice in %s',
    (language) => {
      const slugs = PAGE_IDS.map((page) => {
        return PAGES[page].slugs[language]
      })

      expect(new Set(slugs).size).toBe(slugs.length)
    }
  )

  it.each(PAGE_IDS)('names and promises %s', (page) => {
    expect(PAGE_NAMES[page]).toBeDefined()
    expect(PAGE_PROMISES[page]).toBeDefined()
  })

  it.each(MENU_FEATURES)('puts only features on the menu, %s', (page) => {
    expect(PAGES[page].kind).toBe('feature')
  })

  it.each(MENU_FEATURES)(
    'holds the menu sentence of %s on one line',
    (page) => {
      expect(MENU_HINTS[page].message).toBeDefined()
      expect(MENU_HINTS[page].message?.length).toBeLessThanOrEqual(HINT_LENGTH)
    }
  )

  it.each(PAGE_IDS)('gives %s only known neighbours', (page) => {
    for (const neighbour of PAGES[page].kin) {
      expect(PAGE_IDS).toContain(neighbour)
    }
  })

  it.each(PAGE_IDS)('gives %s only neighbours with a poster', (page) => {
    for (const neighbour of PAGES[page].kin) {
      expect(MENU_FEATURES).toContain(neighbour)
      expect(PAGES[neighbour].loop).not.toBeNull()
    }
  })

  it.each(PAGE_IDS)('does not make %s a neighbour of itself', (page) => {
    expect(PAGES[page].kin).not.toContain(page)
  })

  it.each(PAGE_IDS)('does not name the same neighbour of %s twice', (page) => {
    const { kin } = PAGES[page]

    expect(new Set(kin).size).toBe(kin.length)
  })

  it.each(FILMED)('gives its own loop to %s', (page) => {
    expect(PAGES[page].loop).toBe(page)
  })

  it('films only the home page and the features of the menu', () => {
    const filmed = PAGE_IDS.filter((page) => {
      return PAGES[page].loop !== null
    })

    expect(filmed.toSorted(alphabetical)).toStrictEqual(
      [...FILMED].toSorted(alphabetical)
    )
  })
})
