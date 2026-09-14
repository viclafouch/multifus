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
  it('sorts the characters under the color they wear', () => {
    const holders = colorHolders(ROSTER)

    expect(holders.sky).toStrictEqual(['Alpha', 'Charlie'])
    expect(holders.pine).toStrictEqual(['Delta'])
    expect(holders.red).toBeUndefined()
  })

  it('keeps nobody from a roster without a color', () => {
    const colourless = colorHolders([characterOf({ color: null })])

    expect(Object.keys(colourless)).toHaveLength(0)
    expect(Object.keys(colorHolders([]))).toHaveLength(0)
  })
})

describe('holderOf', () => {
  it('names the first other one who already wears the color', () => {
    const holders = colorHolders(ROSTER)

    expect(holderOf(holders, { color: 'sky', besides: 'Bravo' })).toBe('Alpha')
    expect(holderOf(holders, { color: 'pine', besides: 'Bravo' })).toBe('Delta')
  })

  it('does not count itself', () => {
    const holders = colorHolders(ROSTER)

    expect(holderOf(holders, { color: 'sky', besides: 'Alpha' })).toBe(
      'Charlie'
    )
    expect(holderOf(holders, { color: 'pine', besides: 'Delta' })).toBeNull()
  })

  it('names nobody for a free color', () => {
    expect(
      holderOf(colorHolders(ROSTER), { color: 'red', besides: 'Alpha' })
    ).toBeNull()
  })
})
