import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { OFFER_MADE, useOffer } from '@/hooks/use-offer'

const speaks = (spoken: readonly string[]) => {
  vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue([...spoken])
}

describe('the offer made once', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('offers the language of the browser and keeps the memory', () => {
    speaks(['es-MX', 'es'])

    const { result } = renderHook(() => {
      return useOffer('fr')
    })

    expect(result.current.offered).toBe('es')
    expect(window.localStorage.getItem(OFFER_MADE)).toBe('es')
  })

  it('offers nothing more once the memory is set', () => {
    speaks(['es'])
    window.localStorage.setItem(OFFER_MADE, 'es')

    const { result } = renderHook(() => {
      return useOffer('fr')
    })

    expect(result.current.offered).toBeNull()
  })

  it('keeps quiet in front of a browser that speaks the language of the page', () => {
    speaks(['fr-FR'])

    const { result } = renderHook(() => {
      return useOffer('fr')
    })

    expect(result.current.offered).toBeNull()
    expect(window.localStorage.getItem(OFFER_MADE)).toBeNull()
  })

  it('keeps quiet in front of a language the site does not speak', () => {
    speaks(['de-DE'])

    const { result } = renderHook(() => {
      return useOffer('fr')
    })

    expect(result.current.offered).toBeNull()
  })

  it('withdraws when it is hidden', () => {
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
