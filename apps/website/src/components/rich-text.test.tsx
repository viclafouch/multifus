import { describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { render, screen } from '@testing-library/react'
import { OutLink } from '@/components/out-link'
import { SOURCE_LANGUAGE } from '@/constants/languages'
import { SPEAKERS } from '@/lib/i18n'

const SOMEWHERE = 'https://example.org'

const Sentence = () => {
  return (
    <Trans>
      Une phrase avec <OutLink href={SOMEWHERE}>un lien dedans</OutLink>.
    </Trans>
  )
}

describe('le texte à liens', () => {
  it('laisse la macro Trans poser le lien au milieu de la phrase', () => {
    render(
      <I18nProvider i18n={SPEAKERS[SOURCE_LANGUAGE]}>
        <Sentence />
      </I18nProvider>
    )

    const link = screen.getByRole('link', { name: /un lien dedans/u })

    expect(link.getAttribute('href')).toBe(SOMEWHERE)
    expect(screen.getByText(/Une phrase avec/u)).toBeDefined()
  })
})
