import { describe, expect, it } from 'vitest'
import { gaugeValue } from '@/helpers/gauge'

describe('gaugeValue', () => {
  it('prend le nombre tel quel', () => {
    expect(gaugeValue(400, 280)).toBe(400)
  })

  it('prend le premier curseur quand la jauge en donne une liste', () => {
    expect(gaugeValue([420], 280)).toBe(420)
  })

  it('garde la valeur du moment quand la liste arrive vide', () => {
    expect(gaugeValue([], 280)).toBe(280)
  })
})
