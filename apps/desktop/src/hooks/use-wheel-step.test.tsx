import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { WheelStep } from '@/@types/wheel'
import { wheelSliceOf } from '@/test-doubles'

type HeardStep = ((step: WheelStep) => void) | null

type HeardAim = ((hovered: number | null) => void) | null

type HeardWipe = ((generation: number) => void) | null

const bridge = vi.hoisted(() => {
  return {
    heard: null as HeardStep,
    aimed: null as HeardAim,
    wiped: null as HeardWipe,
    first: null as HeardStep,
    unlisten: vi.fn(),
    unaim: vi.fn(),
    unwipe: vi.fn(),
    answered: vi.fn()
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
    onWheelWipe: (handle: (generation: number) => void) => {
      bridge.wiped = handle

      return Promise.resolve(bridge.unwipe)
    },
    wheelWiped: (generation: number) => {
      bridge.answered(generation)

      return Promise.resolve(null)
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
    bridge.wiped = null
    bridge.first = null
  })

  it('has nothing to draw before Rust opens the wheel', () => {
    const { result } = show()

    expect(result.current).toBeNull()
  })

  it('takes the wheel Rust gives it at the start', async () => {
    const { result } = show()

    await listening()
    await answered(stepOf(null))

    expect(result.current).toStrictEqual(stepOf(null))
  })

  it('lets the opened wheel go before the one of the start', async () => {
    const { result } = show()

    await listening()

    act(() => {
      bridge.heard?.(stepOf(1))
    })
    await answered(stepOf(null))

    expect(result.current?.hovered).toBe(1)
  })

  it('follows the aimed slice without asking for the whole wheel again', async () => {
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

  it('gives the center back to nobody when the mouse leaves the disc', async () => {
    const { result } = show()

    await listening()
    await answered(stepOf(1))

    act(() => {
      bridge.aimed?.(null)
    })

    expect(result.current?.hovered).toBeNull()
  })

  it('aims at nothing while Rust has not opened the wheel', async () => {
    const { result } = show()

    await waitFor(() => {
      expect(bridge.aimed).not.toBeNull()
    })

    act(() => {
      bridge.aimed?.(1)
    })

    expect(result.current).toBeNull()
  })

  it('clears the wheel as soon as Rust closes it, and tells it so', async () => {
    const { result } = show()

    await listening()
    await answered(stepOf(1))

    act(() => {
      bridge.wiped?.(7)
    })

    expect(result.current).toBeNull()

    await waitFor(() => {
      expect(bridge.answered).toHaveBeenCalledWith(7)
    })
  })

  it('says nothing to Rust while the wheel is on the screen', async () => {
    show()

    await listening()
    await answered(stepOf(null))

    expect(bridge.answered).not.toHaveBeenCalled()
  })

  it('leaves cleared the wheel Rust closed before its answer', async () => {
    const { result } = show()

    await listening()

    act(() => {
      bridge.wiped?.(7)
    })
    await answered(stepOf(null))

    expect(result.current).toBeNull()
  })

  it('stops listening to the three channels when the window leaves', async () => {
    const { unmount } = show()

    await listening()
    await answered(stepOf(null))

    unmount()

    expect(bridge.unlisten).toHaveBeenCalledWith()
    expect(bridge.unaim).toHaveBeenCalledWith()
    expect(bridge.unwipe).toHaveBeenCalledWith()
  })
})
