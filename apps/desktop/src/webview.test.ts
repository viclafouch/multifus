/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import CONFIG from '../src-tauri/tauri.conf.json'

const VITE_CONFIG_FILE = join(import.meta.dirname, '..', 'vite.config.ts')

const OLDEST_WEBVIEW_DECLARATION = /OLDEST_WEBVIEW = '(safari[\d.]+)'/u

const MACOS_SHIPPING_SAFARI: Record<string, string> = {
  'safari15.4': '12.3',
  'safari15.6': '12.5',
  'safari16.0': '12.6',
  'safari16.4': '13.3',
  'safari17.0': '14.0',
  'safari18.0': '15.0',
  'safari26.0': '26.0'
}

const rankOf = (version: string) => {
  return version.split('.').map((part) => {
    return Math.trunc(Number(part))
  })
}

const matchIsAtLeast = (version: string, floor: string) => {
  const reached = rankOf(version)
  const wanted = rankOf(floor)

  for (let at = 0; at < Math.max(reached.length, wanted.length); at += 1) {
    const step = reached[at] ?? 0
    const demand = wanted[at] ?? 0

    if (step !== demand) {
      return step > demand
    }
  }

  return true
}

const oldestWebviewOf = (source: string) => {
  const found = OLDEST_WEBVIEW_DECLARATION.exec(source)

  if (found === null) {
    throw new Error('vite.config.ts declares no OLDEST_WEBVIEW')
  }

  return found[1]
}

describe('the oldest webview the app is built for', () => {
  const oldestWebview = oldestWebviewOf(readFileSync(VITE_CONFIG_FILE, 'utf8'))

  it('is one this repository knows how to place on a macOS version', () => {
    expect(Object.keys(MACOS_SHIPPING_SAFARI)).toContain(oldestWebview)
  })

  it('ships with the oldest macOS the bundle lets in', () => {
    const { minimumSystemVersion } = CONFIG.bundle.macOS

    expect(
      matchIsAtLeast(
        minimumSystemVersion,
        MACOS_SHIPPING_SAFARI[oldestWebview]
      ),
      `macOS ${minimumSystemVersion} is older than the ${MACOS_SHIPPING_SAFARI[oldestWebview]} that carries ${oldestWebview}`
    ).toBe(true)
  })
})
