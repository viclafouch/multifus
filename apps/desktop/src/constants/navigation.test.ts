import { describe, expect, it } from 'vitest'
import { i18n } from '@lingui/core'
import { NAV_ITEMS } from '@/constants/navigation'
import TRAY_SOURCE from '../../src-tauri/src/app/tray.rs?raw'

const SCREEN_ID = /Screen::\w+ => "\w+"/gu

const QUOTED = /"(\w+)"/u

const RUST_SCREENS = (TRAY_SOURCE.match(SCREEN_ID) ?? []).map((line) => {
  return QUOTED.exec(line)?.[1] ?? ''
})

describe('la barre de gauche', () => {
  it('répond aux écrans que la barre système nomme, dans le même ordre', () => {
    const rail = NAV_ITEMS.map(({ name }: { readonly name: string }) => {
      return name
    })

    expect(rail).toStrictEqual(RUST_SCREENS)
  })

  it('donne un nom français à chacun', () => {
    const named: string[] = []

    for (const item of NAV_ITEMS) {
      named.push(i18n._(item.label))
    }

    expect(named).toStrictEqual([
      'Personnages',
      'Raccourcis',
      'Réponses rapides',
      'AutoFocus',
      'Déplacement rapide',
      'Roue des personnages',
      'Tableau des runes',
      'Messages privés',
      'Paramètres',
      'À propos'
    ])
  })
})
