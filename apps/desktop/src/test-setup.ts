import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { SOURCE_LANGUAGE, speak } from '@/lib/i18n'
import { ignore } from '@/lib/utils'

speak(SOURCE_LANGUAGE)

class SilentResizeObserver implements ResizeObserver {
  observe = ignore
  unobserve = ignore
  disconnect = ignore
}

globalThis.ResizeObserver = SilentResizeObserver

const CAPTURED = new WeakMap<Element, Set<number>>()

Element.prototype.setPointerCapture = function setPointerCapture(
  pointerId: number
) {
  const held = CAPTURED.get(this) ?? new Set<number>()

  held.add(pointerId)
  CAPTURED.set(this, held)
}

Element.prototype.hasPointerCapture = function hasPointerCapture(
  pointerId: number
) {
  return CAPTURED.get(this)?.has(pointerId) ?? false
}

Element.prototype.releasePointerCapture = function releasePointerCapture(
  pointerId: number
) {
  CAPTURED.get(this)?.delete(pointerId)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
