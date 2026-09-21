import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup } from '@testing-library/react'
import type { AskLine } from '@/@types/ask'
import type { Language } from '@/@types/language'
import { Answer } from '@/components/answer'
import { LANGUAGES } from '@/constants/languages'
import { QUESTIONS } from '@/constants/questions'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { showAt } from '@/test-router'

const EVERY_LINE: readonly AskLine[] = Object.values(QUESTIONS).flatMap(
  (question) => {
    return question.answer
  }
)

const CARRYING_A_VALUE = EVERY_LINE.filter(({ said }) => {
  return said.values !== undefined
})

const valuesOf = ({ said }: AskLine) => {
  return Object.values(said.values ?? {}).filter((value) => {
    return typeof value === 'string'
  })
}

const show = (line: AskLine, language: Language) => {
  return showAt({
    at: pathOf({ page: 'faq', language }),
    children: (
      <I18nProvider i18n={SPEAKERS[language]}>
        <Answer lines={[line]} />
      </I18nProvider>
    )
  })
}

describe('an answer', () => {
  afterEach(() => {
    cleanup()
  })

  it('has lines that carry a value, on more than one page', () => {
    expect(CARRYING_A_VALUE.length).toBeGreaterThan(0)
  })

  it.each(LANGUAGES)(
    'writes the value a line carries rather than an empty hole, in %s',
    (language) => {
      for (const line of CARRYING_A_VALUE) {
        const { container } = show(line, language)

        for (const value of valuesOf(line)) {
          expect(container.textContent).toContain(value)
        }

        cleanup()
      }
    }
  )
})
