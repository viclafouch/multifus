import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { BannerStep } from '@/@types/walk'

type Heard = ((step: BannerStep) => void) | null

const bridge = vi.hoisted(() => {
  return {
    heard: null as Heard,
    unlisten: vi.fn(),
    first: null as Heard
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return {
    onBannerStep: (handle: (step: BannerStep) => void) => {
      bridge.heard = handle

      return Promise.resolve(bridge.unlisten)
    },
    bannerStep: () => {
      return new Promise<BannerStep>((resolve) => {
        bridge.first = resolve
      })
    }
  }
})

const { useBannerStep } = await import('@/hooks/use-banner-step')

const stepOf = (nickname: string | null): BannerStep => {
  return {
    corner: 'bottomRight',
    character:
      nickname === null ? null : { nickname, class: 'iop', gender: 'male' },
    previewing: false
  }
}

const listening = async () => {
  await waitFor(() => {
    expect(bridge.first).not.toBeNull()
  })
}

const answered = async (nickname: string | null) => {
  await act(async () => {
    bridge.first?.(stepOf(nickname))
    await Promise.resolve()
  })
}

describe('useBannerStep', () => {
  beforeEach(() => {
    bridge.heard = null
    bridge.first = null
    bridge.unlisten.mockClear()
  })

  it('n’a rien à dessiner avant le premier pas', () => {
    const { result } = renderHook(() => {
      return useBannerStep()
    })

    expect(result.current).toBeNull()
  })

  it('prend le pas que Rust lui donne au départ', async () => {
    const { result } = renderHook(() => {
      return useBannerStep()
    })

    await listening()
    await answered(null)

    expect(result.current).toStrictEqual(stepOf(null))
  })

  it('suit le personnage sur lequel le Déplacement rapide arrive', async () => {
    const { result } = renderHook(() => {
      return useBannerStep()
    })

    await listening()

    act(() => {
      bridge.heard?.(stepOf('Alpha'))
    })

    expect(result.current).toStrictEqual(stepOf('Alpha'))
  })

  it('laisse le pas arrivé passer devant celui du départ', async () => {
    const { result } = renderHook(() => {
      return useBannerStep()
    })

    await listening()

    act(() => {
      bridge.heard?.(stepOf('Alpha'))
    })
    await answered(null)

    expect(result.current).toStrictEqual(stepOf('Alpha'))
  })

  it('cesse d’écouter quand la bannière se ferme', async () => {
    const { unmount } = renderHook(() => {
      return useBannerStep()
    })

    await listening()
    await answered(null)

    unmount()

    expect(bridge.unlisten).toHaveBeenCalledWith()
  })
})
