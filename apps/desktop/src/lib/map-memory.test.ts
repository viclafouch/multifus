import { describe, expect, it, vi } from 'vitest'
import { forgetMap, lastSeenMap, rememberMap } from '@/lib/map-memory'

const refuseMemory = () => {
  vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
    throw new Error('storage refused')
  })
}

describe('the memory of the map', () => {
  it('opens on the clearing while nothing has been kept', () => {
    expect(lastSeenMap()).toBe('clearing')
  })

  it('returns the kept map', () => {
    rememberMap('relay')

    expect(lastSeenMap()).toBe('relay')
  })

  it('goes back to the clearing once the map is forgotten', () => {
    rememberMap('settings')
    forgetMap()

    expect(lastSeenMap()).toBe('clearing')
  })

  it('goes back to the clearing when the memory names an unknown map', () => {
    vi.spyOn(window.sessionStorage, 'getItem').mockReturnValue('donjon')

    expect(lastSeenMap()).toBe('clearing')
  })

  it('opens on the clearing when the system refuses the memory', () => {
    refuseMemory()

    expect(lastSeenMap()).toBe('clearing')
  })

  it('does not break when the system refuses to keep or to forget', () => {
    refuseMemory()

    expect(() => {
      rememberMap('walk')
    }).not.toThrow()
    expect(() => {
      forgetMap()
    }).not.toThrow()
  })
})
