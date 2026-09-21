import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup } from '@testing-library/react'
import type { AskId, AskLine } from '@/@types/ask'
import type { Language } from '@/@types/language'
import { LANGUAGES } from '@/constants/languages'
import { PAGE_QUESTIONS, QUESTIONS } from '@/constants/questions'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { FaqScreen } from '@/screens/faq-screen'
import { showAt } from '@/test-router'

const show = (language: Language) => {
  showAt({
    at: pathOf({ page: 'faq', language }),
    children: (
      <I18nProvider i18n={SPEAKERS[language]}>
        <FaqScreen page="faq" />
      </I18nProvider>
    )
  })
}

const rowsOf = () => {
  return [...document.querySelectorAll('details[data-ask]')]
}

const marksOf = (ask: AskId) => {
  const lines: readonly AskLine[] = QUESTIONS[ask].answer

  return lines.flatMap(({ marks = [] }) => {
    return marks
  })
}

const EVERY_MARK = PAGE_QUESTIONS.faq.flatMap(marksOf)

const EVERY_LINKED = EVERY_MARK.flatMap((mark) => {
  if (mark.kind === 'page') {
    return [pathOf({ page: mark.page, language: 'fr' })]
  }

  if (mark.kind === 'out') {
    return [mark.href]
  }

  return []
})

const EVERY_STRESSED = EVERY_MARK.filter((mark) => {
  return mark.kind === 'stress'
})

describe('the screen of the faq', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the questions the page announces, in the same order', () => {
    show('fr')

    const shown = rowsOf().map((row) => {
      return row.id
    })

    expect(shown).toStrictEqual([...PAGE_QUESTIONS.faq])
  })

  it.each(LANGUAGES)('asks each one in %s', (language) => {
    show(language)

    const asked = rowsOf().map((row) => {
      return row.querySelector('summary')?.textContent
    })

    expect(asked).toStrictEqual(
      PAGE_QUESTIONS.faq.map((ask) => {
        return SPEAKERS[language]._(QUESTIONS[ask].ask)
      })
    )
  })

  it('shuts a row when another one opens', () => {
    show('fr')

    const named = new Set(
      rowsOf().map((row) => {
        return row.getAttribute('name')
      })
    )

    expect(named.size).toBe(1)
    expect(named.has(null)).toBe(false)
  })

  it('answers each question with at least one line', () => {
    show('fr')

    for (const row of rowsOf()) {
      expect(row.querySelector('.answer')?.textContent).not.toBe('')
    }
  })

  it('lays every link of an answer inside the answer itself', () => {
    show('fr')

    const written = new Set(
      [...document.querySelectorAll('.answer a')].map((link) => {
        return link.getAttribute('href')
      })
    )

    for (const wanted of EVERY_LINKED) {
      expect(written.has(wanted)).toBe(true)
    }
  })

  it('stresses the words an answer asks to stress', () => {
    show('fr')

    expect(document.querySelectorAll('.answer strong')).toHaveLength(
      EVERY_STRESSED.length
    )
  })

  it('leaves no markup of its own in the text it shows', () => {
    show('fr')

    for (const row of rowsOf()) {
      expect(row.textContent).not.toMatch(/<\/?\d/u)
    }
  })
})
