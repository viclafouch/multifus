import { describe, expect, it, vi } from 'vitest'
import { forgetMap, lastSeenMap, rememberMap } from '@/lib/map-memory'

const refuseMemory = () => {
  vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
    throw new Error('stockage refusé')
  })
}

describe('la mémoire de la map', () => {
  it('ouvre sur la clairière tant que rien n’a été retenu', () => {
    expect(lastSeenMap()).toBe('clearing')
  })

  it('rend la map retenue', () => {
    rememberMap('relay')

    expect(lastSeenMap()).toBe('relay')
  })

  it('revient à la clairière une fois la map oubliée', () => {
    rememberMap('settings')
    forgetMap()

    expect(lastSeenMap()).toBe('clearing')
  })

  it('revient à la clairière quand la mémoire nomme une map inconnue', () => {
    vi.spyOn(window.sessionStorage, 'getItem').mockReturnValue('donjon')

    expect(lastSeenMap()).toBe('clearing')
  })

  it('ouvre sur la clairière quand le système refuse la mémoire', () => {
    refuseMemory()

    expect(lastSeenMap()).toBe('clearing')
  })

  it('ne casse pas quand le système refuse de retenir ou d’oublier', () => {
    refuseMemory()

    expect(() => {
      rememberMap('wheel')
    }).not.toThrow()
    expect(() => {
      forgetMap()
    }).not.toThrow()
  })
})
