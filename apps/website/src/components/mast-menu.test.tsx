import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import { MastMenu, MENU_OPEN, MENU_SHUT } from '@/components/mast-menu'
import { ELSEWHERE_LINKS } from '@/constants/elsewhere'
import { LANGUAGE_NAMES, LANGUAGES } from '@/constants/languages'
import { PAGE_IDS } from '@/constants/pages'
import { PAGE_NAMES } from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { WIDE } from '@/lib/media'
import { showAt } from '@/test-router'

class WatchedMedia extends EventTarget {
  matches = false

  constructor(readonly media: string) {
    super()
  }
}

let wide: WatchedMedia

const widen = () => {
  act(() => {
    wide.matches = true
    wide.dispatchEvent(new Event('change'))
  })
}

const show = (language: Language) => {
  return showAt({
    at: pathOf({ page: 'home', language }),
    children: (
      <I18nProvider i18n={SPEAKERS[language]}>
        <MastMenu page="home" />
      </I18nProvider>
    )
  })
}

const drawerOf = () => {
  const found = document.querySelector('dialog')

  if (found === null) {
    throw new Error('the drawer is not in the document')
  }

  return found
}

const openIn = (language: Language) => {
  fireEvent.click(
    screen.getByRole('button', { name: SPEAKERS[language]._(MENU_OPEN) })
  )
}

describe('the menu of the mast', () => {
  beforeEach(() => {
    wide = new WatchedMedia(WIDE)
    vi.stubGlobal('matchMedia', (query: string) => {
      return query === WIDE ? wide : new WatchedMedia(query)
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('keeps the drawer shut until the menu button is pressed', () => {
    show('fr')

    const trigger = screen.getByRole('button', { name: 'Ouvrir le menu' })

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(drawerOf().open).toBe(false)

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(drawerOf().open).toBe(true)
  })

  it.each(LANGUAGES)('leads to every page of the site in %s', (language) => {
    show(language)
    openIn(language)

    const written = new Set(
      screen.getAllByRole('link').map((link) => {
        return link.getAttribute('href')
      })
    )

    for (const page of PAGE_IDS) {
      expect(written.has(pathOf({ page, language }))).toBe(true)
    }
  })

  it.each(LANGUAGES)('leads outside the site in %s', (language) => {
    show(language)
    openIn(language)

    for (const { href, name } of ELSEWHERE_LINKS) {
      const said = SPEAKERS[language]._(name)
      const link = screen.getByRole('link', {
        name: (found) => {
          return found.startsWith(said)
        }
      })

      expect(link.getAttribute('href')).toBe(href)
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })

  it('leaves the choice of language to the footer', () => {
    show('fr')
    openIn('fr')

    for (const language of LANGUAGES) {
      expect(
        screen.queryByRole('link', { name: LANGUAGE_NAMES[language] })
      ).toBeNull()
    }
  })

  it('marks the page being read inside the drawer', () => {
    showAt({
      at: pathOf({ page: 'ankama', language: 'fr' }),
      children: (
        <I18nProvider i18n={SPEAKERS.fr}>
          <MastMenu page="ankama" />
        </I18nProvider>
      )
    })
    openIn('fr')

    expect(
      screen
        .getByRole('link', { name: SPEAKERS.fr._(PAGE_NAMES.ankama) })
        .getAttribute('aria-current')
    ).toBe('page')
  })

  it('shuts the drawer from its own button', () => {
    show('fr')
    openIn('fr')
    fireEvent.click(
      screen.getByRole('button', { name: SPEAKERS.fr._(MENU_SHUT) })
    )

    expect(drawerOf().open).toBe(false)
    expect(
      screen
        .getByRole('button', { name: 'Ouvrir le menu' })
        .getAttribute('aria-expanded')
    ).toBe('false')
  })

  it('shuts the drawer when a page of it is taken', () => {
    show('fr')
    openIn('fr')
    fireEvent.click(
      screen.getByRole('link', { name: SPEAKERS.fr._(PAGE_NAMES.ankama) })
    )

    expect(drawerOf().open).toBe(false)
  })

  it('shuts the drawer on a press outside the sheet', () => {
    show('fr')
    openIn('fr')

    fireEvent.click(drawerOf())

    expect(drawerOf().open).toBe(false)
  })

  it('leaves the drawer open on a press inside the sheet', () => {
    show('fr')
    openIn('fr')
    fireEvent.click(screen.getByRole('navigation', { name: 'Le projet' }))

    expect(drawerOf().open).toBe(true)
  })

  it('shuts the drawer when the screen grows past the menu button', () => {
    show('fr')
    openIn('fr')

    expect(drawerOf().open).toBe(true)

    widen()

    expect(drawerOf().open).toBe(false)
  })
})
