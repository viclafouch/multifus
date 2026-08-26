import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { Snapshot } from '@/@types/snapshot'
import { snapshotOf } from '@/test-snapshot'

type Heard = ((snapshot: Snapshot) => void) | null

const bridge = vi.hoisted(() => {
  return {
    heard: null as Heard,
    unlisten: vi.fn(),
    open: null as (() => void) | null,
    first: null as Heard
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return {
    onSnapshot: (handle: (snapshot: Snapshot) => void) => {
      bridge.heard = handle

      return new Promise<() => void>((resolve) => {
        bridge.open = () => {
          resolve(bridge.unlisten)
        }
      })
    },
    snapshot: () => {
      return new Promise<Snapshot>((resolve) => {
        bridge.first = resolve
      })
    }
  }
})

const { useMultifus } = await import('@/hooks/use-multifus')

const listening = async () => {
  await waitFor(() => {
    expect(bridge.open).not.toBeNull()
  })

  await act(async () => {
    bridge.open?.()
    await Promise.resolve()
  })
}

const answered = async (version: string) => {
  await act(async () => {
    bridge.first?.(snapshotOf({ version }))
    await Promise.resolve()
  })
}

describe('useMultifus', () => {
  beforeEach(() => {
    bridge.heard = null
    bridge.open = null
    bridge.first = null
  })

  it('n’a rien à montrer avant le premier instantané', () => {
    const { result } = renderHook(() => {
      return useMultifus()
    })

    expect(result.current.snapshot).toBeNull()
  })

  it('prend le premier instantané que Rust lui donne', async () => {
    const { result } = renderHook(() => {
      return useMultifus()
    })

    await listening()
    await answered('0.1.0')

    expect(result.current.snapshot).toStrictEqual(
      snapshotOf({ version: '0.1.0' })
    )
  })

  it('écoute avant de demander, pour ne rien perdre', async () => {
    const { result } = renderHook(() => {
      return useMultifus()
    })

    await listening()

    act(() => {
      bridge.heard?.(snapshotOf({ version: '0.2.0' }))
    })

    expect(result.current.snapshot).toStrictEqual(
      snapshotOf({ version: '0.2.0' })
    )
  })

  it('laisse le canal parler plus fort que la demande de départ', async () => {
    const { result } = renderHook(() => {
      return useMultifus()
    })

    await listening()

    act(() => {
      bridge.heard?.(snapshotOf({ version: '0.2.0' }))
    })
    await answered('0.1.0')

    expect(result.current.snapshot).toStrictEqual(
      snapshotOf({ version: '0.2.0' })
    )
  })

  it('remplace l’instantané par ce qu’une commande rend', async () => {
    const { result } = renderHook(() => {
      return useMultifus()
    })

    await listening()
    await answered('0.1.0')

    await act(async () => {
      result.current.run(Promise.resolve(snapshotOf({ version: '0.3.0' })))
      await Promise.resolve()
    })

    expect(result.current.snapshot).toStrictEqual(
      snapshotOf({ version: '0.3.0' })
    )
  })

  it('garde l’instantané quand une commande échoue', async () => {
    const { result } = renderHook(() => {
      return useMultifus()
    })

    await listening()
    await answered('0.1.0')

    await act(async () => {
      result.current.run(Promise.reject(new Error('la commande a refusé')))
      await Promise.resolve()
    })

    expect(result.current.snapshot).toStrictEqual(
      snapshotOf({ version: '0.1.0' })
    )
  })

  it('cesse d’écouter quand la fenêtre s’en va', async () => {
    const { unmount } = renderHook(() => {
      return useMultifus()
    })

    await listening()
    await answered('0.1.0')

    unmount()

    expect(bridge.unlisten).toHaveBeenCalledWith()
  })

  it('cesse d’écouter même quand la fenêtre part avant la réponse', async () => {
    const { unmount } = renderHook(() => {
      return useMultifus()
    })

    await waitFor(() => {
      expect(bridge.open).not.toBeNull()
    })

    unmount()

    await act(async () => {
      bridge.open?.()
      await Promise.resolve()
    })

    expect(bridge.unlisten).toHaveBeenCalledWith()
  })
})
