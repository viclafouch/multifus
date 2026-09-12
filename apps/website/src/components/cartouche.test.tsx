import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import { Cartouche } from '@/components/cartouche'
import { LANGUAGE_NAMES, LANGUAGES } from '@/constants/languages'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { showAt } from '@/test-router'

const show = (current: Language) => {
  return showAt({
    at: pathOf({ page: 'wheel', language: current }),
    children: (
      <I18nProvider i18n={SPEAKERS[current]}>
        <Cartouche page="wheel" />
      </I18nProvider>
    )
  })
}

describe('le cartouche', () => {
  afterEach(() => {
    cleanup()
  })

  it('pose les trois drapeaux, chaque langue se nommant elle-même', () => {
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

  it.each(LANGUAGES)('reste sur la page en passant en %s', (language) => {
    show('fr')

    const flag = screen.getByRole('link', { name: LANGUAGE_NAMES[language] })

    expect(flag.getAttribute('href')).toBe(pathOf({ page: 'wheel', language }))
  })

  it.each(LANGUAGES)(
    'allume le drapeau de %s sur sa propre page',
    (current) => {
      show(current)

      const flag = screen.getByRole('link', { name: LANGUAGE_NAMES[current] })

      expect(flag.getAttribute('aria-current')).toBe('page')
    }
  )

  it.each(LANGUAGES)('laisse les autres drapeaux éteints en %s', (current) => {
    show(current)

    const others = LANGUAGES.filter((language) => {
      return language !== current
    })

    for (const language of others) {
      const flag = screen.getByRole('link', { name: LANGUAGE_NAMES[language] })

      expect(flag.getAttribute('aria-current')).toBeNull()
    }
  })

  it('annonce à chaque drapeau la langue où il mène', () => {
    show('fr')

    for (const language of LANGUAGES) {
      const flag = screen.getByRole('link', { name: LANGUAGE_NAMES[language] })

      expect(flag.getAttribute('hreflang')).toBe(language)
      expect(flag.getAttribute('lang')).toBe(language)
    }
  })
})
