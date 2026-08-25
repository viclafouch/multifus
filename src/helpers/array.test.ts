import { describe, expect, it } from 'vitest'
import { moved } from '@/helpers/array'

const LIST = ['Alpha', 'Beta', 'Gamma']

describe('moved', () => {
  it('descend un élément d’un rang', () => {
    const result = moved({ list: LIST, item: 'Alpha', delta: 1 })

    expect(result).toStrictEqual(['Beta', 'Alpha', 'Gamma'])
  })

  it('remonte un élément d’un rang', () => {
    const result = moved({ list: LIST, item: 'Gamma', delta: -1 })

    expect(result).toStrictEqual(['Alpha', 'Gamma', 'Beta'])
  })

  it('traverse la liste quand le delta vaut plus d’un rang', () => {
    const result = moved({ list: LIST, item: 'Alpha', delta: 2 })

    expect(result).toStrictEqual(['Beta', 'Gamma', 'Alpha'])
  })

  it('refuse de remonter le premier', () => {
    const result = moved({ list: LIST, item: 'Alpha', delta: -1 })

    expect(result).toBeNull()
  })

  it('refuse de descendre le dernier', () => {
    const result = moved({ list: LIST, item: 'Gamma', delta: 1 })

    expect(result).toBeNull()
  })

  it('refuse un delta nul', () => {
    const result = moved({ list: LIST, item: 'Beta', delta: 0 })

    expect(result).toBeNull()
  })

  it('refuse un élément absent de la liste', () => {
    const result = moved({ list: LIST, item: 'Delta', delta: 1 })

    expect(result).toBeNull()
  })

  it('laisse la liste d’origine intacte', () => {
    const list = ['Alpha', 'Beta', 'Gamma']

    moved({ list, item: 'Alpha', delta: 1 })

    expect(list).toStrictEqual(['Alpha', 'Beta', 'Gamma'])
  })
})
