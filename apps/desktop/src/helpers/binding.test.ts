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

  it('recognizes twice the same quick text', () => {
    const isSame = matchIsSameBinding(
      { kind: 'quickText', id: 3 },
      { kind: 'quickText', id: 3 }
    )

    expect(isSame).toBe(true)
  })

  it('separates two different quick texts', () => {
    const isSame = matchIsSameBinding(
      { kind: 'quickText', id: 3 },
      { kind: 'quickText', id: 4 }
    )

    expect(isSame).toBe(false)
  })

  it('never mixes up the two families', () => {
    const quickText = { kind: 'quickText', id: 0 } as const

    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      quickText
    )

    expect(isSame).toBe(false)
  })

  it('recognizes nothing when nothing is going on', () => {
    const isSame = matchIsSameBinding(null, { kind: 'action', action: 'walk' })

    expect(isSame).toBe(false)
  })
})
