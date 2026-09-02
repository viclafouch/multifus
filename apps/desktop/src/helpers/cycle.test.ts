import { describe, expect, it } from 'vitest'
import type { Character } from '@/@types/roster'
import {
  arrange,
  genderGroupOf,
  genderlessNicknames,
  matchIsArranged,
  matchIsInCycle,
  nicknamesOf
} from '@/helpers/cycle'

const ALPHA = {
  nickname: 'Alpha',
  gender: 'male',
  class: 'iop',
  color: null,
  main: false,
  excluded: false,
  online: true,
  relayed: true,
  shortcut: null,
  shortcutStatus: { kind: 'unbound' }
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

describe('nicknamesOf', () => {
  it('rend les pseudos dans l’ordre du roster', () => {
    expect(nicknamesOf(ROSTER)).toStrictEqual(['Alpha', 'Beta', 'Gamma'])
  })
})

describe('matchIsInCycle', () => {
  it('prend un personnage connecté et pas exclu', () => {
    expect(matchIsInCycle(ALPHA)).toBe(true)
  })

  it('laisse un personnage exclu', () => {
    expect(matchIsInCycle({ ...ALPHA, excluded: true })).toBe(false)
  })

  it('laisse un personnage déconnecté', () => {
    expect(matchIsInCycle({ ...ALPHA, online: false })).toBe(false)
  })
})

describe('genderGroupOf', () => {
  it('allume un sexe dont au moins un connecté défile', () => {
    const characters = [{ ...ALPHA, excluded: true }, BETA]

    expect(genderGroupOf({ characters, gender: 'male' })).toStrictEqual({
      isEmpty: false,
      isIncluded: true
    })
  })

  it('éteint un sexe dont tous les connectés sont exclus', () => {
    const characters = [{ ...ALPHA, excluded: true }]

    expect(genderGroupOf({ characters, gender: 'male' })).toStrictEqual({
      isEmpty: false,
      isIncluded: false
    })
  })

  it('dit vide un sexe dont personne n’est connecté', () => {
    const characters = [
      ALPHA,
      { ...BETA, gender: 'female', online: false }
    ] satisfies readonly Character[]

    expect(genderGroupOf({ characters, gender: 'female' })).toStrictEqual({
      isEmpty: true,
      isIncluded: false
    })
  })
})

describe('genderlessNicknames', () => {
  it('nomme les connectés qui n’ont pas de sexe', () => {
    const characters = [
      ALPHA,
      { ...BETA, gender: null },
      { ...GAMMA, gender: null, online: false }
    ] satisfies readonly Character[]

    expect(genderlessNicknames(characters)).toStrictEqual(['Beta'])
  })
})

describe('matchIsArranged', () => {
  it('dit oui quand aucun ordre n’est en cours', () => {
    expect(matchIsArranged({ characters: ROSTER, order: null })).toBe(true)
  })

  it('dit oui quand le roster suit déjà l’ordre', () => {
    const order = ['Alpha', 'Beta', 'Gamma']

    expect(matchIsArranged({ characters: ROSTER, order })).toBe(true)
  })

  it('dit non quand le roster arrive dans un autre ordre', () => {
    const order = ['Gamma', 'Alpha', 'Beta']

    expect(matchIsArranged({ characters: ROSTER, order })).toBe(false)
  })

  it('ignore un pseudo que l’ordre nomme et que le roster n’a plus', () => {
    const order = ['Alpha', 'Delta', 'Beta', 'Gamma']

    expect(matchIsArranged({ characters: ROSTER, order })).toBe(true)
  })

  it('ignore un personnage arrivé depuis', () => {
    const order = ['Alpha', 'Gamma']

    expect(matchIsArranged({ characters: [ALPHA, GAMMA, BETA], order })).toBe(
      true
    )
  })
})
