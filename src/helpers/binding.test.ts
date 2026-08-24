import { describe, expect, it } from 'vitest'
import { matchIsSameBinding } from '@/helpers/binding'

describe('matchIsSameBinding', () => {
  it('reconnaît deux fois la même action', () => {
    // #when
    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      { kind: 'action', action: 'next' }
    )

    // #then
    expect(isSame).toBe(true)
  })

  it('sépare deux actions différentes', () => {
    // #when
    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      { kind: 'action', action: 'previous' }
    )

    // #then
    expect(isSame).toBe(false)
  })

  it('reconnaît deux fois la même réponse rapide', () => {
    // #when
    const isSame = matchIsSameBinding(
      { kind: 'quickReply', id: 3 },
      { kind: 'quickReply', id: 3 }
    )

    // #then
    expect(isSame).toBe(true)
  })

  it('sépare deux réponses rapides différentes', () => {
    // #when
    const isSame = matchIsSameBinding(
      { kind: 'quickReply', id: 3 },
      { kind: 'quickReply', id: 4 }
    )

    // #then
    expect(isSame).toBe(false)
  })

  it('ne confond jamais les deux familles', () => {
    // #given
    // L'identifiant d'une réponse rapide et le rang d'une action n'ont rien à
    // voir, et les deux voyagent dans le même type.
    const quickReply = { kind: 'quickReply', id: 0 } as const

    // #when
    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      quickReply
    )

    // #then
    expect(isSame).toBe(false)
  })

  it('ne reconnaît rien quand rien n’est en cours', () => {
    // #when
    const isSame = matchIsSameBinding(null, { kind: 'action', action: 'swap' })

    // #then
    expect(isSame).toBe(false)
  })
})
