import { describe, expect, it } from 'vitest'
import type { ScreenName } from '@/@types/snapshot'
import { FEATURES } from '@/constants/features'
import { NAV_ITEMS } from '@/constants/navigation'

const OUTSIDE_THE_ROLL = [
  'settings',
  'about'
] as const satisfies readonly ScreenName[]

const SHOWN_SCREENS = new Set<ScreenName | null>()

for (const feature of FEATURES) {
  SHOWN_SCREENS.add(feature.screen)
}

const matchIsExpected = (name: ScreenName) => {
  return !OUTSIDE_THE_ROLL.some((skipped) => {
    return skipped === name
  })
}

const missingFromRoll = () => {
  const missing = []

  for (const item of NAV_ITEMS) {
    if (matchIsExpected(item.name) && !SHOWN_SCREENS.has(item.name)) {
      missing.push(item.name)
    }
  }

  return missing
}

describe('les fonctionnalités du générique', () => {
  it('nomment tout ce que la barre de gauche ouvre, les réglages mis à part', () => {
    expect(missingFromRoll()).toStrictEqual([])
  })

  it('ne nomment jamais deux fois le même écran', () => {
    expect(SHOWN_SCREENS.size).toBe(FEATURES.length)
  })
})
