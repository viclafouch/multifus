import { describe, expect, it } from 'vitest'
import { IS_APPLE } from '@/constants/keyboard'
import {
  acceleratorParts,
  capture,
  heldModifiers,
  keyLabel
} from '@/helpers/accelerator'

/** No modifier held, which each press below turns on one at a time. */
const NOTHING_HELD = {
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false
}

describe('capture', () => {
  it('rend la combinaison quand une touche est frappée avec un modificateur', () => {
    // #given
    const press = {
      ...NOTHING_HELD,
      code: 'ArrowRight',
      ctrlKey: true,
      shiftKey: true
    }

    // #when
    const result = capture(press)

    // #then
    expect(result).toStrictEqual({
      status: 'captured',
      accelerator: 'Control+Shift+ArrowRight'
    })
  })

  it('écrit les modificateurs dans l’ordre de la table et non de l’appui', () => {
    // #given
    const press = {
      code: 'KeyA',
      ctrlKey: true,
      altKey: true,
      shiftKey: true,
      metaKey: true
    }

    // #when
    const result = capture(press)

    // #then
    expect(result).toStrictEqual({
      status: 'captured',
      accelerator: 'Control+Alt+Shift+Super+KeyA'
    })
  })

  it('attend la suite quand l’appui n’est que des modificateurs', () => {
    // #given
    const press = { ...NOTHING_HELD, code: 'ShiftLeft', shiftKey: true }

    // #when
    const result = capture(press)

    // #then
    expect(result).toStrictEqual({ status: 'waiting' })
  })

  it('refuse une touche frappée sans modificateur', () => {
    // #when
    const result = capture({ ...NOTHING_HELD, code: 'KeyA' })

    // #then
    expect(result).toStrictEqual({ status: 'rejected', reason: 'noModifier' })
  })

  it('refuse la combinaison de collage, qu’une quickReply déclencherait elle-même', () => {
    // #given
    // Sous Node le clavier n’est pas un clavier Apple, donc c’est Control+V.
    const press = { ...NOTHING_HELD, code: 'KeyV', ctrlKey: true }

    // #when
    const result = capture(press)

    // #then
    expect(result).toStrictEqual({
      status: 'rejected',
      reason: 'pasteCombination'
    })
  })

  it('laisse passer la touche du collage sous un autre modificateur', () => {
    // #given
    const press = { ...NOTHING_HELD, code: 'KeyV', ctrlKey: true, altKey: true }

    // #when
    const result = capture(press)

    // #then
    expect(result).toStrictEqual({
      status: 'captured',
      accelerator: 'Control+Alt+KeyV'
    })
  })

  it('refuse une touche que le parseur du greffon ne connaît pas', () => {
    // #given
    const press = { ...NOTHING_HELD, code: 'ContextMenu', ctrlKey: true }

    // #when
    const result = capture(press)

    // #then
    expect(result).toStrictEqual({
      status: 'rejected',
      reason: 'unsupportedKey'
    })
  })
})

describe('heldModifiers', () => {
  it('rend les modificateurs tenus dans l’ordre où ils s’écrivent', () => {
    // #given
    const press = {
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: true
    }

    // #when
    const held = heldModifiers(press)

    // #then
    expect(held).toStrictEqual(['Control', 'Shift', 'Super'])
  })

  it('ne rend rien quand aucun modificateur n’est tenu', () => {
    // #when
    const held = heldModifiers(NOTHING_HELD)

    // #then
    expect(held).toStrictEqual([])
  })
})

describe('acceleratorParts', () => {
  it('résout les alias des modificateurs et des flèches', () => {
    // #when
    const parts = acceleratorParts('Ctrl+Shift+Right')

    // #then
    expect(parts).toStrictEqual(['Control', 'Shift', 'ArrowRight'])
  })

  it('remet les modificateurs devant la touche', () => {
    // #when
    const parts = acceleratorParts('KeyA+Shift+Control')

    // #then
    expect(parts).toStrictEqual(['Control', 'Shift', 'KeyA'])
  })

  it('laisse tomber les espaces autour des parties', () => {
    // #when
    const parts = acceleratorParts(' Cmd + KeyA ')

    // #then
    expect(parts).toStrictEqual(['Super', 'KeyA'])
  })

  it('rend la seule touche d’une combinaison sans modificateur', () => {
    // #when
    const parts = acceleratorParts('KeyA')

    // #then
    expect(parts).toStrictEqual(['KeyA'])
  })
})

describe('keyLabel', () => {
  it('lit un clavier qui n’est pas un clavier Apple, sous Node', () => {
    // #then
    expect(IS_APPLE).toBe(false)
  })

  it('dessine une flèche à la place de son nom', () => {
    // #then
    expect(keyLabel('ArrowRight')).toBe('→')
  })

  it('dessine Control dans le dialecte de ce clavier', () => {
    // #then
    expect(keyLabel('Control')).toBe('Ctrl')
  })

  it('dessine Shift dans le dialecte de ce clavier', () => {
    // #then
    expect(keyLabel('Shift')).toBe('Maj')
  })

  it('dessine Super dans le dialecte de ce clavier', () => {
    // #then
    expect(keyLabel('Super')).toBe('Win')
  })

  it('rend la lettre d’une touche alphabétique', () => {
    // #then
    expect(keyLabel('KeyA')).toBe('A')
  })

  it('rend le chiffre d’une touche numérique', () => {
    // #then
    expect(keyLabel('Digit5')).toBe('5')
  })

  it('nomme le pavé numérique devant son chiffre', () => {
    // #then
    expect(keyLabel('Numpad7')).toBe('Pavé 7')
  })

  it('lit la table avant de lire le préfixe', () => {
    // #then
    expect(keyLabel('NumpadAdd')).toBe('Pavé +')
  })

  it('rend un token inconnu tel quel', () => {
    // #then
    expect(keyLabel('F13')).toBe('F13')
  })
})
