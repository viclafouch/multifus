import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import { SiteFooter } from '@/components/site-footer'
import { ELSEWHERE_LINKS } from '@/constants/elsewhere'
import { LANGUAGE_NAMES, LANGUAGES } from '@/constants/languages'
import { PAGE_IDS } from '@/constants/pages'
import { PAGE_NAMES } from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { showAt } from '@/test-router'

const show = (language: Language) => {
  return showAt({
    at: pathOf({ page: 'home', language }),
    children: (
      <I18nProvider i18n={SPEAKERS[language]}>
        <SiteFooter page="home" />
      </I18nProvider>
    )
  })
}

describe('the site footer', () => {
  afterEach(() => {
    cleanup()
  })

  it.each(LANGUAGES)('leads to every page of the site in %s', (language) => {
    show(language)

    const speaker = SPEAKERS[language]

    const written = new Set(
      screen.getAllByRole('link').map((link) => {
        return link.getAttribute('href')
      })
    )

    for (const page of PAGE_IDS) {
      expect(written.has(pathOf({ page, language }))).toBe(true)
    }

    for (const page of PAGE_IDS.filter((found) => {
      return found !== 'home'
    })) {
      expect(
        screen.getByRole('link', { name: speaker._(PAGE_NAMES[page]) })
      ).toBeDefined()
    }
  })

  it('names the three columns of pages', () => {
    show('fr')

    for (const title of ['Les fonctionnalités', 'Le logiciel', 'Le projet']) {
      expect(screen.getByRole('navigation', { name: title })).toBeDefined()
    }
  })

  it.each(LANGUAGES)('leads outside the site in %s', (language) => {
    show(language)

    const speaker = SPEAKERS[language]

    for (const { href, name } of ELSEWHERE_LINKS) {
      const link = screen.getByRole('link', {
        name: (found) => {
          return found.startsWith(speaker._(name))
        }
      })

      expect(link.getAttribute('href')).toBe(href)
      expect(link.getAttribute('rel')).toBe('noopener')
    }
  })

  it('offers the three languages on the page being read', () => {
    show('fr')

    for (const language of LANGUAGES) {
      expect(
        screen
          .getByRole('link', { name: LANGUAGE_NAMES[language] })
          .getAttribute('href')
      ).toBe(pathOf({ page: 'home', language }))
    }
  })

  it('credits Ankama for the images of the game', () => {
    show('fr')

    expect(
      screen.getByText(/Dofus Retro est une marque d’Ankama/u)
    ).toBeDefined()
  })
})
