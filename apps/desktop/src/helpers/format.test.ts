import { describe, expect, it } from 'vitest'
import { focusDuration, screenSaverDelay } from '@/helpers/format'
import { NARROW_NO_BREAK_SPACE, NO_BREAK_SPACE } from '@/test-doubles'

const ONE_MINUTE = 60
const ONE_HOUR = 3600

const ONE_MILLISECOND = 1000

describe('screenSaverDelay', () => {
  it('says a round hour in hours', () => {
    const delay = screenSaverDelay(ONE_HOUR)

    expect(delay).toBe(`1${NO_BREAK_SPACE}heure`)
  })

  it('agrees the plural of the hours', () => {
    const delay = screenSaverDelay(2 * ONE_HOUR)

    expect(delay).toBe(`2${NO_BREAK_SPACE}heures`)
  })

  it('says in minutes what goes past the hour without falling right', () => {
    const delay = screenSaverDelay(ONE_HOUR + 30 * ONE_MINUTE)

    expect(delay).toBe('90 minutes')
  })

  it('says in minutes what is shorter than an hour', () => {
    const delay = screenSaverDelay(20 * ONE_MINUTE)

    expect(delay).toBe('20 minutes')
  })

  it('rounds to the minute a delay that falls between two', () => {
    const delay = screenSaverDelay(90)

    expect(delay).toBe('2 minutes')
  })
})

describe('focusDuration', () => {
  it('keeps one decimal for a focus shorter than a millisecond', () => {
    expect(focusDuration(340)).toBe(`0,3${NARROW_NO_BREAK_SPACE}ms`)
  })

  it('keeps that decimal while the focus stays under ten milliseconds', () => {
    expect(focusDuration(4.2 * ONE_MILLISECOND)).toBe(
      `4,2${NARROW_NO_BREAK_SPACE}ms`
    )
  })

  it('rounds to the millisecond beyond, where the decimal says nothing more', () => {
    expect(focusDuration(12.4 * ONE_MILLISECOND)).toBe(
      `12${NARROW_NO_BREAK_SPACE}ms`
    )
  })

  it('stays in milliseconds when the focus lasts a whole second', () => {
    expect(focusDuration(2000 * ONE_MILLISECOND)).toBe(
      `2${NARROW_NO_BREAK_SPACE}000${NARROW_NO_BREAK_SPACE}ms`
    )
  })
})
