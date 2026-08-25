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
    const arranged = arrange({ characters: ROSTER, order: null })

    expect(arranged).toBe(ROSTER)
  })

  it('suit l’ordre donné', () => {
    const arranged = arrange({
      characters: ROSTER,
      order: ['Gamma', 'Alpha', 'Beta']
    })

    expect(arranged).toStrictEqual([GAMMA, ALPHA, BETA])
  })

  it('saute un pseudo que l’ordre nomme et que le roster n’a plus', () => {
    const order = ['Gamma', 'Delta', 'Alpha', 'Beta']

    const arranged = arrange({ characters: ROSTER, order })

    expect(arranged).toStrictEqual([GAMMA, ALPHA, BETA])
  })

  it('range à la fin un personnage que l’ordre a oublié', () => {
    const order = ['Gamma', 'Alpha']

    const arranged = arrange({ characters: ROSTER, order })

    expect(arranged).toStrictEqual([GAMMA, ALPHA, BETA])
  })

  it('rend tout le roster quand l’ordre est vide', () => {
    const arranged = arrange({ characters: ROSTER, order: [] })

    expect(arranged).toStrictEqual([ALPHA, BETA, GAMMA])
  })
})
