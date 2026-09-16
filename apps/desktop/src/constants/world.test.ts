import { describe, expect, it } from 'vitest'
import { i18n } from '@lingui/core'
import { CLEARING, MAP_NAMES, MAPS, MAP_SCENES } from '@/constants/world'
import TRAY_SOURCE from '../../src-tauri/src/app/tray.rs?raw'

const SCREEN_ID = /Screen::\w+ => "\w+"/gu

const QUOTED = /"(\w+)"/u

const RUST_SCREENS = (TRAY_SOURCE.match(SCREEN_ID) ?? []).map((line) => {
  return QUOTED.exec(line)?.[1] ?? ''
})

describe('the world', () => {
  it('carries the maps the tray names, in the same order', () => {
    expect([...MAPS]).toStrictEqual(RUST_SCREENS)
  })

  it('names and decorates the home like the other maps', () => {
    const named = [CLEARING, ...MAPS]

    expect(Object.keys(MAP_NAMES)).toStrictEqual(named)
    expect(Object.keys(MAP_SCENES)).toStrictEqual(named)
  })

  it('gives a French name to each map', () => {
    const named: string[] = []

    for (const label of Object.values(MAP_NAMES)) {
      named.push(i18n._(label))
    }

    expect(named).toStrictEqual([
      'Multifus',
      'Personnages',
      'Raccourcis',
      'Textes rapides',
      'AutoFocus',
      'Déplacement rapide',
      'Tableau des runes',
      'Messages privés',
      'Paramètres',
      'À propos'
    ])
  })
})
