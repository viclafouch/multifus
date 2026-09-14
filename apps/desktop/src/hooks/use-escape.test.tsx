import { describe, expect, it, vi } from 'vitest'
import { fireEvent, renderHook } from '@testing-library/react'
import { useEscape } from '@/hooks/use-escape'

const strike = (key: string) => {
  fireEvent.keyDown(window, { key })
}

describe('the Escape key', () => {
  it('answers while it is listened to', () => {
    const close = vi.fn()

    renderHook(() => {
      useEscape(true, close)
    })

    strike('Escape')

    expect(close).toHaveBeenCalledExactlyOnceWith()
  })

  it('does not answer to the other keys', () => {
    const close = vi.fn()

    renderHook(() => {
      useEscape(true, close)
    })

    strike('Enter')
    strike('a')

    expect(close).not.toHaveBeenCalled()
  })

  it('keeps quiet when nobody listens', () => {
    const close = vi.fn()

    renderHook(() => {
      useEscape(false, close)
    })

    strike('Escape')

    expect(close).not.toHaveBeenCalled()
  })

  it('calls the last function it got, without wiring itself again', () => {
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

  it('lets go of the key on leaving', () => {
    const close = vi.fn()
    const { unmount } = renderHook(() => {
      useEscape(true, close)
    })

    unmount()
    strike('Escape')

    expect(close).not.toHaveBeenCalled()
  })
})
