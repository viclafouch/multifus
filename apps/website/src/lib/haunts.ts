import type { PageId } from '@/@types/page'
import { MONSTERS } from '@/constants/monsters'
import { PAGE_IDS } from '@/constants/pages'

const FIRST_HAUNT = 65

const HAUNT_GAP = 12

const HAUNT_DRIFT = 5

const HAUNT_COUNT = 16

const DECK_SEED = 'multifus'

type Band = readonly [number, number]

const NEAR_BAND = [2, 9] as const satisfies Band

const FAR_BAND = [12, 24] as const satisfies Band

const FAR_EVERY = 3

const SEED_START = 2_166_136_261

const SEED_PRIME = 16_777_619

const ROLL_STEP = 1_831_565_813

const ROLL_RANGE = 4_294_967_296

type Haunt = Readonly<{
  span: number
  rise: number
  way: 'west' | 'east'
  monster: (typeof MONSTERS)[number]
}>

const seedOf = (word: string) => {
  let seed = SEED_START

  for (const letter of word) {
    seed = Math.imul(seed ^ letter.charCodeAt(0), SEED_PRIME)
  }

  return seed >>> 0
}

const rollerFrom = (seed: number) => {
  let state = seed

  return () => {
    state = (state + ROLL_STEP) >>> 0
    let drawn = Math.imul(state ^ (state >>> 15), state | 1)
    drawn ^= drawn + Math.imul(drawn ^ (drawn >>> 7), drawn | 61)

    return ((drawn ^ (drawn >>> 14)) >>> 0) / ROLL_RANGE
  }
}

const shuffledDeck = () => {
  const roll = rollerFrom(seedOf(DECK_SEED))

  return MONSTERS.map((monster) => {
    return { monster, at: roll() }
  })
    .toSorted((one, other) => {
      return one.at - other.at
    })
    .map(({ monster }) => {
      return monster
    })
}

const DECK = shuffledDeck()

const matchIsSameParity = (one: number, other: number) => {
  return (one + other) % 2 === 0
}

export const hauntsOf = (page: PageId) => {
  const roll = rollerFrom(seedOf(page))
  const dealt = PAGE_IDS.indexOf(page) * HAUNT_COUNT

  return Array.from({ length: HAUNT_COUNT }, (_unused, rank): Haunt => {
    const down =
      FIRST_HAUNT + rank * HAUNT_GAP + Math.floor(roll() * HAUNT_DRIFT)
    const [from, upTo] =
      rank % FAR_EVERY === FAR_EVERY - 1 ? FAR_BAND : NEAR_BAND
    const across = from + Math.floor(roll() * (upTo - from))

    return {
      span: matchIsSameParity(across, down) ? across + 1 : across,
      rise: down,
      way: rank % 2 === 0 ? 'west' : 'east',
      monster: DECK[(dealt + rank) % DECK.length]
    }
  })
}
