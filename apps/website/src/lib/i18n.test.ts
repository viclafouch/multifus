import { describe, expect, it } from 'vitest'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'
import { PAGE_NAMES, SITE_TITLE } from '@/constants/wording'
import { SPEAKERS } from '@/lib/i18n'

const TRANSLATED = LANGUAGES.filter((language) => {
  return language !== SOURCE_LANGUAGE
})

describe('les trois voix', () => {
  it('gardent chacune sa langue', () => {
    for (const language of LANGUAGES) {
      expect(SPEAKERS[language].locale).toBe(language)
    }
  })

  it('rendent la phrase française telle quelle', () => {
    expect(SPEAKERS.fr._(SITE_TITLE)).toBe(
      'Multifus, logiciel multicompte gratuit pour Dofus Retro'
    )
    expect(SPEAKERS.fr._(PAGE_NAMES.wheel)).toBe('Roue des personnages')
  })

  it.each(TRANSLATED)('ne laisse pas le français passer en %s', (language) => {
    expect(SPEAKERS[language]._(PAGE_NAMES.wheel)).not.toBe(
      SPEAKERS.fr._(PAGE_NAMES.wheel)
    )
  })

  it('ne dit pas la même chose dans deux langues', () => {
    const spoken = LANGUAGES.map((language) => {
      return SPEAKERS[language]._(PAGE_NAMES.wheel)
    })

    expect(new Set(spoken).size).toBe(LANGUAGES.length)
  })

  it('ne laisse aucune page sans nom, dans aucune langue', () => {
    for (const language of LANGUAGES) {
      for (const name of Object.values(PAGE_NAMES)) {
        expect(SPEAKERS[language]._(name)).not.toBe('')
      }
    }
  })
})
