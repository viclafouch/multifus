import { describe, expect, it, vi } from 'vitest'
import { fireEvent, renderHook } from '@testing-library/react'
import { useEscape } from '@/hooks/use-escape'

const strike = (key: string) => {
  fireEvent.keyDown(window, { key })
}

describe('la touche Échap', () => {
  it('répond tant qu’on l’écoute', () => {
    const close = vi.fn()

    renderHook(() => {
      useEscape(true, close)
    })

    strike('Escape')

    expect(close).toHaveBeenCalledExactlyOnceWith()
  })

  it('ne répond pas aux autres touches', () => {
    const close = vi.fn()

    renderHook(() => {
      useEscape(true, close)
    })

    strike('Enter')
    strike('a')

    expect(close).not.toHaveBeenCalled()
  })

  it('se tait quand personne n’écoute', () => {
    const close = vi.fn()

    renderHook(() => {
      useEscape(false, close)
    })

    strike('Escape')

    expect(close).not.toHaveBeenCalled()
  })

  it('appelle la dernière fonction reçue, sans se rebrancher', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(
      ({ close }: { close: () => void }) => {
        useEscape(true, close)
      },
      { initialProps: { close: first } }
    )

    rerender({ close: second })
    strike('Escape')

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledExactlyOnceWith()
  })

  it('lâche la touche en partant', () => {
    const close = vi.fn()
    const { unmount } = renderHook(() => {
      useEscape(true, close)
    })

    unmount()
    strike('Escape')

    expect(close).not.toHaveBeenCalled()
  })
})
