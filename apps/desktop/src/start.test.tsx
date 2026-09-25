import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MapName } from '@/constants/world'
import { CLEARING } from '@/constants/world'
import { start } from './start'

type Maps = Awaited<
  ReturnType<(typeof import('@/screens/deferred-map'))['loadMaps']>
>

const lastSeenMap = vi.hoisted(() => {
  return vi.fn<() => MapName>()
})

const entry = vi.hoisted(() => {
  return {
    mounts: 0,
    finishLoading: null as (() => void) | null,
    failLoading: null as (() => void) | null
  }
})

vi.mock(import('./boot'), () => {
  return {
    mount: () => {
      entry.mounts += 1
    }
  }
})

vi.mock(import('@/lib/map-memory'), () => {
  return {
    lastSeenMap
  }
})

vi.mock(import('@/screens/deferred-map'), () => {
  return {
    loadMaps: () => {
      return new Promise<Maps>((resolve, reject) => {
        entry.finishLoading = () => {
          import('@/screens/current-map').then(resolve, reject)
        }
        entry.failLoading = () => {
          reject(new Error('chunk missing'))
        }
      })
    }
  }
})

const startOn = (map: MapName) => {
  lastSeenMap.mockReturnValue(map)
  start()
}

describe('the entry of the Multifus window', () => {
  beforeEach(() => {
    entry.mounts = 0
    entry.finishLoading = null
    entry.failLoading = null
  })

  it('mounts at once on the clearing', () => {
    startOn(CLEARING)

    expect(entry.mounts).toBe(1)
    expect(entry.finishLoading).toBeNull()
  })

  it('waits for the other maps before mounting on a map seen before the reload', async () => {
    startOn('settings')

    expect(entry.mounts).toBe(0)

    entry.finishLoading?.()

    await vi.waitFor(() => {
      expect(entry.mounts).toBe(1)
    })
  })

  it('mounts anyway when the other maps fail to load', async () => {
    startOn('settings')

    entry.failLoading?.()

    await vi.waitFor(() => {
      expect(entry.mounts).toBe(1)
    })
  })
})
