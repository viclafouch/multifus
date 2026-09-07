import { describe, expect, it } from 'vitest'
import type { Display } from '@/@types/display'
import { BANNER_SIZE } from '@/constants/banner'
import { monitorShape, screenOf } from '@/helpers/banner'
import { screenShape } from '@/helpers/display'

const LAPTOP: Display = {
  name: 'DISPLAY1',
  width: 1920,
  height: 1080,
  primary: true
}

const SIDE: Display = {
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
    const nameless: Display = { ...SIDE, name: null }

    expect(screenOf([nameless, LAPTOP], null)).toBe(LAPTOP)
  })

  it('gives nothing when the system reports no screen', () => {
    expect(screenOf([], 'DISPLAY1')).toBeNull()
  })
})

const PORTRAIT: Display = {
  name: 'DISPLAY3',
  width: 1080,
  height: 1920,
  primary: false
}

const unmeasured = (screen: Display | null) => {
  return monitorShape({ screen, boxWidth: 0 })
}

describe('monitorShape', () => {
  it('takes a widescreen when no screen has been read yet', () => {
    expect(unmeasured(null).ratio).toBe(unmeasured(LAPTOP).ratio)
  })

  it('draws the screen at its own shape', () => {
    expect(unmeasured(SIDE).ratio).toBe(2560 / 1440)
  })

  it('draws the banner at the scale it will really have on that screen', () => {
    const { bannerWidth } = monitorShape({ screen: LAPTOP, boxWidth: 640 })

    expect(bannerWidth / 640).toBeCloseTo(BANNER_SIZE.width / 1920)
  })

  it('falls back on the drawn screen until the plate has been measured', () => {
    const { drawnWidth } = screenShape(LAPTOP)

    expect(unmeasured(LAPTOP).bannerWidth).toBeCloseTo(
      monitorShape({ screen: LAPTOP, boxWidth: drawnWidth }).bannerWidth
    )
  })

  it('keeps the banner readable on a screen too wide to scale it down', () => {
    const television: Display = { ...SIDE, width: 3840, height: 2160 }

    expect(unmeasured(television).bannerWidth).toBe(BANNER_SIZE.smallestDrawn)
  })

  it('keeps the banner’s own shape, whatever the screen', () => {
    const { bannerWidth, bannerHeight } = unmeasured(PORTRAIT)

    expect(bannerWidth / bannerHeight).toBeCloseTo(
      BANNER_SIZE.width / BANNER_SIZE.height
    )
  })
})
