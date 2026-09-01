import { describe, expect, it } from 'vitest'
import { focusDuration, screenSaverDelay } from '@/helpers/format'
import { NARROW_NO_BREAK_SPACE, NO_BREAK_SPACE } from '@/test-doubles'

const ONE_MINUTE = 60
const ONE_HOUR = 3600

const ONE_MILLISECOND = 1000

describe('screenSaverDelay', () => {
  it('dit une heure ronde en heures', () => {
    const delay = screenSaverDelay(ONE_HOUR)

    expect(delay).toBe(`1${NO_BREAK_SPACE}heure`)
  })

  it('accorde le pluriel des heures', () => {
    const delay = screenSaverDelay(2 * ONE_HOUR)

    expect(delay).toBe(`2${NO_BREAK_SPACE}heures`)
  })

  it('dit en minutes ce qui dépasse l’heure sans tomber juste', () => {
    const delay = screenSaverDelay(ONE_HOUR + 30 * ONE_MINUTE)

    expect(delay).toBe('90 minutes')
  })

  it('dit en minutes ce qui est plus court qu’une heure', () => {
    const delay = screenSaverDelay(20 * ONE_MINUTE)

    expect(delay).toBe('20 minutes')
  })

  it('arrondit à la minute un délai qui tombe entre deux', () => {
    const delay = screenSaverDelay(90)

    expect(delay).toBe('2 minutes')
  })
})

describe('focusDuration', () => {
  it('garde une décimale à un focus plus court qu’une milliseconde', () => {
    expect(focusDuration(340)).toBe(`0,3${NARROW_NO_BREAK_SPACE}ms`)
  })

  it('garde cette décimale tant que le focus reste sous dix millisecondes', () => {
    expect(focusDuration(4.2 * ONE_MILLISECOND)).toBe(
      `4,2${NARROW_NO_BREAK_SPACE}ms`
    )
  })

  it('arrondit à la milliseconde au-delà, où la décimale ne dit plus rien', () => {
    expect(focusDuration(12.4 * ONE_MILLISECOND)).toBe(
      `12${NARROW_NO_BREAK_SPACE}ms`
    )
  })

  it('reste en millisecondes quand le focus dure une seconde entière', () => {
    expect(focusDuration(2000 * ONE_MILLISECOND)).toBe(
      `2${NARROW_NO_BREAK_SPACE}000${NARROW_NO_BREAK_SPACE}ms`
    )
  })
})
