import { describe, expect, it } from 'vitest'
import { CLASSES, CLASS_PORTRAITS } from '@/constants/classes'
import { portraitFor } from '@/helpers/portrait'

describe('portraitFor', () => {
  it('gives the portrait of a class crossed with a sex', () => {
    expect(portraitFor({ class: 'iop', gender: 'male' })).toBe(
      CLASS_PORTRAITS.iop.male
    )
    expect(portraitFor({ class: 'iop', gender: 'female' })).toBe(
      CLASS_PORTRAITS.iop.female
    )
  })

  it('gives nothing until both answers are there', () => {
    expect(portraitFor({ class: 'iop', gender: null })).toBeNull()
    expect(portraitFor({ class: null, gender: 'male' })).toBeNull()
    expect(portraitFor({ class: null, gender: null })).toBeNull()
  })

  it('carries a portrait for the twelve classes in both sexes', () => {
    const portraits = CLASSES.flatMap((characterClass) => {
      return [
        portraitFor({ class: characterClass, gender: 'male' }),
        portraitFor({ class: characterClass, gender: 'female' })
      ]
    })

    expect(portraits.filter(Boolean)).toHaveLength(24)
    expect(new Set(portraits).size).toBe(24)
  })
})
