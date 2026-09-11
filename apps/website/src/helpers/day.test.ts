import { describe, expect, it } from 'vitest'
import { writtenDay } from '@/helpers/day'

describe('un jour écrit', () => {
  it('se lit en français', () => {
    expect(writtenDay({ day: '2026-08-31', locale: 'fr' })).toBe('31 août 2026')
  })

  it('se lit en anglais', () => {
    expect(writtenDay({ day: '2026-08-31', locale: 'en' })).toBe(
      'August 31, 2026'
    )
  })

  it('se lit en espagnol', () => {
    expect(writtenDay({ day: '2026-08-31', locale: 'es' })).toBe(
      '31 de agosto de 2026'
    )
  })

  it('ne perd pas un jour au premier du mois', () => {
    expect(writtenDay({ day: '2026-09-01', locale: 'fr' })).toBe(
      '1 septembre 2026'
    )
  })
})
