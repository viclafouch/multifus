import { describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { render, screen } from '@testing-library/react'
import { OutLink } from '@/components/out-link'
import { SOURCE_LANGUAGE } from '@/constants/languages'
import { MAIL_SCHEME } from '@/constants/site'
import { SPEAKERS } from '@/lib/i18n'

const SOMEWHERE = 'https://example.org'

const SOMEONE = `${MAIL_SCHEME}quelquun@example.org`

const showLink = (href: string, said: string) => {
  render(
    <I18nProvider i18n={SPEAKERS[SOURCE_LANGUAGE]}>
      <OutLink href={href}>{said}</OutLink>
    </I18nProvider>
  )

  return screen.getByRole('link', { name: new RegExp(said, 'u') })
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

describe('a link that writes a mail', () => {
  it('stays in the tab, because no page opens', () => {
    const link = showLink(SOMEONE, 'écrire à l’auteur')

    expect(link.getAttribute('target')).toBeNull()
    expect(link.getAttribute('rel')).toBeNull()
  })

  it('does not promise a tab it never opens', () => {
    expect(showLink(SOMEONE, 'l’adresse').textContent).not.toContain(
      'nouvel onglet'
    )
  })
})
