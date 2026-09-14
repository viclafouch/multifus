import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const bridge = vi.hoisted(() => {
  return { answered: vi.fn() }
})

vi.mock(import('@/lib/multifus'), () => {
  return {
    wheelWiped: (generation: number) => {
      bridge.answered(generation)

      return Promise.resolve(null)
    }
  }
})

const { useWheelWiped } = await import('@/hooks/use-wheel-wiped')

const show = (generation: number | null) => {
  return renderHook(
    ({ wiped }: { wiped: number | null }) => {
      useWheelWiped(wiped)
    },
    { initialProps: { wiped: generation } }
  )
}

describe('useWheelWiped', () => {
  it('says nothing to Rust while the wheel is on the screen', async () => {
    show(null)

    await waitFor(() => {
      expect(bridge.answered).not.toHaveBeenCalled()
    })
  })

  it('tells Rust the window is empty, wheel after wheel', async () => {
    const { rerender } = show(null)

    rerender({ wiped: 4 })

    await waitFor(() => {
      expect(bridge.answered).toHaveBeenCalledWith(4)
    })

    rerender({ wiped: 5 })

    await waitFor(() => {
      expect(bridge.answered).toHaveBeenCalledWith(5)
    })
  })

  it('keeps quiet if the window leaves before the frame', async () => {
    const { rerender, unmount } = show(null)

    rerender({ wiped: 4 })
    unmount()

    await waitFor(() => {
      expect(bridge.answered).not.toHaveBeenCalled()
    })
  })
})
