import { describe, expect, it } from 'vitest'
import { i18n } from '@lingui/core'
import { RUNE_FAMILY_IDS, RUNE_STAT_IDS } from '@multifus/runes'
import {
  RUNE_FAMILY_NAMES,
  RUNE_STAT_NAMES,
  TABLE_DRAWN_WIDTH
} from '@/constants/runes'
import SETTINGS_SOURCE from '../../src-tauri/src/config/settings.rs?raw'

const rustCount = (source: string, name: string) => {
  const found = new RegExp(`const ${name}: u32 = (\\d+);`, 'u').exec(source)

  if (found === null) {
    throw new Error(`Aucune constante nommée ${name}`)
  }

  return Number(found[1])
}

const STAT_NAMES = RUNE_STAT_IDS.map((stat) => {
  return i18n._(RUNE_STAT_NAMES[stat])
})

describe('le tableau des poids de runes', () => {
  it('est dessiné pour la plus étroite des largeurs que la jauge donne', () => {
    expect(TABLE_DRAWN_WIDTH).toBe(
      rustCount(SETTINGS_SOURCE, 'RUNE_TABLE_NARROWEST')
    )
  })

  it('donne à chaque famille le nom que le tableau écrit', () => {
    const named = RUNE_FAMILY_IDS.map((family) => {
      return i18n._(RUNE_FAMILY_NAMES[family])
    })

    expect(named).toStrictEqual([
      'Les lourdes',
      'Dommages',
      'Résistances',
      'Secondaires',
      'Les légères'
    ])
  })

  it('nomme chaque stat une seule fois', () => {
    expect(new Set(STAT_NAMES).size).toBe(STAT_NAMES.length)
  })

  it('écrit les stats du jeu comme le jeu les écrit', () => {
    expect(STAT_NAMES).toStrictEqual([
      'PA',
      'PM',
      'PO',
      'Invocation',
      'Critique',
      'Soin',
      'Renvoi de dommages',
      'Dommages',
      'Dommages piège',
      '% piège',
      '% dommages',
      '% résistance',
      'Résistance fixe',
      'Sagesse',
      'Prospection',
      'Chasse',
      'Ine / Fo / Age / Cha',
      'Initiative',
      'Vitalité',
      'Pods'
    ])
  })
})
