import { describe, expect, it } from 'vitest'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'
import { PAGE_NAMES, SITE_TITLE } from '@/constants/wording'
import { SPEAKERS } from '@/lib/i18n'

const TRANSLATED = LANGUAGES.filter((language) => {
  return language !== SOURCE_LANGUAGE
})

describe('the three voices', () => {
  it('each keep their own language', () => {
    for (const language of LANGUAGES) {
      expect(SPEAKERS[language].locale).toBe(language)
    }
  })

  it('return the French sentence as it is', () => {
    expect(SPEAKERS.fr._(SITE_TITLE)).toBe(
      'Multifus, logiciel multicompte gratuit pour Dofus Retro'
    )
    expect(SPEAKERS.fr._(PAGE_NAMES.wheel)).toBe('Roue des personnages')
  })

  it.each(TRANSLATED)('does not let French go through in %s', (language) => {
    expect(SPEAKERS[language]._(PAGE_NAMES.wheel)).not.toBe(
      SPEAKERS.fr._(PAGE_NAMES.wheel)
    )
  })

  it('does not say the same thing in two languages', () => {
    const spoken = LANGUAGES.map((language) => {
      return SPEAKERS[language]._(PAGE_NAMES.wheel)
    })

    expect(new Set(spoken).size).toBe(LANGUAGES.length)
  })

  it('leaves no page without a name, in any language', () => {
    for (const language of LANGUAGES) {
      for (const name of Object.values(PAGE_NAMES)) {
        expect(SPEAKERS[language]._(name)).not.toBe('')
      }
    }
  })
})
