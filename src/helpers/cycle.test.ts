import { describe, expect, it } from 'vitest'
import type { Character } from '@/@types/roster'
import { arrange } from '@/helpers/cycle'

const ALPHA = {
  nickname: 'Alpha',
  gender: 'male',
  asleep: false,
  online: true,
  relayed: true
} as const satisfies Character

const BETA = { ...ALPHA, nickname: 'Beta' }
const GAMMA = { ...ALPHA, nickname: 'Gamma' }

const ROSTER = [ALPHA, BETA, GAMMA]

describe('arrange', () => {
  it('rend le roster tel quel quand aucun ordre n’est en cours', () => {
    // #when
    const arranged = arrange({ characters: ROSTER, order: null })

    // #then
    expect(arranged).toBe(ROSTER)
  })

  it('suit l’ordre donné', () => {
    // #when
    const arranged = arrange({
      characters: ROSTER,
      order: ['Gamma', 'Alpha', 'Beta']
    })

    // #then
    expect(arranged).toStrictEqual([GAMMA, ALPHA, BETA])
  })

  it('saute un pseudo que l’ordre nomme et que le roster n’a plus', () => {
    // #given
    const order = ['Gamma', 'Delta', 'Alpha', 'Beta']

    // #when
    const arranged = arrange({ characters: ROSTER, order })

    // #then
    expect(arranged).toStrictEqual([GAMMA, ALPHA, BETA])
  })

  it('range à la fin un personnage que l’ordre a oublié', () => {
    // #given
    const order = ['Gamma', 'Alpha']

    // #when
    const arranged = arrange({ characters: ROSTER, order })

    // #then
    expect(arranged).toStrictEqual([GAMMA, ALPHA, BETA])
  })

  it('rend tout le roster quand l’ordre est vide', () => {
    // #when
    const arranged = arrange({ characters: ROSTER, order: [] })

    // #then
    expect(arranged).toStrictEqual([ALPHA, BETA, GAMMA])
  })
})
