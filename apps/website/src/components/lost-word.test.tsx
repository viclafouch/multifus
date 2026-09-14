import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import type { LostLevel } from '@/components/lost-word'
import { LOST_PROMISE, LOST_TITLE, LostWord } from '@/components/lost-word'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { showAt } from '@/test-router'

const show = (language: Language, level: LostLevel = 1) => {
  return showAt({
    at: pathOf({ page: 'home', language: SOURCE_LANGUAGE }),
    children: <LostWord language={language} level={level} />
  })
}

describe('the word of the lost page', () => {
  afterEach(() => {
    cleanup()
  })

  it.each(LANGUAGES)('says in %s that the page does not exist', (language) => {
    show(language)

    expect(screen.getByText(SPEAKERS[language]._(LOST_TITLE))).toBeDefined()
    expect(screen.getByText(SPEAKERS[language]._(LOST_PROMISE))).toBeDefined()
  })

  it.each(LANGUAGES)('leads back home in %s', (language) => {
    show(language)

    const back = screen.getByRole('link')

    expect(back.getAttribute('href')).toBe(pathOf({ page: 'home', language }))
    expect(back.getAttribute('hreflang')).toBe(language)
  })

  it.each(LANGUAGES)('gives the %s to the screen reader', (language) => {
    const { container } = show(language)

    expect(container.querySelector('[lang]')?.getAttribute('lang')).toBe(
      language
    )
  })

  it.each(LANGUAGES)(
    'titles the %s according to the asked rank',
    (language) => {
      show(language, 2)

      expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
      expect(screen.getByRole('heading', { level: 2 })).toBeDefined()
    }
  )

  it('does not translate two languages the same', () => {
    const titles = LANGUAGES.map((language) => {
      return SPEAKERS[language]._(LOST_TITLE)
    })

    expect(new Set(titles).size).toBe(LANGUAGES.length)
  })
})
