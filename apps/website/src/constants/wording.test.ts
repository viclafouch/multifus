import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/constants/languages'
import { PAGE_IDS } from '@/constants/pages'
import { PAGE_DESCRIPTIONS, PAGE_TITLES } from '@/constants/wording'
import { titleOf } from '@/helpers/head'
import { SPEAKERS } from '@/lib/i18n'

const TITLE_LENGTH = 60

const DESCRIPTION_FLOOR = 110

const DESCRIPTION_CEILING = 160

describe('the words search engines read', () => {
  it.each(PAGE_IDS)('holds the title of %s on one line', (page) => {
    for (const language of LANGUAGES) {
      const title = titleOf(SPEAKERS[language]._(PAGE_TITLES[page]))

      expect(title.length).toBeLessThanOrEqual(TITLE_LENGTH)
    }
  })

  it.each(PAGE_IDS)('does not say Multifus twice on %s', (page) => {
    for (const language of LANGUAGES) {
      expect(SPEAKERS[language]._(PAGE_TITLES[page])).not.toContain('Multifus')
    }
  })

  it.each(PAGE_IDS)('describes %s without being cut off', (page) => {
    for (const language of LANGUAGES) {
      const description = SPEAKERS[language]._(PAGE_DESCRIPTIONS[page])

      expect(description.length).toBeGreaterThanOrEqual(DESCRIPTION_FLOOR)
      expect(description.length).toBeLessThanOrEqual(DESCRIPTION_CEILING)
    }
  })

  it.each(LANGUAGES)(
    'gives no page the title of another, in %s',
    (language) => {
      const written = PAGE_IDS.map((page) => {
        return SPEAKERS[language]._(PAGE_TITLES[page])
      })

      expect(new Set(written).size).toBe(PAGE_IDS.length)
    }
  )

  it.each(LANGUAGES)(
    'gives no page the description of another, in %s',
    (language) => {
      const written = PAGE_IDS.map((page) => {
        return SPEAKERS[language]._(PAGE_DESCRIPTIONS[page])
      })

      expect(new Set(written).size).toBe(PAGE_IDS.length)
    }
  )
})
