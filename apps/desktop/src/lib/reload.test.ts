import process from 'node:process'
import { describe, expect, it, vi } from 'vitest'
import { lastSeenMap, rememberMap } from '@/lib/map-memory'
import { reloadScreen } from '@/lib/reload'

const catchJsdomRefusal = () => {
  return vi.spyOn(process.stderr, 'write').mockReturnValue(true)
}

describe('le rechargement de l’écran', () => {
  it('oublie la map qui vient de casser, puis recharge la fenêtre', () => {
    const refusal = catchJsdomRefusal()

    rememberMap('settings')

    reloadScreen()

    expect(lastSeenMap()).toBe('clearing')
    expect(refusal.mock.calls.flat().join('')).toContain('navigation')
  })
})
