import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

type HeardLook = ((look: number) => void) | null

const bridge = vi.hoisted(() => {
  return {
    heard: null as HeardLook,
    first: null as ((look: number) => void) | null,
    unlisten: vi.fn()
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return {
    onRuneTableLook: (handle: (look: number) => void) => {
      bridge.heard = handle

      return Promise.resolve(bridge.unlisten)
    },
    runeTableLook: () => {
      return new Promise<number>((resolve) => {
        bridge.first = resolve
      })
    }
  }
})

const { useRuneTableLook } = await import('@/hooks/use-rune-table-look')

const answer = async (look: number) => {
  await waitFor(() => {
    expect(bridge.first).not.toBeNull()
  })

  await act(async () => {
    bridge.first?.(look)
  })
}

const tell = async (look: number) => {
  await waitFor(() => {
    expect(bridge.heard).not.toBeNull()
  })

  await act(async () => {
    bridge.heard?.(look)
  })
}

describe('the veil Rust gives to the table', () => {
  it('carries the full table while Rust has said nothing', () => {
    const { result } = renderHook(() => {
      return useRuneTableLook()
    })

    expect(result.current).toBe(1)
  })

  it('takes the first value the command returns', async () => {
    const { result } = renderHook(() => {
      return useRuneTableLook()
    })

    await answer(0.4)

    expect(result.current).toBe(0.4)
  })

  it('follows the gauge at every notch', async () => {
    const { result } = renderHook(() => {
      return useRuneTableLook()
    })

    await tell(0.6)
    await tell(0.3)

    expect(result.current).toBe(0.3)
  })

  it('does not let the command crush a more recent notch', async () => {
    const { result } = renderHook(() => {
      return useRuneTableLook()
    })

    await tell(0.3)
    await answer(1)

    expect(result.current).toBe(0.3)
  })

  it('lets go of the listening on leaving', async () => {
    const { unmount } = renderHook(() => {
      return useRuneTableLook()
    })

    await waitFor(() => {
      expect(bridge.heard).not.toBeNull()
    })

    unmount()

    await waitFor(() => {
      expect(bridge.unlisten).toHaveBeenCalledWith()
    })
  })
})
