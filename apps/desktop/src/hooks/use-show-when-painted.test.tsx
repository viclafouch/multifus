import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { pending } from '@/test-doubles'

const rust = vi.hoisted(() => {
  const order: string[] = []

  return {
    order,
    answer: null as (() => void) | null,
    refuse: null as ((reason: Error) => void) | null
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return {
    windowPainted: () => {
      rust.order.push('windowPainted')

      return new Promise<null>((resolve, reject) => {
        rust.answer = () => {
          resolve(null)
        }
        rust.refuse = reject
      })
    }
  }
})

vi.mock(import('@/screens/deferred-map'), () => {
  return {
    loadMaps: () => {
      rust.order.push('loadMaps')

      return pending()
    }
  }
})

const { useShowWhenPainted } = await import('@/hooks/use-show-when-painted')

const paint = async () => {
  renderHook(() => {
    useShowWhenPainted(true)
  })

  await waitFor(() => {
    expect(rust.order).toStrictEqual(['windowPainted'])
  })
}

describe('useShowWhenPainted', () => {
  beforeEach(() => {
    rust.order.splice(0)
  })

  it('loads the other maps only once the window is shown', async () => {
    await paint()

    rust.answer?.()

    await waitFor(() => {
      expect(rust.order).toStrictEqual(['windowPainted', 'loadMaps'])
    })
  })

  it('still loads the other maps when Rust refuses to show the window', async () => {
    await paint()

    rust.refuse?.(new Error('no window'))

    await waitFor(() => {
      expect(rust.order).toStrictEqual(['windowPainted', 'loadMaps'])
    })
  })
})
