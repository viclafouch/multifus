import { describe, expect, it } from 'vitest'
import {
  ANKAMA_KEPT,
  ANKAMA_LIMIT,
  ANKAMA_WORD_ALTS,
  ANKAMA_WORD_IDS,
  ANKAMA_WORD_NAMES,
  ANKAMA_WORDS
} from '@/constants/ankama'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'
import { SPEAKERS } from '@/lib/i18n'

const QUOTE_FLOOR = 80

const TRANSLATED = LANGUAGES.filter((language) => {
  return language !== SOURCE_LANGUAGE
})

const PHRASES = [
  ...ANKAMA_WORD_IDS.flatMap((word) => {
    return [ANKAMA_WORD_NAMES[word], ANKAMA_WORD_ALTS[word]]
  }),
  ...[...ANKAMA_KEPT, ...ANKAMA_LIMIT].flatMap((point) => {
    return [point.lead, point.line]
  })
]

describe('the two messages of Ankama', () => {
  it('keeps exactly two of them', () => {
    expect(ANKAMA_WORD_IDS).toStrictEqual(['post', 'forum'])
  })

  it.each(ANKAMA_WORD_IDS)('gives %s its screenshot and its source', (word) => {
    const { shot, href } = ANKAMA_WORDS[word]

    expect(shot).not.toBe('')
    expect(href.startsWith('https://')).toBe(true)
  })

  it.each(ANKAMA_WORD_IDS)('quotes %s enough for a judgement', (word) => {
    expect(ANKAMA_WORDS[word].quote.length).toBeGreaterThanOrEqual(QUOTE_FLOOR)
  })

  it('does not copy the same quotation twice', () => {
    const quotes = ANKAMA_WORD_IDS.map((word) => {
      return ANKAMA_WORDS[word].quote
    })

    expect(new Set(quotes).size).toBe(quotes.length)
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
