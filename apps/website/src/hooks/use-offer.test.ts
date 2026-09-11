import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { OFFER_MADE, useOffer } from '@/hooks/use-offer'

const speaks = (spoken: readonly string[]) => {
  vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue([...spoken])
}

describe('la proposition faite une fois', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('propose la langue du navigateur et garde le souvenir', () => {
    speaks(['es-MX', 'es'])

    const { result } = renderHook(() => {
      return useOffer('fr')
    })

    expect(result.current.offered).toBe('es')
    expect(window.localStorage.getItem(OFFER_MADE)).toBe('es')
  })

  it('ne propose plus rien une fois le souvenir posé', () => {
    speaks(['es'])
    window.localStorage.setItem(OFFER_MADE, 'es')

    const { result } = renderHook(() => {
      return useOffer('fr')
    })

    expect(result.current.offered).toBeNull()
  })

  it('se tait devant un navigateur qui parle la langue de la page', () => {
    speaks(['fr-FR'])

    const { result } = renderHook(() => {
      return useOffer('fr')
    })

    expect(result.current.offered).toBeNull()
    expect(window.localStorage.getItem(OFFER_MADE)).toBeNull()
  })

  it('se tait devant une langue que le site ne parle pas', () => {
    speaks(['de-DE'])

    const { result } = renderHook(() => {
      return useOffer('fr')
    })

    expect(result.current.offered).toBeNull()
  })

  it('se retire quand on la masque', () => {
    speaks(['en'])

    const { result } = renderHook(() => {
      return useOffer('fr')
    })

    expect(result.current.offered).toBe('en')

    act(() => {
      result.current.hide()
    })

    expect(result.current.offered).toBeNull()
  })
})
