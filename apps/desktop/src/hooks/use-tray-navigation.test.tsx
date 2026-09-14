import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ScreenName } from '@/@types/snapshot'

type TrayHandler = Parameters<typeof import('@/lib/multifus').onNavigate>[0]

const rust = vi.hoisted(() => {
  return {
    asked: null as TrayHandler | null,
    open: null as (() => void) | null,
    unlisten: vi.fn()
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return {
    onNavigate: (handle: (screen: ScreenName) => void) => {
      rust.asked = handle

      return new Promise<() => void>((resolve) => {
        rust.open = () => {
          resolve(rust.unlisten)
        }
      })
    }
  }
})

const { useTrayNavigation } = await import('@/hooks/use-tray-navigation')

const listening = async () => {
  await waitFor(() => {
    expect(rust.open).not.toBeNull()
  })

  await act(async () => {
    rust.open?.()
    await Promise.resolve()
  })
}

describe('useTrayNavigation', () => {
  beforeEach(() => {
    rust.asked = null
    rust.open = null
  })

  it('shows the screen the tray asks for', async () => {
    const show = vi.fn<(screen: ScreenName) => void>()

    renderHook(() => {
      useTrayNavigation(show)
    })
    await listening()

    act(() => {
      rust.asked?.('relay')
    })

    expect(show).toHaveBeenCalledWith('relay')
  })

  it('stops listening when the window leaves', async () => {
    const { unmount } = renderHook(() => {
      useTrayNavigation(() => {})
    })

    await listening()
    unmount()

    await waitFor(() => {
      expect(rust.unlisten).toHaveBeenCalledWith()
    })
  })

  it('stops listening even when the window leaves before the answer', async () => {
    const { unmount } = renderHook(() => {
      useTrayNavigation(() => {})
    })

    await waitFor(() => {
      expect(rust.open).not.toBeNull()
    })

    unmount()

    await act(async () => {
      rust.open?.()
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(rust.unlisten).toHaveBeenCalledWith()
    })
  })
})
