import { describe, expect, it } from 'vitest'
import { runeWeight } from '@/helpers/rune'

describe('le poids d’une rune', () => {
  it('s’écrit avec la virgule française', () => {
    expect(runeWeight(0.25)).toBe('0,25')
  })

  it('garde les entiers entiers', () => {
    expect(runeWeight(100)).toBe('100')
  })

  it('coupe au centième, une rune ne pesant jamais plus fin', () => {
    expect(runeWeight(0.256)).toBe('0,26')
  })
})
