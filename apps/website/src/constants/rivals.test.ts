import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/constants/languages'
import {
  HALF_NOTES,
  MARK_NAMES,
  RIVAL_IDS,
  RIVALS,
  SURVEYED_ON,
  TRAIT_IDS,
  TRAITS
} from '@/constants/rivals'
import { SPEAKERS } from '@/lib/i18n'
import { alphabetical } from '@/test-order'

const DAY_SHAPE = /^\d{4}-\d{2}-\d{2}$/u

const LOST_BY_MULTIFUS = 2

describe('the table of the comparison', () => {
  it('holds no more than five rivals', () => {
    expect(RIVAL_IDS.length).toBeLessThanOrEqual(5)
  })

  it('lists exactly the rivals the table carries', () => {
    expect(Object.keys(RIVALS).toSorted(alphabetical)).toStrictEqual(
      [...RIVAL_IDS].toSorted(alphabetical)
    )
  })

  it.each(RIVAL_IDS)('names %s and leads to its code', (rival) => {
    const { name, code } = RIVALS[rival]

    expect(name).not.toBe('')
    expect(code.startsWith('https://github.com/')).toBe(true)
  })

  it('does not name the same rival twice', () => {
    const names = RIVAL_IDS.map((rival) => {
      return RIVALS[rival].name
    })

    expect(new Set(names).size).toBe(names.length)
  })

  it('holds between ten and twelve rows', () => {
    expect(TRAIT_IDS.length).toBeGreaterThanOrEqual(10)
    expect(TRAIT_IDS.length).toBeLessThanOrEqual(12)
  })

  it('lists exactly the rows the table carries', () => {
    expect(Object.keys(TRAITS).toSorted(alphabetical)).toStrictEqual(
      [...TRAIT_IDS].toSorted(alphabetical)
    )
  })

  it.each(TRAIT_IDS)('gives a cell to each rival on %s', (trait) => {
    for (const rival of RIVAL_IDS) {
      expect(TRAITS[trait].theirs[rival]).toBeDefined()
    }
  })

  it('leaves lost the two rows the page announces', () => {
    const lost = TRAIT_IDS.filter((trait) => {
      return TRAITS[trait].mine === 'no'
    })

    expect(lost).toHaveLength(LOST_BY_MULTIFUS)
  })

  it.each(RIVAL_IDS)('leaves at least one row to %s', (rival) => {
    const won = TRAIT_IDS.filter((trait) => {
      return TRAITS[trait].theirs[rival] === 'yes'
    })

    expect(won.length).toBeGreaterThan(0)
  })

  it('gives a note to each half cell, and to them alone', () => {
    const halves = TRAIT_IDS.flatMap((trait) => {
      return RIVAL_IDS.filter((rival) => {
        return TRAITS[trait].theirs[rival] === 'half'
      }).map((rival) => {
        return `${trait}-${rival}`
      })
    })
    const noted = HALF_NOTES.map((note) => {
      return `${note.trait}-${note.rival}`
    })

    expect(noted.toSorted(alphabetical)).toStrictEqual(
      halves.toSorted(alphabetical)
    )
  })

  it.each(LANGUAGES)('writes each half note in %s', (language) => {
    for (const note of HALF_NOTES) {
      expect(SPEAKERS[language]._(note.line)).not.toBe('')
    }
  })

  it('dates its record', () => {
    expect(SURVEYED_ON).toMatch(DAY_SHAPE)
  })

  it('says each cell in French', () => {
    expect(SPEAKERS.fr._(MARK_NAMES.yes)).toBe('oui')
    expect(SPEAKERS.fr._(MARK_NAMES.half)).toBe('à moitié')
    expect(SPEAKERS.fr._(MARK_NAMES.no)).toBe('non')
  })

  it.each(LANGUAGES)('leaves no cell silent in %s', (language) => {
    for (const name of Object.values(MARK_NAMES)) {
      expect(SPEAKERS[language]._(name)).not.toBe('')
    }
  })
})
