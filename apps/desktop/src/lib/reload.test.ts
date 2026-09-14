import process from 'node:process'
import { describe, expect, it, vi } from 'vitest'
import { lastSeenMap, rememberMap } from '@/lib/map-memory'
import { reloadScreen } from '@/lib/reload'

const catchJsdomRefusal = () => {
  return vi.spyOn(process.stderr, 'write').mockReturnValue(true)
}

describe('the reload of the screen', () => {
  it('forgets the map that has just broken, then reloads the window', () => {
    const refusal = catchJsdomRefusal()

    rememberMap('settings')

    reloadScreen()

    expect(lastSeenMap()).toBe('clearing')
    expect(refusal.mock.calls.flat().join('')).toContain('navigation')
  })
})
