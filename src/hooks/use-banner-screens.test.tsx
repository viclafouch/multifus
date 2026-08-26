import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { BannerScreen } from '@/@types/walk'
import { bannerScreenOf } from '@/test-doubles'

const rust = vi.hoisted(() => {
  return {
    answer: null as ((screens: BannerScreen[]) => void) | null,
    refuse: null as ((reason: Error) => void) | null
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return {
    bannerScreens: () => {
      return new Promise<BannerScreen[]>((resolve, reject) => {
        rust.answer = resolve
        rust.refuse = reject
      })
    }
  }
})

const { useBannerScreens } = await import('@/hooks/use-banner-screens')

const LAPTOP = bannerScreenOf()

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

  it('n’a aucun écran à offrir avant la réponse du système', () => {
    const { result } = listen()

    expect(result.current).toStrictEqual([])
  })

  it('prend les écrans que le système lui donne', async () => {
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

  it('reste sans écran quand le système refuse de répondre', async () => {
    const { result } = listen()

    await waitFor(() => {
      expect(rust.refuse).not.toBeNull()
    })

    rust.refuse?.(new Error('aucun écran'))
    await settle()

    expect(result.current).toStrictEqual([])
  })

  it('ne demande les écrans qu’une fois', async () => {
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
