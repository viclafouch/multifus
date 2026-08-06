import { describe, expect, it } from 'vitest'
import { moved } from '@/helpers/array'

const LIST = ['Alpha', 'Beta', 'Gamma']

describe('moved', () => {
  it('descend un élément d’un rang', () => {
    // #when
    const result = moved({ list: LIST, item: 'Alpha', delta: 1 })

    // #then
    expect(result).toStrictEqual(['Beta', 'Alpha', 'Gamma'])
  })

  it('remonte un élément d’un rang', () => {
    // #when
    const result = moved({ list: LIST, item: 'Gamma', delta: -1 })

    // #then
    expect(result).toStrictEqual(['Alpha', 'Gamma', 'Beta'])
  })

  it('traverse la liste quand le delta vaut plus d’un rang', () => {
    // #when
    const result = moved({ list: LIST, item: 'Alpha', delta: 2 })

    // #then
    expect(result).toStrictEqual(['Beta', 'Gamma', 'Alpha'])
  })

  it('refuse de remonter le premier', () => {
    // #when
    const result = moved({ list: LIST, item: 'Alpha', delta: -1 })

    // #then
    expect(result).toBeNull()
  })

  it('refuse de descendre le dernier', () => {
    // #when
    const result = moved({ list: LIST, item: 'Gamma', delta: 1 })

    // #then
    expect(result).toBeNull()
  })

  it('refuse un delta nul', () => {
    // #when
    const result = moved({ list: LIST, item: 'Beta', delta: 0 })

    // #then
    expect(result).toBeNull()
  })

  it('refuse un élément absent de la liste', () => {
    // #when
    const result = moved({ list: LIST, item: 'Delta', delta: 1 })

    // #then
    expect(result).toBeNull()
  })

  it('laisse la liste d’origine intacte', () => {
    // #given
    const list = ['Alpha', 'Beta', 'Gamma']

    // #when
    moved({ list, item: 'Alpha', delta: 1 })

    // #then
    expect(list).toStrictEqual(['Alpha', 'Beta', 'Gamma'])
  })
})
