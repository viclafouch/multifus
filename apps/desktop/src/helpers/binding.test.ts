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

  it('recognizes twice the same character', () => {
    const isSame = matchIsSameBinding(
      { kind: 'character', nickname: 'Ilyzaelle' },
      { kind: 'character', nickname: 'Ilyzaelle' }
    )

    expect(isSame).toBe(true)
  })

  it('separates two different characters', () => {
    const isSame = matchIsSameBinding(
      { kind: 'character', nickname: 'Ilyzaelle' },
      { kind: 'character', nickname: 'Goultard' }
    )

    expect(isSame).toBe(false)
  })

  it('never mixes up the two families', () => {
    const character = { kind: 'character', nickname: 'next' } as const

    const isSame = matchIsSameBinding(
      { kind: 'action', action: 'next' },
      character
    )

    expect(isSame).toBe(false)
  })

  it('recognizes nothing when nothing is going on', () => {
    const isSame = matchIsSameBinding(null, { kind: 'action', action: 'walk' })

    expect(isSame).toBe(false)
  })
})
