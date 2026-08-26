import { describe, expect, it } from 'vitest'
import type { BannerScreen } from '@/@types/walk'
import { BANNER_SIZE, MONITOR_SIZE } from '@/constants/banner'
import { monitorShape, screenOf } from '@/helpers/banner'

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

const PORTRAIT: BannerScreen = {
  name: 'DISPLAY3',
  width: 1080,
  height: 1920,
  primary: false
}

describe('monitorShape', () => {
  it('takes a widescreen when no screen has been read yet', () => {
    expect(monitorShape(null).ratio).toBe(monitorShape(LAPTOP).ratio)
  })

  it('draws the screen at its own shape', () => {
    expect(monitorShape(SIDE).ratio).toBe(2560 / 1440)
  })

  it('never draws a screen taller than the panel allows', () => {
    const { drawnWidth, ratio } = monitorShape(PORTRAIT)

    expect(drawnWidth / ratio).toBeLessThanOrEqual(MONITOR_SIZE.height)
    expect(drawnWidth).toBeLessThan(MONITOR_SIZE.width)
  })

  it('draws the banner at the scale it will really have on that screen', () => {
    const { drawnWidth, bannerWidth } = monitorShape(LAPTOP)

    expect(bannerWidth / drawnWidth).toBeCloseTo(BANNER_SIZE.width / 1920)
  })

  it('keeps the banner readable on a screen too wide to scale it down', () => {
    const television: BannerScreen = { ...SIDE, width: 3840, height: 2160 }

    expect(monitorShape(television).bannerWidth).toBe(BANNER_SIZE.smallestDrawn)
  })

  it('keeps the banner’s own shape, whatever the screen', () => {
    const { bannerWidth, bannerHeight } = monitorShape(PORTRAIT)

    expect(bannerWidth / bannerHeight).toBeCloseTo(
      BANNER_SIZE.width / BANNER_SIZE.height
    )
  })
})
