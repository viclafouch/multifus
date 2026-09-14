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

  it('says nothing while nothing has been copied', () => {
    const { result } = renderHook(() => {
      return useCopy()
    })

    expect(result.current.hasCopied).toBe(false)
  })

  it('puts the text in the clipboard and says so', async () => {
    const { result } = renderHook(() => {
      return useCopy()
    })

    await act(async () => {
      result.current.copy('123456:jeton')
    })

    expect(clipboard.write).toHaveBeenCalledWith('123456:jeton')
    expect(result.current.hasCopied).toBe(true)
  })

  it('stops saying it after two seconds', async () => {
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

  it('starts again for two seconds on every copy', async () => {
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

  it('says nothing when the clipboard refuses', async () => {
    clipboard.write.mockRejectedValue(new Error('the clipboard refused'))

    const { result } = renderHook(() => {
      return useCopy()
    })

    await act(async () => {
      result.current.copy('123456:jeton')
    })

    expect(result.current.hasCopied).toBe(false)
  })
})
