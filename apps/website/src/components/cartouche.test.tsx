import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup, render, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import { Cartouche } from '@/components/cartouche'
import { LANGUAGE_NAMES, LANGUAGES } from '@/constants/languages'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'

const show = (current: Language) => {
  return render(
    <I18nProvider i18n={SPEAKERS[current]}>
      <Cartouche page="wheel" current={current} />
    </I18nProvider>
  )
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
    'marque %s quand la page est dans cette langue',
    (current) => {
      show(current)

      for (const language of LANGUAGES) {
        const flag = screen.getByRole('link', {
          name: LANGUAGE_NAMES[language]
        })

        expect(flag.getAttribute('aria-current')).toBe(
          String(language === current)
        )
      }
    }
  )

  it('annonce à chaque drapeau la langue où il mène', () => {
    show('fr')

    for (const language of LANGUAGES) {
      const flag = screen.getByRole('link', { name: LANGUAGE_NAMES[language] })

      expect(flag.getAttribute('hreflang')).toBe(language)
      expect(flag.getAttribute('lang')).toBe(language)
    }
  })
})
