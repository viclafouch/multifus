import { describe, expect, it } from 'vitest'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'
import { PROVENANCE_IDS, PROVENANCES } from '@/constants/provenance'
import { SPEAKERS } from '@/lib/i18n'

const ORIGIN_FLOOR = 100

const TRANSLATED = LANGUAGES.filter((language) => {
  return language !== SOURCE_LANGUAGE
})

const PHRASES = PROVENANCE_IDS.flatMap((provenance) => {
  const { name, origin } = PROVENANCES[provenance]

  return [name, origin]
})

describe('la provenance des images', () => {
  it('range chaque famille du dépôt, et pas une de plus', () => {
    const families = Object.keys(PROVENANCES)

    expect(PROVENANCE_IDS).toHaveLength(families.length)
    expect(new Set(PROVENANCE_IDS)).toStrictEqual(new Set(families))
  })

  it('ne nomme pas deux familles pareil', () => {
    const named = PROVENANCE_IDS.map((provenance) => {
      return SPEAKERS.fr._(PROVENANCES[provenance].name)
    })

    expect(new Set(named).size).toBe(named.length)
  })

  it.each(PROVENANCE_IDS)(
    'dit d’où vient %s, et pas en trois mots',
    (provenance) => {
      const origin = SPEAKERS.fr._(PROVENANCES[provenance].origin)

      expect(origin.length).toBeGreaterThanOrEqual(ORIGIN_FLOOR)
    }
  )

  it('ne recopie pas une origine sur une autre', () => {
    const origins = PROVENANCE_IDS.map((provenance) => {
      return SPEAKERS.fr._(PROVENANCES[provenance].origin)
    })

    expect(new Set(origins).size).toBe(origins.length)
  })

  it.each(LANGUAGES)('ne laisse aucune phrase muette en %s', (language) => {
    for (const phrase of PHRASES) {
      expect(SPEAKERS[language]._(phrase)).not.toBe('')
    }
  })

  it.each(TRANSLATED)('ne laisse pas le français passer en %s', (language) => {
    for (const phrase of PHRASES) {
      expect(SPEAKERS[language]._(phrase)).not.toBe(SPEAKERS.fr._(phrase))
    }
  })
})
