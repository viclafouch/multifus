import { describe, expect, it } from 'vitest'
import { i18n } from '@lingui/core'
import { CLEARING, MAP_NAMES, MAPS, MAP_SCENES } from '@/constants/world'
import TRAY_SOURCE from '../../src-tauri/src/app/tray.rs?raw'

const SCREEN_ID = /Screen::\w+ => "\w+"/gu

const QUOTED = /"(\w+)"/u

const RUST_SCREENS = (TRAY_SOURCE.match(SCREEN_ID) ?? []).map((line) => {
  return QUOTED.exec(line)?.[1] ?? ''
})

describe('le monde', () => {
  it('porte les maps que la barre système nomme, dans le même ordre', () => {
    expect([...MAPS]).toStrictEqual(RUST_SCREENS)
  })

  it('nomme et décore l’accueil comme les autres maps', () => {
    const named = [CLEARING, ...MAPS]

    expect(Object.keys(MAP_NAMES)).toStrictEqual(named)
    expect(Object.keys(MAP_SCENES)).toStrictEqual(named)
  })

  it('donne un nom français à chaque map', () => {
    const named: string[] = []

    for (const label of Object.values(MAP_NAMES)) {
      named.push(i18n._(label))
    }

    expect(named).toStrictEqual([
      'Multifus',
      'Personnages',
      'Raccourcis',
      'Réponses rapides',
      'AutoFocus',
      'Déplacement rapide',
      'La roue des personnages',
      'Tableau des runes',
      'Messages privés',
      'Paramètres',
      'À propos'
    ])
  })
})
