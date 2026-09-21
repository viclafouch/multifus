import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import type { PageId } from '@/@types/page'
import { PageHead } from '@/components/page-head'
import { LANGUAGES } from '@/constants/languages'
import { SYSTEM_IDS } from '@/constants/systems'
import { PAGE_NAMES } from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { showAt } from '@/test-router'

const SYSTEM_PAGES = {
  macos: 'mac',
  windows: 'windows'
} as const satisfies Record<(typeof SYSTEM_IDS)[number], PageId>

type ShowParams = Readonly<{
  page: PageId
  language: Language
  hasTwoLineTitle?: boolean
}>

const show = ({ page, language, hasTwoLineTitle = false }: ShowParams) => {
  showAt({
    at: pathOf({ page, language }),
    children: (
      <I18nProvider i18n={SPEAKERS[language]}>
        <PageHead page={page} hasTwoLineTitle={hasTwoLineTitle} />
      </I18nProvider>
    )
  })

  return screen.getByRole('heading', { level: 1 })
}

describe('the head of a page', () => {
  afterEach(() => {
    cleanup()
  })

  it.each(LANGUAGES)('names the page it heads in %s', (language) => {
    const title = show({ page: 'mac', language })

    expect(title.textContent).toBe(SPEAKERS[language]._(PAGE_NAMES.mac))
  })

  it('leaves the title whole where nothing asks for two lines', () => {
    const title = show({ page: 'mac', language: 'fr' })

    expect(title.querySelector('br')).toBeNull()
  })

  it.each(LANGUAGES)('sets the two system pages alike in %s', (language) => {
    for (const system of SYSTEM_IDS) {
      const page = SYSTEM_PAGES[system]
      const title = show({ page, language, hasTwoLineTitle: true })

      expect(title.querySelectorAll('br')).toHaveLength(1)
      expect(title.textContent).toBe(SPEAKERS[language]._(PAGE_NAMES[page]))

      cleanup()
    }
  })

  it.each(LANGUAGES)(
    'breaks after the name of the software in %s',
    (language) => {
      const title = show({ page: 'windows', language, hasTwoLineTitle: true })
      const [firstLine] = title.innerHTML.split('<br>')

      expect(firstLine.trim()).toBe('Multifus')
    }
  )

  it('never breaks a title that holds a single word', () => {
    const title = show({
      page: 'comparison',
      language: 'fr',
      hasTwoLineTitle: true
    })

    expect(title.textContent).toBe(SPEAKERS.fr._(PAGE_NAMES.comparison))
    expect(title.querySelector('br')).toBeNull()
  })
})
