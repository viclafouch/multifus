import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { ignore } from '@/lib/utils'

class SilentResizeObserver implements ResizeObserver {
  observe = ignore
  unobserve = ignore
  disconnect = ignore
}

globalThis.ResizeObserver = SilentResizeObserver

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
