import { describe, expect, it } from 'vitest'
import {
  ANKAMA_LIMIT,
  ANKAMA_RULES,
  ANKAMA_SOURCE_IDS,
  ANKAMA_SOURCES
} from '@/constants/ankama'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'
import { SPEAKERS } from '@/lib/i18n'

const QUOTE_FLOOR = 80

const LINES_PER_RULE = 3

const TRANSLATED = LANGUAGES.filter((language) => {
  return language !== SOURCE_LANGUAGE
})

const PHRASES = [
  ...ANKAMA_SOURCE_IDS.flatMap((source) => {
    const { name, date, alt } = ANKAMA_SOURCES[source]

    return [name, date, alt]
  }),
  ...ANKAMA_RULES.flatMap((rule) => {
    return [rule.title, ...rule.lines, rule.verdict]
  }),
  ...ANKAMA_LIMIT.flatMap((point) => {
    return [point.lead, point.line]
  })
]

describe('the two sources of Ankama', () => {
  it('keeps exactly two of them', () => {
    expect(ANKAMA_SOURCE_IDS).toStrictEqual(['post', 'forum'])
  })

  it.each(ANKAMA_SOURCE_IDS)(
    'gives %s its screenshot and its address',
    (source) => {
      const { shot, href } = ANKAMA_SOURCES[source]

      expect(shot.src).not.toBe('')
      expect(shot.width).toBeGreaterThan(0)
      expect(shot.height).toBeGreaterThan(0)
      expect(href.startsWith('https://')).toBe(true)
    }
  )

  it.each(ANKAMA_SOURCE_IDS)('quotes %s enough for a judgement', (source) => {
    expect(ANKAMA_SOURCES[source].quote.length).toBeGreaterThanOrEqual(
      QUOTE_FLOOR
    )
  })

  it('does not copy the same quotation twice', () => {
    const quotes = ANKAMA_SOURCE_IDS.map((source) => {
      return ANKAMA_SOURCES[source].quote
    })

    expect(new Set(quotes).size).toBe(quotes.length)
  })
})

describe('the two rules the page draws', () => {
  it('puts what is tolerated in front of what gets you banned', () => {
    expect(
      ANKAMA_RULES.map((rule) => {
        return rule.tone
      })
    ).toStrictEqual(['kept', 'banned'])
  })

  it.each(ANKAMA_RULES)('gives $tone three lines', (rule) => {
    expect(rule.lines).toHaveLength(LINES_PER_RULE)
  })

  it('names Multifus in every verdict', () => {
    for (const rule of ANKAMA_RULES) {
      expect(SPEAKERS.fr._(rule.verdict)).toContain('Multifus')
    }
  })
})

describe('what the page says', () => {
  it('does not say the same sentence twice', () => {
    const french = PHRASES.map((phrase) => {
      return SPEAKERS.fr._(phrase)
    })

    expect(new Set(french).size).toBe(french.length)
  })

  it('says on a plate what the page does not promise', () => {
    const french = ANKAMA_LIMIT.map((point) => {
      return SPEAKERS.fr._(point.lead)
    })

    expect(french).toContain('Une tolérance n’est pas une autorisation.')
  })

  it.each(LANGUAGES)('leaves no sentence silent in %s', (language) => {
    for (const phrase of PHRASES) {
      expect(SPEAKERS[language]._(phrase)).not.toBe('')
    }
  })

  it.each(TRANSLATED)('does not let French go through in %s', (language) => {
    for (const phrase of PHRASES) {
      expect(SPEAKERS[language]._(phrase)).not.toBe(SPEAKERS.fr._(phrase))
    }
  })
})
