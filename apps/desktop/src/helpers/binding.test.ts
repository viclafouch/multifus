import { describe, expect, it } from 'vitest'
import { matchIsSameBinding } from '@/helpers/binding'

describe('matchIsSameBinding', () => {
  it('reconnaît deux fois la même action', () => {
    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      { kind: 'action', action: 'next' }
    )

    expect(isSame).toBe(true)
  })

  it('sépare deux actions différentes', () => {
    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      { kind: 'action', action: 'previous' }
    )

    expect(isSame).toBe(false)
  })

  it('reconnaît deux fois la même réponse rapide', () => {
    const isSame = matchIsSameBinding(
      { kind: 'quickReply', id: 3 },
      { kind: 'quickReply', id: 3 }
    )

    expect(isSame).toBe(true)
  })

  it('sépare deux réponses rapides différentes', () => {
    const isSame = matchIsSameBinding(
      { kind: 'quickReply', id: 3 },
      { kind: 'quickReply', id: 4 }
    )

    expect(isSame).toBe(false)
  })

  it('ne confond jamais les deux familles', () => {
    const quickReply = { kind: 'quickReply', id: 0 } as const

    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      quickReply
    )

    expect(isSame).toBe(false)
  })

  it('ne reconnaît rien quand rien n’est en cours', () => {
    const isSame = matchIsSameBinding(null, { kind: 'action', action: 'walk' })

    expect(isSame).toBe(false)
  })
})
