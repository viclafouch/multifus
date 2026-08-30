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

describe('le voile que Rust donne au tableau', () => {
  it('porte le tableau plein tant que Rust n’a rien dit', () => {
    const { result } = renderHook(() => {
      return useRuneTableLook()
    })

    expect(result.current).toBe(1)
  })

  it('prend la première valeur que la commande rend', async () => {
    const { result } = renderHook(() => {
      return useRuneTableLook()
    })

    await answer(0.4)

    expect(result.current).toBe(0.4)
  })

  it('suit la jauge à chaque cran', async () => {
    const { result } = renderHook(() => {
      return useRuneTableLook()
    })

    await tell(0.6)
    await tell(0.3)

    expect(result.current).toBe(0.3)
  })

  it('ne laisse pas la commande écraser un cran plus récent', async () => {
    const { result } = renderHook(() => {
      return useRuneTableLook()
    })

    await tell(0.3)
    await answer(1)

    expect(result.current).toBe(0.3)
  })

  it('lâche l’écoute en partant', async () => {
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
