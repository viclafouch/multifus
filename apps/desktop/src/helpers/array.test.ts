import { describe, expect, it } from 'vitest'
import { moved } from '@/helpers/array'

const LIST = ['Alpha', 'Beta', 'Gamma']

describe('moved', () => {
  it('moves an item down one rank', () => {
    const result = moved({ list: LIST, item: 'Alpha', delta: 1 })

    expect(result).toStrictEqual(['Beta', 'Alpha', 'Gamma'])
  })

  it('moves an item up one rank', () => {
    const result = moved({ list: LIST, item: 'Gamma', delta: -1 })

    expect(result).toStrictEqual(['Alpha', 'Gamma', 'Beta'])
  })

  it('crosses the list when the delta is worth more than one rank', () => {
    const result = moved({ list: LIST, item: 'Alpha', delta: 2 })

    expect(result).toStrictEqual(['Beta', 'Gamma', 'Alpha'])
  })

  it('refuses to move the first one up', () => {
    const result = moved({ list: LIST, item: 'Alpha', delta: -1 })

    expect(result).toBeNull()
  })

  it('refuses to move the last one down', () => {
    const result = moved({ list: LIST, item: 'Gamma', delta: 1 })

    expect(result).toBeNull()
  })

  it('refuses a delta of zero', () => {
    const result = moved({ list: LIST, item: 'Beta', delta: 0 })

    expect(result).toBeNull()
  })

  it('refuses an item that is not in the list', () => {
    const result = moved({ list: LIST, item: 'Delta', delta: 1 })

    expect(result).toBeNull()
  })

  it('leaves the original list untouched', () => {
    const list = ['Alpha', 'Beta', 'Gamma']

    moved({ list, item: 'Alpha', delta: 1 })

    expect(list).toStrictEqual(['Alpha', 'Beta', 'Gamma'])
  })
})
