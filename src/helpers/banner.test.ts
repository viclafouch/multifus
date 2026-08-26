import { describe, expect, it } from 'vitest'
import type { BannerScreen } from '@/@types/walk'
import { screenOf } from '@/helpers/banner'

const LAPTOP: BannerScreen = {
  name: 'DISPLAY1',
  width: 1920,
  height: 1080,
  primary: true
}

const SIDE: BannerScreen = {
  name: 'DISPLAY2',
  width: 2560,
  height: 1440,
  primary: false
}

describe('screenOf', () => {
  it('gives the screen that was chosen by name', () => {
    expect(screenOf([LAPTOP, SIDE], 'DISPLAY2')).toBe(SIDE)
  })

  it('falls back to the main screen when none was chosen', () => {
    expect(screenOf([SIDE, LAPTOP], null)).toBe(LAPTOP)
  })

  it('falls back to the main screen when the chosen one is unplugged', () => {
    expect(screenOf([LAPTOP], 'DISPLAY2')).toBe(LAPTOP)
  })

  it('takes the first screen when none calls itself the main one', () => {
    expect(screenOf([SIDE], null)).toBe(SIDE)
  })

  it('keeps the main screen when a nameless one is plugged in', () => {
    const nameless: BannerScreen = { ...SIDE, name: null }

    expect(screenOf([nameless, LAPTOP], null)).toBe(LAPTOP)
  })

  it('gives nothing when the system reports no screen', () => {
    expect(screenOf([], 'DISPLAY1')).toBeNull()
  })
})
