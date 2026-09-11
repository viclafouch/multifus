import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/constants/languages'
import {
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

describe('la table du comparatif', () => {
  it('ne tient pas plus de cinq concurrents', () => {
    expect(RIVAL_IDS.length).toBeLessThanOrEqual(5)
  })

  it('énumère exactement les concurrents que la table porte', () => {
    expect(Object.keys(RIVALS).toSorted(alphabetical)).toStrictEqual(
      [...RIVAL_IDS].toSorted(alphabetical)
    )
  })

  it.each(RIVAL_IDS)('nomme %s et mène à son code', (rival) => {
    const { name, code } = RIVALS[rival]

    expect(name).not.toBe('')
    expect(code.startsWith('https://github.com/')).toBe(true)
  })

  it('ne nomme pas deux fois le même concurrent', () => {
    const names = RIVAL_IDS.map((rival) => {
      return RIVALS[rival].name
    })

    expect(new Set(names).size).toBe(names.length)
  })

  it('tient entre dix et douze lignes', () => {
    expect(TRAIT_IDS.length).toBeGreaterThanOrEqual(10)
    expect(TRAIT_IDS.length).toBeLessThanOrEqual(12)
  })

  it('énumère exactement les lignes que la table porte', () => {
    expect(Object.keys(TRAITS).toSorted(alphabetical)).toStrictEqual(
      [...TRAIT_IDS].toSorted(alphabetical)
    )
  })

  it.each(TRAIT_IDS)('donne une case à chaque concurrent sur %s', (trait) => {
    for (const rival of RIVAL_IDS) {
      expect(TRAITS[trait].theirs[rival]).toBeDefined()
    }
  })

  it('laisse les deux lignes que la page annonce perdues', () => {
    const lost = TRAIT_IDS.filter((trait) => {
      return TRAITS[trait].mine === 'no'
    })

    expect(lost).toHaveLength(LOST_BY_MULTIFUS)
  })

  it.each(RIVAL_IDS)('laisse au moins une ligne à %s', (rival) => {
    const won = TRAIT_IDS.filter((trait) => {
      return TRAITS[trait].theirs[rival] === 'yes'
    })

    expect(won.length).toBeGreaterThan(0)
  })

  it('date son relevé', () => {
    expect(SURVEYED_ON).toMatch(DAY_SHAPE)
  })

  it('dit chaque case en français', () => {
    expect(SPEAKERS.fr._(MARK_NAMES.yes)).toBe('oui')
    expect(SPEAKERS.fr._(MARK_NAMES.half)).toBe('à moitié')
    expect(SPEAKERS.fr._(MARK_NAMES.no)).toBe('non')
  })

  it.each(LANGUAGES)('ne laisse aucune case muette en %s', (language) => {
    for (const name of Object.values(MARK_NAMES)) {
      expect(SPEAKERS[language]._(name)).not.toBe('')
    }
  })
})
