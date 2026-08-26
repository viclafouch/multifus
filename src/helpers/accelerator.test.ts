import { describe, expect, it } from 'vitest'
import { IS_APPLE } from '@/constants/keyboard'
import {
  acceleratorParts,
  capture,
  heldModifiers,
  keyLabel
} from '@/helpers/accelerator'

const NOTHING_HELD = {
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false
}

describe('capture', () => {
  it('rend la combinaison quand une touche est frappée avec un modificateur', () => {
    const press = {
      ...NOTHING_HELD,
      code: 'ArrowRight',
      ctrlKey: true,
      shiftKey: true
    }

    const result = capture(press)

    expect(result).toStrictEqual({
      status: 'captured',
      accelerator: 'Control+Shift+ArrowRight'
    })
  })

  it('écrit les modificateurs dans l’ordre de la table et non de l’appui', () => {
    const press = {
      code: 'KeyA',
      ctrlKey: true,
      altKey: true,
      shiftKey: true,
      metaKey: true
    }

    const result = capture(press)

    expect(result).toStrictEqual({
      status: 'captured',
      accelerator: 'Control+Alt+Shift+Super+KeyA'
    })
  })

  it('attend la suite quand l’appui n’est que des modificateurs', () => {
    const press = { ...NOTHING_HELD, code: 'ShiftLeft', shiftKey: true }

    const result = capture(press)

    expect(result).toStrictEqual({ status: 'waiting' })
  })

  it('refuse une touche frappée sans modificateur', () => {
    const result = capture({ ...NOTHING_HELD, code: 'KeyA' })

    expect(result).toStrictEqual({ status: 'rejected', reason: 'noModifier' })
  })

  it('refuse la combinaison de collage, qu’une quickReply déclencherait elle-même', () => {
    const press = { ...NOTHING_HELD, code: 'KeyV', ctrlKey: true }

    const result = capture(press)

    expect(result).toStrictEqual({
      status: 'rejected',
      reason: 'pasteCombination'
    })
  })

  it('laisse passer la touche du collage sous un autre modificateur', () => {
    const press = { ...NOTHING_HELD, code: 'KeyV', ctrlKey: true, altKey: true }

    const result = capture(press)

    expect(result).toStrictEqual({
      status: 'captured',
      accelerator: 'Control+Alt+KeyV'
    })
  })

  it('refuse une touche que le parseur du greffon ne connaît pas', () => {
    const press = { ...NOTHING_HELD, code: 'ContextMenu', ctrlKey: true }

    const result = capture(press)

    expect(result).toStrictEqual({
      status: 'rejected',
      reason: 'unsupportedKey'
    })
  })
})

describe('heldModifiers', () => {
  it('rend les modificateurs tenus dans l’ordre où ils s’écrivent', () => {
    const press = {
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: true
    }

    const held = heldModifiers(press)

    expect(held).toStrictEqual(['Control', 'Shift', 'Super'])
  })

  it('ne rend rien quand aucun modificateur n’est tenu', () => {
    const held = heldModifiers(NOTHING_HELD)

    expect(held).toStrictEqual([])
  })
})

describe('acceleratorParts', () => {
  it('résout les alias des modificateurs et des flèches', () => {
    const parts = acceleratorParts('Ctrl+Shift+Right')

    expect(parts).toStrictEqual(['Control', 'Shift', 'ArrowRight'])
  })

  it('remet les modificateurs devant la touche', () => {
    const parts = acceleratorParts('KeyA+Shift+Control')

    expect(parts).toStrictEqual(['Control', 'Shift', 'KeyA'])
  })

  it('laisse tomber les espaces autour des parties', () => {
    const parts = acceleratorParts(' Cmd + KeyA ')

    expect(parts).toStrictEqual(['Super', 'KeyA'])
  })

  it('rend la seule touche d’une combinaison sans modificateur', () => {
    const parts = acceleratorParts('KeyA')

    expect(parts).toStrictEqual(['KeyA'])
  })
})

describe('keyLabel', () => {
  it('lit un clavier qui n’est pas un clavier Apple, sous jsdom', () => {
    expect(IS_APPLE).toBe(false)
  })

  it('dessine une flèche à la place de son nom', () => {
    expect(keyLabel('ArrowRight')).toBe('→')
  })

  it('dessine Control dans le dialecte de ce clavier', () => {
    expect(keyLabel('Control')).toBe('Ctrl')
  })

  it('dessine Shift dans le dialecte de ce clavier', () => {
    expect(keyLabel('Shift')).toBe('Maj')
  })

  it('dessine Super dans le dialecte de ce clavier', () => {
    expect(keyLabel('Super')).toBe('Win')
  })

  it('rend la lettre d’une touche alphabétique', () => {
    expect(keyLabel('KeyA')).toBe('A')
  })

  it('rend le chiffre d’une touche numérique', () => {
    expect(keyLabel('Digit5')).toBe('5')
  })

  it('nomme le pavé numérique devant son chiffre', () => {
    expect(keyLabel('Numpad7')).toBe('Pavé 7')
  })

  it('lit la table avant de lire le préfixe', () => {
    expect(keyLabel('NumpadAdd')).toBe('Pavé +')
  })

  it('rend un token inconnu tel quel', () => {
    expect(keyLabel('F13')).toBe('F13')
  })
})
