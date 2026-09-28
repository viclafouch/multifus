import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { TrailerPlate } from '@/components/trailer-plate'
import { TRAILER, TRAILER_TITLE } from '@/constants/trailer'
import { SPEAKERS } from '@/lib/i18n'
import { showAt } from '@/test-router'

const FILM = SPEAKERS.fr._(TRAILER_TITLE)

const show = (at = '/') => {
  return showAt({
    at,
    children: (
      <I18nProvider i18n={SPEAKERS.fr}>
        <TrailerPlate />
      </I18nProvider>
    )
  })
}

const filmShown = () => {
  return screen.getByTitle<HTMLIFrameElement>(FILM)
}

const finishLoading = () => {
  act(() => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete')
    window.dispatchEvent(new Event('load'))
  })
}

describe('the trailer plate', () => {
  beforeEach(() => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows the thumbnail alone while the page loads, without YouTube nor a play button of its own', () => {
    const { container } = show()

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      TRAILER.posters.fr.full.src
    )
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByTitle(FILM)).toBeNull()
  })

  it('shows the French thumbnail YouTube shows before play, whatever the language of the page', () => {
    const { container } = show('/en')

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      TRAILER.posters.fr.full.src
    )
  })

  it('brings the YouTube player in once the page has loaded, without starting it', () => {
    show()
    finishLoading()

    const address = new URL(filmShown().src)

    expect(address.pathname).toBe(`/embed/${TRAILER.id}`)
    expect(Object.fromEntries(address.searchParams)).toStrictEqual({
      playsinline: '1',
      rel: '0',
      color: 'white',
      hl: 'fr'
    })
  })

  it('speaks the language of the page in the player, subtitles turned on', () => {
    show('/es')
    finishLoading()

    const address = new URL(filmShown().src)

    expect(Object.fromEntries(address.searchParams)).toMatchObject({
      hl: 'es',
      cc_load_policy: '1',
      cc_lang_pref: 'es'
    })
  })

  it('leaves the subtitles off on a French page, where the words on screen are French already', () => {
    show()
    finishLoading()

    expect(new URL(filmShown().src).searchParams.has('cc_load_policy')).toBe(
      false
    )
  })

  it('fades the player in over the thumbnail once YouTube has drawn it', () => {
    show()
    finishLoading()

    expect(filmShown().hasAttribute('data-ready')).toBe(false)

    fireEvent.load(filmShown())

    expect(filmShown().hasAttribute('data-ready')).toBe(true)
  })
})
