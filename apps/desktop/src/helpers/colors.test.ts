import { describe, expect, it } from 'vitest'
import { colorHolders, holderOf } from '@/helpers/colors'
import { characterOf } from '@/test-doubles'

const ROSTER = [
  characterOf({ nickname: 'Alpha', color: 'sky' }),
  characterOf({ nickname: 'Bravo', color: null }),
  characterOf({ nickname: 'Charlie', color: 'sky' }),
  characterOf({ nickname: 'Delta', color: 'pine' })
]

describe('colorHolders', () => {
  it('range les personnages sous la couleur qu’ils portent', () => {
    const holders = colorHolders(ROSTER)

    expect(holders.sky).toStrictEqual(['Alpha', 'Charlie'])
    expect(holders.pine).toStrictEqual(['Delta'])
    expect(holders.red).toBeUndefined()
  })

  it('ne retient personne d’un roster sans couleur', () => {
    const colourless = colorHolders([characterOf({ color: null })])

    expect(Object.keys(colourless)).toHaveLength(0)
    expect(Object.keys(colorHolders([]))).toHaveLength(0)
  })
})

describe('holderOf', () => {
  it('nomme le premier autre qui porte déjà la couleur', () => {
    const holders = colorHolders(ROSTER)

    expect(holderOf(holders, { color: 'sky', besides: 'Bravo' })).toBe('Alpha')
    expect(holderOf(holders, { color: 'pine', besides: 'Bravo' })).toBe('Delta')
  })

  it('ne se compte pas lui-même', () => {
    const holders = colorHolders(ROSTER)

    expect(holderOf(holders, { color: 'sky', besides: 'Alpha' })).toBe(
      'Charlie'
    )
    expect(holderOf(holders, { color: 'pine', besides: 'Delta' })).toBeNull()
  })

  it('ne nomme personne pour une couleur libre', () => {
    expect(
      holderOf(colorHolders(ROSTER), { color: 'red', besides: 'Alpha' })
    ).toBeNull()
  })
})
