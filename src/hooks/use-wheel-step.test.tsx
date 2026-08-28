import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { WheelStep } from '@/@types/wheel'
import { wheelSliceOf } from '@/test-doubles'

type HeardStep = ((step: WheelStep) => void) | null

type HeardAim = ((hovered: number | null) => void) | null

const bridge = vi.hoisted(() => {
  return {
    heard: null as HeardStep,
    aimed: null as HeardAim,
    first: null as HeardStep,
    unlisten: vi.fn(),
    unaim: vi.fn()
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return {
    onWheelStep: (handle: (step: WheelStep) => void) => {
      bridge.heard = handle

      return Promise.resolve(bridge.unlisten)
    },
    onWheelAim: (handle: (hovered: number | null) => void) => {
      bridge.aimed = handle

      return Promise.resolve(bridge.unaim)
    },
    wheelStep: () => {
      return new Promise<WheelStep>((resolve) => {
        bridge.first = resolve
      })
    }
  }
})

const { useWheelStep } = await import('@/hooks/use-wheel-step')

const TEAM = [
  wheelSliceOf({ nickname: 'Alpha' }),
  wheelSliceOf({ nickname: 'Bravo' })
]

const stepOf = (hovered: number | null): WheelStep => {
  return {
    diameter: 400,
    deadZone: 0.32,
    slices: TEAM,
    hovered,
    previewing: false
  }
}

const listening = async () => {
  await waitFor(() => {
    expect(bridge.first).not.toBeNull()
  })
}

const answered = async (step: WheelStep) => {
  await act(async () => {
    bridge.first?.(step)
    await Promise.resolve()
  })
}

const show = () => {
  return renderHook(() => {
    return useWheelStep()
  })
}

describe('useWheelStep', () => {
  beforeEach(() => {
    bridge.heard = null
    bridge.aimed = null
    bridge.first = null
    bridge.unlisten.mockClear()
    bridge.unaim.mockClear()
  })

  it('n’a rien à dessiner avant que Rust ouvre la roue', () => {
    const { result } = show()

    expect(result.current).toBeNull()
  })

  it('prend la roue que Rust lui donne au départ', async () => {
    const { result } = show()

    await listening()
    await answered(stepOf(null))

    expect(result.current).toStrictEqual(stepOf(null))
  })

  it('laisse la roue ouverte passer devant celle du départ', async () => {
    const { result } = show()

    await listening()

    act(() => {
      bridge.heard?.(stepOf(1))
    })
    await answered(stepOf(null))

    expect(result.current?.hovered).toBe(1)
  })

  it('suit la part visée sans redemander toute la roue', async () => {
    const { result } = show()

    await listening()
    await answered(stepOf(null))

    const opened = result.current

    act(() => {
      bridge.aimed?.(1)
    })

    expect(result.current?.hovered).toBe(1)
    expect(result.current?.slices).toBe(opened?.slices)
  })

  it('rend le centre à personne quand la souris quitte le disque', async () => {
    const { result } = show()

    await listening()
    await answered(stepOf(1))

    act(() => {
      bridge.aimed?.(null)
    })

    expect(result.current?.hovered).toBeNull()
  })

  it('ne vise rien tant que Rust n’a pas ouvert la roue', async () => {
    const { result } = show()

    await waitFor(() => {
      expect(bridge.aimed).not.toBeNull()
    })

    act(() => {
      bridge.aimed?.(1)
    })

    expect(result.current).toBeNull()
  })

  it('cesse d’écouter les deux canaux quand la fenêtre s’en va', async () => {
    const { unmount } = show()

    await listening()
    await answered(stepOf(null))

    unmount()

    expect(bridge.unlisten).toHaveBeenCalledWith()
    expect(bridge.unaim).toHaveBeenCalledWith()
  })
})
