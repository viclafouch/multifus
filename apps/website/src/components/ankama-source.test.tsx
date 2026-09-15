import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup, render, screen } from '@testing-library/react'
import { AnkamaSource } from '@/components/ankama-source'
import { ANKAMA_SOURCE_IDS, ANKAMA_SOURCES } from '@/constants/ankama'
import { SPEAKERS } from '@/lib/i18n'

const showEvery = () => {
  return render(
    <I18nProvider i18n={SPEAKERS.fr}>
      <ul>
        {ANKAMA_SOURCE_IDS.map((source) => {
          return <AnkamaSource key={source} source={source} />
        })}
      </ul>
    </I18nProvider>
  )
}

describe('the two sources side by side', () => {
  afterEach(() => {
    cleanup()
  })

  it('never names two links the same, though both say to open a source', () => {
    showEvery()

    const named = ANKAMA_SOURCE_IDS.map((source) => {
      const { alt } = ANKAMA_SOURCES[source]

      return screen.getByRole('link', {
        name: new RegExp(SPEAKERS.fr._(alt), 'u')
      })
    })

    expect(named).toHaveLength(ANKAMA_SOURCE_IDS.length)
    expect(new Set(named).size).toBe(named.length)
  })

  it.each(ANKAMA_SOURCE_IDS)('leads %s to Ankama, in another tab', (source) => {
    showEvery()

    const { href, alt } = ANKAMA_SOURCES[source]
    const shot = screen.getByAltText(new RegExp(SPEAKERS.fr._(alt), 'u'))
    const link = shot.closest('a')

    expect(link?.getAttribute('href')).toBe(href)
    expect(link?.getAttribute('target')).toBe('_blank')
  })

  it.each(ANKAMA_SOURCE_IDS)('puts the words of %s in the alt', (source) => {
    showEvery()

    const { quote, alt } = ANKAMA_SOURCES[source]
    const shot = screen.getByAltText(new RegExp(SPEAKERS.fr._(alt), 'u'))

    expect(shot.getAttribute('alt')).toContain(quote)
  })
})
