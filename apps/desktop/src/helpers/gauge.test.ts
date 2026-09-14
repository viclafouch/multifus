import { describe, expect, it } from 'vitest'
import { gaugeValue } from '@/helpers/gauge'

describe('gaugeValue', () => {
  it('takes the number as it is', () => {
    expect(gaugeValue(400, 280)).toBe(400)
  })

  it('takes the first cursor when the gauge gives a list of them', () => {
    expect(gaugeValue([420], 280)).toBe(420)
  })

  it('keeps the current value when the list comes empty', () => {
    expect(gaugeValue([], 280)).toBe(280)
  })
})
