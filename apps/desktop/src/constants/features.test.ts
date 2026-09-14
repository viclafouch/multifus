import { describe, expect, it } from 'vitest'
import type { ScreenName } from '@/@types/snapshot'
import { FEATURES } from '@/constants/features'
import { MAPS } from '@/constants/world'

const OUTSIDE_THE_ROLL = [
  'settings',
  'about'
] as const satisfies readonly ScreenName[]

const TIMES_NAMED = new Map<ScreenName | null, number>()

for (const feature of FEATURES) {
  TIMES_NAMED.set(feature.screen, (TIMES_NAMED.get(feature.screen) ?? 0) + 1)
}

const TWICE_NAMED = [...TIMES_NAMED.keys()].filter((screen) => {
  return (TIMES_NAMED.get(screen) ?? 0) > 1
})

const matchIsExpected = (name: ScreenName) => {
  return !OUTSIDE_THE_ROLL.some((skipped) => {
    return skipped === name
  })
}

const missingFromRoll = () => {
  const missing = []

  for (const name of MAPS) {
    if (matchIsExpected(name) && !TIMES_NAMED.has(name)) {
      missing.push(name)
    }
  }

  return missing
}

describe('the features of the credits', () => {
  it('name every map of the world, the settings aside', () => {
    expect(missingFromRoll()).toStrictEqual([])
  })

  it('leads twice only to the map that carries two features', () => {
    expect(TWICE_NAMED).toStrictEqual(['characters'])
  })
})
