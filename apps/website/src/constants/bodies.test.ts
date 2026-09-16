import { describe, expect, it } from 'vitest'
import type { Body } from '@/@types/body'
import { PAGE_BODIES } from '@/constants/bodies'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'
import { PAGES, PAGE_IDS } from '@/constants/pages'
import { SPEAKERS } from '@/lib/i18n'

const BOON_FLOOR = 3

const BODY_FLOOR = 450

const TITLE_CEILING = 48

const WITH_BODY = PAGE_IDS.flatMap((page) => {
  const body = PAGE_BODIES[page]

  return body === null ? [] : [{ page, body }]
})

const BODIED = PAGE_IDS.filter((page) => {
  const { kind } = PAGES[page]

  return kind === 'feature' || kind === 'mac'
})

const TRANSLATED = LANGUAGES.filter((language) => {
  return language !== SOURCE_LANGUAGE
})

const phrasesOf = (body: Body) => {
  return [
    body.lead,
    ...body.boons.flatMap((boon) => {
      return [boon.title, boon.line]
    }),
    ...body.caveats
  ]
}

const frenchOf = (body: Body) => {
  return phrasesOf(body).map((phrase) => {
    return SPEAKERS.fr._(phrase)
  })
}

describe('the body of the pages', () => {
  it('lays a body only on a feature and on the Mac page', () => {
    for (const page of PAGE_IDS) {
      expect(PAGE_BODIES[page] === null).toBe(!BODIED.includes(page))
    }
  })

  it('writes a body for each of them', () => {
    expect(WITH_BODY).toHaveLength(BODIED.length)
  })

  it.each(WITH_BODY)('gives at least three boons to $page', ({ body }) => {
    expect(body.boons.length).toBeGreaterThanOrEqual(BOON_FLOOR)
  })

  it.each(WITH_BODY)('keeps the boon titles short on $page', ({ body }) => {
    for (const language of LANGUAGES) {
      for (const boon of body.boons) {
        expect(SPEAKERS[language]._(boon.title).length).toBeLessThanOrEqual(
          TITLE_CEILING
        )
      }
    }
  })

  it.each(WITH_BODY)(
    'writes enough to be filed somewhere, $page',
    ({ body }) => {
      expect(frenchOf(body).join(' ').length).toBeGreaterThanOrEqual(BODY_FLOOR)
    }
  )

  it('does not say the same sentence twice', () => {
    const french = WITH_BODY.flatMap(({ body }) => {
      return frenchOf(body)
    })

    expect(new Set(french).size).toBe(french.length)
  })

  it.each(LANGUAGES)('leaves no sentence silent in %s', (language) => {
    for (const { body } of WITH_BODY) {
      for (const phrase of phrasesOf(body)) {
        expect(SPEAKERS[language]._(phrase)).not.toBe('')
      }
    }
  })

  it.each(TRANSLATED)('does not let French go through in %s', (language) => {
    for (const { body } of WITH_BODY) {
      for (const phrase of phrasesOf(body)) {
        expect(SPEAKERS[language]._(phrase)).not.toBe(SPEAKERS.fr._(phrase))
      }
    }
  })
})
