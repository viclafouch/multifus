import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import { LanguageOffer } from '@/components/language-offer'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'
import { pathOf } from '@/helpers/page'
import { showAt } from '@/test-router'

const OFFER_IN_FRENCH = 'Lire cette page en français'

const CLOSE_IN_FRENCH = 'Masquer cette proposition'

const OTHERS = LANGUAGES.filter((language) => {
  return language !== SOURCE_LANGUAGE
})

const show = (offered: Language, onHide = () => {}) => {
  return showAt({
    at: pathOf({ page: 'wheel', language: SOURCE_LANGUAGE }),
    children: <LanguageOffer page="wheel" offered={offered} onHide={onHide} />
  })
}

describe('la proposition de langue', () => {
  afterEach(() => {
    cleanup()
  })

  it('écrit en français quand c’est le français qu’elle propose', () => {
    show('fr')

    const offer = screen.getByRole('link', { name: OFFER_IN_FRENCH })

    expect(offer.getAttribute('hreflang')).toBe('fr')
    expect(screen.getByRole('button', { name: CLOSE_IN_FRENCH })).toBeDefined()
  })

  it.each(OTHERS)('n’écrit pas le français à qui parle %s', (offered) => {
    show(offered)

    expect(screen.queryByText(OFFER_IN_FRENCH)).toBeNull()
    expect(screen.queryByLabelText(CLOSE_IN_FRENCH)).toBeNull()
    expect(screen.getByRole('link').getAttribute('hreflang')).toBe(offered)
  })

  it.each(LANGUAGES)('mène à la même page, en %s', (offered) => {
    show(offered)

    expect(screen.getByRole('link').getAttribute('href')).toBe(
      pathOf({ page: 'wheel', language: offered })
    )
  })

  it.each(LANGUAGES)('donne le %s au lecteur d’écran', (offered) => {
    const { container } = show(offered)

    expect(container.querySelector('aside')?.getAttribute('lang')).toBe(offered)
  })

  it('se laisse retrouver dans le HTML livré', () => {
    const { container } = show('en')

    expect(container.querySelector('[data-offer]')).not.toBeNull()
  })

  it('se masque à la demande', () => {
    const onHide = vi.fn()

    show('fr', onHide)

    fireEvent.click(screen.getByRole('button', { name: CLOSE_IN_FRENCH }))

    expect(onHide).toHaveBeenCalledTimes(1)
  })
})
