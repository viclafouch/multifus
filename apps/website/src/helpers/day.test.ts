import { describe, expect, it } from 'vitest'
import { formatDate } from '@/helpers/day'

describe('a written day', () => {
  it('reads in French', () => {
    expect(formatDate({ day: '2026-08-31', locale: 'fr' })).toBe('31 août 2026')
  })

  it('reads in English', () => {
    expect(formatDate({ day: '2026-08-31', locale: 'en' })).toBe(
      'August 31, 2026'
    )
  })

  it('reads in Spanish', () => {
    expect(formatDate({ day: '2026-08-31', locale: 'es' })).toBe(
      '31 de agosto de 2026'
    )
  })

  it('does not lose a day on the first of the month', () => {
    expect(formatDate({ day: '2026-09-01', locale: 'fr' })).toBe(
      '1 septembre 2026'
    )
  })
})
