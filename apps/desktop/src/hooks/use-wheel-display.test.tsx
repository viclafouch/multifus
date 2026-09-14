import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { Display } from '@/@types/display'
import { displayOf } from '@/test-doubles'

const rust = vi.hoisted(() => {
  return {
    answer: null as ((screen: Display | null) => void) | null,
    refuse: null as ((reason: Error) => void) | null
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return {
    wheelDisplay: () => {
      return new Promise<Display | null>((resolve, reject) => {
        rust.answer = resolve
        rust.refuse = reject
      })
    }
  }
})

const { useWheelDisplay } = await import('@/hooks/use-wheel-display')

const LAPTOP = displayOf()

const listen = () => {
  return renderHook(() => {
    return useWheelDisplay()
  })
}

const settle = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('useWheelDisplay', () => {
  beforeEach(() => {
    rust.answer = null
    rust.refuse = null
  })

  it('has no screen to scale before the answer of the system', () => {
    const { result } = listen()

    expect(result.current).toBeNull()
  })

  it('takes the screen that carries the Multifus window', async () => {
    const { result } = listen()

    await waitFor(() => {
      expect(rust.answer).not.toBeNull()
    })

    act(() => {
      rust.answer?.(LAPTOP)
    })

    await waitFor(() => {
      expect(result.current).toStrictEqual(LAPTOP)
    })
  })

  it('stays without a screen when the system refuses to answer', async () => {
    const { result } = listen()

    await waitFor(() => {
      expect(rust.refuse).not.toBeNull()
    })

    rust.refuse?.(new Error('no screen'))
    await settle()

    expect(result.current).toBeNull()
  })
})
