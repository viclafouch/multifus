import { describe, expect, it } from 'vitest'
import type { Body } from '@/@types/body'
import { PAGE_BODIES } from '@/constants/bodies'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'
import { PAGES, PAGE_IDS } from '@/constants/pages'
import { SPEAKERS } from '@/lib/i18n'

const PASSAGE_FLOOR = 2

const BODY_FLOOR = 800

const DENIAL = /ne fait pas|ne font pas/u

const WITH_BODY = PAGE_IDS.flatMap((page) => {
  const body = PAGE_BODIES[page]

  return body === null ? [] : [{ page, body }]
})

const TRANSLATED = LANGUAGES.filter((language) => {
  return language !== SOURCE_LANGUAGE
})

const passagesOf = (body: Body) => {
  return [...body.passages, body.limit]
}

const phrasesOf = (body: Body) => {
  return [
    body.lead,
    ...passagesOf(body).flatMap((passage) => {
      return [
        passage.title,
        ...passage.points.flatMap((point) => {
          return [point.lead, point.line]
        })
      ]
    })
  ]
}

const frenchOf = (body: Body) => {
  return phrasesOf(body).map((phrase) => {
    return SPEAKERS.fr._(phrase)
  })
}

describe('le corps des pages', () => {
  it('ne pose un corps que sur une fonctionnalité', () => {
    for (const page of PAGE_IDS) {
      expect(PAGE_BODIES[page] === null).toBe(PAGES[page].kind !== 'feature')
    }
  })

  it('écrit un corps pour chaque fonctionnalité', () => {
    const features = PAGE_IDS.filter((page) => {
      return PAGES[page].kind === 'feature'
    })

    expect(WITH_BODY).toHaveLength(features.length)
  })

  it.each(WITH_BODY)('donne au moins deux passages à $page', ({ body }) => {
    expect(body.passages.length).toBeGreaterThanOrEqual(PASSAGE_FLOOR)
  })

  it.each(WITH_BODY)('ne laisse aucun passage vide sur $page', ({ body }) => {
    for (const passage of passagesOf(body)) {
      expect(passage.points.length).toBeGreaterThan(0)
    }
  })

  it.each(WITH_BODY)('dit ce que $page ne fait pas', ({ body }) => {
    expect(SPEAKERS.fr._(body.limit.title)).toMatch(DENIAL)
  })

  it.each(WITH_BODY)(
    'écrit assez pour se ranger quelque part, $page',
    ({ body }) => {
      expect(frenchOf(body).join(' ').length).toBeGreaterThanOrEqual(BODY_FLOOR)
    }
  )

  it('ne redit pas deux fois la même phrase', () => {
    const french = WITH_BODY.flatMap(({ body }) => {
      return frenchOf(body)
    })

    expect(new Set(french).size).toBe(french.length)
  })

  it.each(LANGUAGES)('ne laisse aucune phrase muette en %s', (language) => {
    for (const { body } of WITH_BODY) {
      for (const phrase of phrasesOf(body)) {
        expect(SPEAKERS[language]._(phrase)).not.toBe('')
      }
    }
  })

  it.each(TRANSLATED)('ne laisse pas le français passer en %s', (language) => {
    for (const { body } of WITH_BODY) {
      for (const phrase of phrasesOf(body)) {
        expect(SPEAKERS[language]._(phrase)).not.toBe(SPEAKERS.fr._(phrase))
      }
    }
  })
})
