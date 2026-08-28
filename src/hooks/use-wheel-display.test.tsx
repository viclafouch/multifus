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

  it('n’a aucun écran à mettre à l’échelle avant la réponse du système', () => {
    const { result } = listen()

    expect(result.current).toBeNull()
  })

  it('prend l’écran qui porte la fenêtre de Multifus', async () => {
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

  it('reste sans écran quand le système refuse de répondre', async () => {
    const { result } = listen()

    await waitFor(() => {
      expect(rust.refuse).not.toBeNull()
    })

    rust.refuse?.(new Error('aucun écran'))
    await settle()

    expect(result.current).toBeNull()
  })
})
