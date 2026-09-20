import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import { SupportMenu } from '@/components/support-menu'
import { LANGUAGES } from '@/constants/languages'
import { AUTHOR } from '@/constants/site'
import { CONTACT_AUTHOR, PAGE_NAMES, SUPPORT_TAB } from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { showAt } from '@/test-router'

const show = (language: Language, page: 'home' | 'mac' = 'home') => {
  return showAt({
    at: pathOf({ page, language }),
    children: (
      <I18nProvider i18n={SPEAKERS[language]}>
        <SupportMenu page={page} />
      </I18nProvider>
    )
  })
}

const hingeOf = () => {
  const found = document.querySelector('details')

  if (found === null) {
    throw new Error('the support menu is not in the document')
  }

  return found
}

const linkNamed = (said: string) => {
  return screen.getByRole('link', {
    name: (found) => {
      return found.startsWith(said)
    }
  })
}

const tabOf = (language: Language) => {
  return screen.getByText(SPEAKERS[language]._(SUPPORT_TAB)).closest('summary')
}

describe('the support menu of the mast', () => {
  afterEach(() => {
    cleanup()
  })

  it.each(LANGUAGES)(
    'leads to the author and to both systems in %s',
    (language) => {
      const speaker = SPEAKERS[language]

      show(language)

      expect(linkNamed(speaker._(CONTACT_AUTHOR)).getAttribute('href')).toBe(
        AUTHOR
      )
      expect(
        linkNamed(speaker._(PAGE_NAMES.windows)).getAttribute('href')
      ).toBe(pathOf({ page: 'windows', language }))
      expect(linkNamed(speaker._(PAGE_NAMES.mac)).getAttribute('href')).toBe(
        pathOf({ page: 'mac', language })
      )
    }
  )

  it('opens the author account in another tab, without handing it the window', () => {
    show('fr')

    const link = linkNamed(SPEAKERS.fr._(CONTACT_AUTHOR))

    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener')
  })

  it('marks the tab when the page being read is one of its own', () => {
    show('fr', 'mac')

    expect(tabOf('fr')?.getAttribute('aria-current')).toBe('location')
  })

  it('leaves the tab unmarked on a page it does not hold', () => {
    show('fr')

    expect(tabOf('fr')?.getAttribute('aria-current')).toBeNull()
  })

  it('shuts itself when one of its links is taken', () => {
    show('fr')

    const hinge = hingeOf()

    hinge.open = true
    fireEvent.click(linkNamed(SPEAKERS.fr._(PAGE_NAMES.mac)))

    expect(hinge.open).toBe(false)
  })

  it('shuts itself on a press outside', () => {
    show('fr')

    const hinge = hingeOf()

    hinge.open = true
    fireEvent.pointerDown(document.body)

    expect(hinge.open).toBe(false)
  })
})
