import { describe, expect, it } from 'vitest'
import { screenSaverDelay } from '@/helpers/format'

const NO_BREAK_SPACE = '\u00A0'

const ONE_MINUTE = 60
const ONE_HOUR = 3600

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
