import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const clipboard = vi.hoisted(() => {
  return { write: vi.fn<(text: string) => Promise<void>>() }
})

vi.mock(import('@tauri-apps/plugin-clipboard-manager'), () => {
  return { writeText: clipboard.write }
})

const { useCopy } = await import('@/hooks/use-copy')

const FEEDBACK_DURATION = 2000

describe('useCopy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clipboard.write.mockReset()
    clipboard.write.mockResolvedValue()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ne dit rien tant que rien n’a été copié', () => {
    const { result } = renderHook(() => {
      return useCopy()
    })

    expect(result.current.hasCopied).toBe(false)
  })

  it('pose le texte dans le presse-papiers et le dit', async () => {
    const { result } = renderHook(() => {
      return useCopy()
    })

    await act(async () => {
      result.current.copy('123456:jeton')
    })

    expect(clipboard.write).toHaveBeenCalledWith('123456:jeton')
    expect(result.current.hasCopied).toBe(true)
  })

  it('cesse de le dire au bout de deux secondes', async () => {
    const { result } = renderHook(() => {
      return useCopy()
    })

    await act(async () => {
      result.current.copy('123456:jeton')
    })
    act(() => {
      vi.advanceTimersByTime(FEEDBACK_DURATION)
    })

    expect(result.current.hasCopied).toBe(false)
  })

  it('repart pour deux secondes à chaque copie', async () => {
    const { result } = renderHook(() => {
      return useCopy()
    })

    await act(async () => {
      result.current.copy('123456:jeton')
    })
    act(() => {
      vi.advanceTimersByTime(FEEDBACK_DURATION - 100)
    })
    await act(async () => {
      result.current.copy('123456:jeton')
    })
    act(() => {
      vi.advanceTimersByTime(FEEDBACK_DURATION - 100)
    })

    expect(result.current.hasCopied).toBe(true)
  })

  it('ne dit rien quand le presse-papiers refuse', async () => {
    clipboard.write.mockRejectedValue(new Error('le presse-papiers a refusé'))

    const { result } = renderHook(() => {
      return useCopy()
    })

    await act(async () => {
      result.current.copy('123456:jeton')
    })

    expect(result.current.hasCopied).toBe(false)
  })
})
