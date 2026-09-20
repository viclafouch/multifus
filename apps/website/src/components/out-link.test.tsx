import { describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { render, screen } from '@testing-library/react'
import { OutLink } from '@/components/out-link'
import { SOURCE_LANGUAGE } from '@/constants/languages'
import { SPEAKERS } from '@/lib/i18n'

const SOMEWHERE = 'https://example.org'

const showLink = (href: string, said: string) => {
  render(
    <I18nProvider i18n={SPEAKERS[SOURCE_LANGUAGE]}>
      <OutLink href={href}>{said}</OutLink>
    </I18nProvider>
  )

  return screen.getByRole('link', {
    name: (found) => {
      return found.startsWith(said)
    }
  })
}

describe('a link that leaves the site', () => {
  it('opens the page in another tab, without handing it the window', () => {
    const link = showLink(SOMEWHERE, 'le dépôt')

    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener')
  })

  it('says out loud that another tab opens', () => {
    expect(showLink(SOMEWHERE, 'le forum').textContent).toContain(
      'nouvel onglet'
    )
  })
})
