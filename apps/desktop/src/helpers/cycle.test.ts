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
  it('returns the roster as it is when no order is going on', () => {
    const arranged = arrange({ characters: ROSTER, order: null })

    expect(arranged).toBe(ROSTER)
  })

  it('follows the given order', () => {
    const arranged = arrange({
      characters: ROSTER,
      order: ['Gamma', 'Alpha', 'Beta']
    })

    expect(arranged).toStrictEqual([GAMMA, ALPHA, BETA])
  })

  it('skips a nickname the order names and the roster no longer has', () => {
    const order = ['Gamma', 'Delta', 'Alpha', 'Beta']

    const arranged = arrange({ characters: ROSTER, order })

    expect(arranged).toStrictEqual([GAMMA, ALPHA, BETA])
  })

  it('puts at the end a character the order forgot', () => {
    const order = ['Gamma', 'Alpha']

    const arranged = arrange({ characters: ROSTER, order })

    expect(arranged).toStrictEqual([GAMMA, ALPHA, BETA])
  })

  it('returns the whole roster when the order is empty', () => {
    const arranged = arrange({ characters: ROSTER, order: [] })

    expect(arranged).toStrictEqual([ALPHA, BETA, GAMMA])
  })
})

describe('nicknamesOf', () => {
  it('returns the nicknames in the order of the roster', () => {
    expect(nicknamesOf(ROSTER)).toStrictEqual(['Alpha', 'Beta', 'Gamma'])
  })
})

describe('matchIsInCycle', () => {
  it('takes a character who is online and not excluded', () => {
    expect(matchIsInCycle(ALPHA)).toBe(true)
  })

  it('leaves out an excluded character', () => {
    expect(matchIsInCycle({ ...ALPHA, excluded: true })).toBe(false)
  })

  it('leaves out an offline character', () => {
    expect(matchIsInCycle({ ...ALPHA, online: false })).toBe(false)
  })
})

describe('genderGroupOf', () => {
  it('lights a gender when at least one of its online characters cycles', () => {
    const characters = [{ ...ALPHA, excluded: true }, BETA]

    expect(genderGroupOf({ characters, gender: 'male' })).toStrictEqual({
      isEmpty: false,
      isIncluded: true
    })
  })

  it('turns off a gender when all its online characters are excluded', () => {
    const characters = [{ ...ALPHA, excluded: true }]

    expect(genderGroupOf({ characters, gender: 'male' })).toStrictEqual({
      isEmpty: false,
      isIncluded: false
    })
  })

  it('says a gender is empty when none of its characters is online', () => {
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
  it('names the online ones who have no gender', () => {
    const characters = [
      ALPHA,
      { ...BETA, gender: null },
      { ...GAMMA, gender: null, online: false }
    ] satisfies readonly Character[]

    expect(genderlessNicknames(characters)).toStrictEqual(['Beta'])
  })
})

describe('matchIsArranged', () => {
  it('says yes when no order is going on', () => {
    expect(matchIsArranged({ characters: ROSTER, order: null })).toBe(true)
  })

  it('says yes when the roster already follows the order', () => {
    const order = ['Alpha', 'Beta', 'Gamma']

    expect(matchIsArranged({ characters: ROSTER, order })).toBe(true)
  })

  it('says no when the roster comes in another order', () => {
    const order = ['Gamma', 'Alpha', 'Beta']

    expect(matchIsArranged({ characters: ROSTER, order })).toBe(false)
  })

  it('ignores a nickname the order names and the roster no longer has', () => {
    const order = ['Alpha', 'Delta', 'Beta', 'Gamma']

    expect(matchIsArranged({ characters: ROSTER, order })).toBe(true)
  })

  it('ignores a character who arrived since then', () => {
    const order = ['Alpha', 'Gamma']

    expect(matchIsArranged({ characters: [ALPHA, GAMMA, BETA], order })).toBe(
      true
    )
  })
})
