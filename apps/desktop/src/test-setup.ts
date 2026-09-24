import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import type { SystemInternals } from '@/@types/system'
import { SOURCE_LANGUAGE, speak } from '@/lib/i18n'
import { ignore } from '@/lib/utils'

const APPLE_SYSTEM = {
  platform: 'macos',
  version: '26.0.0'
} as const satisfies SystemInternals

const WINDOWS_SYSTEM = {
  platform: 'windows',
  version: '10.0.26100'
} as const satisfies SystemInternals

const describeTheSystem = () => {
  Object.defineProperty(globalThis, '__TAURI_OS_PLUGIN_INTERNALS__', {
    configurable: true,
    get() {
      return navigator.userAgent.includes('Mac') ? APPLE_SYSTEM : WINDOWS_SYSTEM
    }
  })
}

describeTheSystem()

await speak(SOURCE_LANGUAGE)

class SilentResizeObserver implements ResizeObserver {
  observe = ignore
  unobserve = ignore
  disconnect = ignore
}

globalThis.ResizeObserver = SilentResizeObserver

class StillMediaQueryList extends EventTarget implements MediaQueryList {
  matches = false
  onchange = null

  constructor(readonly media: string) {
    super()
  }

  addListener = ignore
  removeListener = ignore
}

window.matchMedia = (query: string) => {
  return new StillMediaQueryList(query)
}

Element.prototype.scrollIntoView = ignore

Object.defineProperty(document, 'fonts', {
  value: { ready: Promise.resolve() }
})

HTMLImageElement.prototype.decode = function decode() {
  return Promise.resolve()
}

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
  vi.restoreAllMocks()
  window.sessionStorage.clear()
  vi.unstubAllGlobals()
  describeTheSystem()
})
