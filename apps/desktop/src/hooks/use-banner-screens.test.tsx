import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { Display } from '@/@types/display'
import { displayOf } from '@/test-doubles'

const rust = vi.hoisted(() => {
  return {
    answer: null as ((screens: Display[]) => void) | null,
    refuse: null as ((reason: Error) => void) | null
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return {
    bannerScreens: () => {
      return new Promise<Display[]>((resolve, reject) => {
        rust.answer = resolve
        rust.refuse = reject
      })
    }
  }
})

const { useBannerScreens } = await import('@/hooks/use-banner-screens')

const LAPTOP = displayOf()

const listen = () => {
  return renderHook(() => {
    return useBannerScreens()
  })
}

const settle = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('useBannerScreens', () => {
  beforeEach(() => {
    rust.answer = null
    rust.refuse = null
  })

  it('has no screen to offer before the answer of the system', () => {
    const { result } = listen()

    expect(result.current).toStrictEqual([])
  })

  it('takes the screens the system gives it', async () => {
    const { result } = listen()

    await waitFor(() => {
      expect(rust.answer).not.toBeNull()
    })

    act(() => {
      rust.answer?.([LAPTOP])
    })

    await waitFor(() => {
      expect(result.current).toStrictEqual([LAPTOP])
    })
  })

  it('stays without a screen when the system refuses to answer', async () => {
    const { result } = listen()

    await waitFor(() => {
      expect(rust.refuse).not.toBeNull()
    })

    rust.refuse?.(new Error('no screen'))
    await settle()

    expect(result.current).toStrictEqual([])
  })

  it('asks for the screens only once', async () => {
    const { rerender } = listen()

    await waitFor(() => {
      expect(rust.answer).not.toBeNull()
    })

    act(() => {
      rust.answer?.([LAPTOP])
    })
    rust.answer = null
    rerender()
    await settle()

    expect(rust.answer).toBeNull()
  })
})
