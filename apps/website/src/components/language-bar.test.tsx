import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import { LanguageBar } from '@/components/language-bar'
import { LANGUAGE_NAMES, LANGUAGES } from '@/constants/languages'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { showAt } from '@/test-router'

const show = (current: Language) => {
  return showAt({
    at: pathOf({ page: 'wheel', language: current }),
    children: (
      <I18nProvider i18n={SPEAKERS[current]}>
        <LanguageBar page="wheel" />
      </I18nProvider>
    )
  })
}

describe('the language bar', () => {
  afterEach(() => {
    cleanup()
  })

  it('lays the three flags, each language naming itself', () => {
    show('fr')

    expect(
      screen.getByRole('list', { name: 'La langue du site' })
    ).toBeDefined()

    for (const language of LANGUAGES) {
      expect(
        screen.getByRole('link', { name: LANGUAGE_NAMES[language] })
      ).toBeDefined()
    }
  })

  it.each(LANGUAGES)('stays on the page when switching to %s', (language) => {
    show('fr')

    const flag = screen.getByRole('link', { name: LANGUAGE_NAMES[language] })

    expect(flag.getAttribute('href')).toBe(pathOf({ page: 'wheel', language }))
  })

  it.each(LANGUAGES)('lights the %s flag on its own page', (current) => {
    show(current)

    const flag = screen.getByRole('link', { name: LANGUAGE_NAMES[current] })

    expect(flag.getAttribute('aria-current')).toBe('page')
  })

  it.each(LANGUAGES)('leaves the other flags off in %s', (current) => {
    show(current)

    const others = LANGUAGES.filter((language) => {
      return language !== current
    })

    for (const language of others) {
      const flag = screen.getByRole('link', { name: LANGUAGE_NAMES[language] })

      expect(flag.getAttribute('aria-current')).toBeNull()
    }
  })

  it('announces to each flag the language it leads to', () => {
    show('fr')

    for (const language of LANGUAGES) {
      const flag = screen.getByRole('link', { name: LANGUAGE_NAMES[language] })

      expect(flag.getAttribute('hreflang')).toBe(language)
      expect(flag.getAttribute('lang')).toBe(language)
    }
  })
})
