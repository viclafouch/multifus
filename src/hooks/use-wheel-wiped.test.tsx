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
  it('ne dit rien à Rust tant que la roue est à l’écran', async () => {
    show(null)

    await waitFor(() => {
      expect(bridge.answered).not.toHaveBeenCalled()
    })
  })

  it('dit à Rust que la fenêtre est vide, roue par roue', async () => {
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

  it('se tait si la fenêtre s’en va avant l’image', async () => {
    const { rerender, unmount } = show(null)

    rerender({ wiped: 4 })
    unmount()

    await waitFor(() => {
      expect(bridge.answered).not.toHaveBeenCalled()
    })
  })
})
