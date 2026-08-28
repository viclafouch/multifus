import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { Clients } from '@/@types/snapshot'
import { ignore } from '@/lib/utils'

const bridge = {
  clients: vi.fn(),
  watchClients: vi.fn(),
  onClients: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { useClients } = await import('@/hooks/use-clients')

const counter = { told: null as ((counted: Clients) => void) | null }

const OPEN = { open: 3, small: 2, readable: true } as const satisfies Clients

const stop = vi.fn()

const watching = (counted: Clients = OPEN) => {
  bridge.clients.mockResolvedValue(counted)
  bridge.watchClients.mockResolvedValue(null)
  bridge.onClients.mockImplementation(async (handle: (of: Clients) => void) => {
    counter.told = handle

    return stop
  })

  return renderHook(() => {
    return useClients()
  })
}

const stillWatching = () => {
  return bridge.watchClients.mock.calls.reduce((watchers, [asked]) => {
    return asked === true ? watchers + 1 : watchers - 1
  }, 0)
}

describe('le compte des clients', () => {
  beforeEach(() => {
    counter.told = null
  })

  it('ne compte rien avant que Rust ait répondu', () => {
    bridge.clients.mockReturnValue(new Promise(ignore))
    bridge.watchClients.mockResolvedValue(null)
    bridge.onClients.mockReturnValue(new Promise(ignore))

    const { result } = renderHook(() => {
      return useClients()
    })

    expect(result.current).toBeNull()
  })

  it('s’abonne, puis lit le compte une première fois', async () => {
    const { result } = watching()

    await waitFor(() => {
      expect(result.current).toStrictEqual(OPEN)
    })

    expect(bridge.watchClients).toHaveBeenCalledWith(true)
  })

  it('suit ce que le tour lui dit ensuite', async () => {
    const { result } = watching()

    await waitFor(() => {
      expect(result.current).toStrictEqual(OPEN)
    })

    const filled = { open: 3, small: 0, readable: true }

    act(() => {
      counter.told?.(filled)
    })

    expect(result.current).toStrictEqual(filled)
  })

  it('se désabonne en partant, et cesse de faire lire Rust', async () => {
    const { result, unmount } = watching()

    await waitFor(() => {
      expect(result.current).toStrictEqual(OPEN)
    })

    unmount()

    await waitFor(() => {
      expect(bridge.watchClients).toHaveBeenCalledWith(false)
    })

    expect(stop).toHaveBeenCalledWith()
  })

  it('ouvre une fois par écran, et ferme une fois par départ', async () => {
    const first = watching()

    await waitFor(() => {
      expect(bridge.watchClients).toHaveBeenCalledWith(true)
    })

    first.unmount()

    await waitFor(() => {
      expect(bridge.watchClients).toHaveBeenCalledWith(false)
    })

    expect(stillWatching()).toBe(0)

    const second = watching()

    await waitFor(() => {
      expect(stillWatching()).toBe(1)
    })

    second.unmount()
  })

  it('cesse de faire lire Rust même si l’écran part avant la réponse', async () => {
    const { unmount } = watching()

    unmount()

    await waitFor(() => {
      expect(bridge.watchClients).toHaveBeenCalledWith(false)
    })

    expect(bridge.watchClients.mock.lastCall).toStrictEqual([false])
  })
})
