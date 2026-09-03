import { describe, expect, it, vi } from 'vitest'
import {
  forgetScreen,
  lastSeenScreen,
  rememberScreen
} from '@/lib/screen-memory'

const refuseMemory = () => {
  vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
    throw new Error('stockage refusé')
  })
}

describe('la mémoire de l’écran', () => {
  it('ouvre sur les personnages tant que rien n’a été retenu', () => {
    expect(lastSeenScreen()).toBe('characters')
  })

  it('rend l’écran retenu', () => {
    rememberScreen('relay')

    expect(lastSeenScreen()).toBe('relay')
  })

  it('revient aux personnages une fois l’écran oublié', () => {
    rememberScreen('settings')
    forgetScreen()

    expect(lastSeenScreen()).toBe('characters')
  })

  it('revient aux personnages quand la mémoire nomme un écran inconnu', () => {
    vi.spyOn(window.sessionStorage, 'getItem').mockReturnValue('donjon')

    expect(lastSeenScreen()).toBe('characters')
  })

  it('ouvre sur les personnages quand le système refuse la mémoire', () => {
    refuseMemory()

    expect(lastSeenScreen()).toBe('characters')
  })

  it('ne casse pas quand le système refuse de retenir ou d’oublier', () => {
    refuseMemory()

    expect(() => {
      rememberScreen('wheel')
    }).not.toThrow()
    expect(() => {
      forgetScreen()
    }).not.toThrow()
  })
})
