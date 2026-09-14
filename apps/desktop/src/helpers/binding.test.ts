import { describe, expect, it } from 'vitest'
import { matchIsSameBinding } from '@/helpers/binding'

describe('matchIsSameBinding', () => {
  it('recognizes twice the same action', () => {
    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      { kind: 'action', action: 'next' }
    )

    expect(isSame).toBe(true)
  })

  it('separates two different actions', () => {
    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      { kind: 'action', action: 'previous' }
    )

    expect(isSame).toBe(false)
  })

  it('recognizes twice the same quick reply', () => {
    const isSame = matchIsSameBinding(
      { kind: 'quickReply', id: 3 },
      { kind: 'quickReply', id: 3 }
    )

    expect(isSame).toBe(true)
  })

  it('separates two different quick replies', () => {
    const isSame = matchIsSameBinding(
      { kind: 'quickReply', id: 3 },
      { kind: 'quickReply', id: 4 }
    )

    expect(isSame).toBe(false)
  })

  it('never mixes up the two families', () => {
    const quickReply = { kind: 'quickReply', id: 0 } as const

    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      quickReply
    )

    expect(isSame).toBe(false)
  })

  it('recognizes nothing when nothing is going on', () => {
    const isSame = matchIsSameBinding(null, { kind: 'action', action: 'walk' })

    expect(isSame).toBe(false)
  })
})
