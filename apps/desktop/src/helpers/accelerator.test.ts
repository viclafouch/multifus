import { describe, expect, it } from 'vitest'
import type { KeyLabels } from '@/@types/system'
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
  it('returns the combination when a key is hit with a modifier', () => {
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

  it('writes the modifiers in the order of the table and not of the press', () => {
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

  it('waits for the rest when the press is only modifiers', () => {
    const press = { ...NOTHING_HELD, code: 'ShiftLeft', shiftKey: true }

    const result = capture(press)

    expect(result).toStrictEqual({ status: 'waiting' })
  })

  it('refuses a key hit without a modifier', () => {
    const result = capture({ ...NOTHING_HELD, code: 'KeyA' })

    expect(result).toStrictEqual({ status: 'rejected', reason: 'noModifier' })
  })

  it('takes a function key alone, anywhere but on a Mac', () => {
    const result = capture({ ...NOTHING_HELD, code: 'F5' })

    expect(result).toStrictEqual({ status: 'captured', accelerator: 'F5' })
  })

  it('takes a function key under a modifier like any other', () => {
    const result = capture({ ...NOTHING_HELD, code: 'F5', altKey: true })

    expect(result).toStrictEqual({ status: 'captured', accelerator: 'Alt+F5' })
  })

  it('refuses the paste combination, which a quickText would trigger by itself', () => {
    const press = { ...NOTHING_HELD, code: 'KeyV', ctrlKey: true }

    const result = capture(press)

    expect(result).toStrictEqual({
      status: 'rejected',
      reason: 'pasteCombination'
    })
  })

  it('lets through the paste key under another modifier', () => {
    const press = { ...NOTHING_HELD, code: 'KeyV', ctrlKey: true, altKey: true }

    const result = capture(press)

    expect(result).toStrictEqual({
      status: 'captured',
      accelerator: 'Control+Alt+KeyV'
    })
  })

  it('refuses a key the parser of the plugin does not know', () => {
    const press = { ...NOTHING_HELD, code: 'ContextMenu', ctrlKey: true }

    const result = capture(press)

    expect(result).toStrictEqual({
      status: 'rejected',
      reason: 'unsupportedKey'
    })
  })
})

describe('heldModifiers', () => {
  it('returns the held modifiers in the order they are written', () => {
    const press = {
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: true
    }

    const held = heldModifiers(press)

    expect(held).toStrictEqual(['Control', 'Shift', 'Super'])
  })

  it('returns nothing when no modifier is held', () => {
    const held = heldModifiers(NOTHING_HELD)

    expect(held).toStrictEqual([])
  })
})

describe('acceleratorParts', () => {
  it('resolves the aliases of the modifiers and of the arrows', () => {
    const parts = acceleratorParts('Ctrl+Shift+Right')

    expect(parts).toStrictEqual(['Control', 'Shift', 'ArrowRight'])
  })

  it('puts the modifiers back in front of the key', () => {
    const parts = acceleratorParts('KeyA+Shift+Control')

    expect(parts).toStrictEqual(['Control', 'Shift', 'KeyA'])
  })

  it('drops the spaces around the parts', () => {
    const parts = acceleratorParts(' Cmd + KeyA ')

    expect(parts).toStrictEqual(['Super', 'KeyA'])
  })

  it('returns the only key of a combination without a modifier', () => {
    const parts = acceleratorParts('KeyA')

    expect(parts).toStrictEqual(['KeyA'])
  })
})

const AZERTY: KeyLabels = {
  KeyA: 'Q',
  KeyQ: 'A',
  KeyW: 'Z',
  KeyZ: 'W',
  Semicolon: 'M'
}

describe('keyLabel', () => {
  it('reads a keyboard that is not an Apple keyboard, under jsdom', () => {
    expect(IS_APPLE).toBe(false)
  })

  it('draws an arrow instead of its name', () => {
    expect(keyLabel('ArrowRight')).toBe('→')
  })

  it('draws Control in the dialect of that keyboard', () => {
    expect(keyLabel('Control')).toBe('Ctrl')
  })

  it('draws Shift in the dialect of that keyboard', () => {
    expect(keyLabel('Shift')).toBe('Maj')
  })

  it('draws Super in the dialect of that keyboard', () => {
    expect(keyLabel('Super')).toBe('Win')
  })

  it('returns the letter of an alphabetic key', () => {
    expect(keyLabel('KeyA')).toBe('A')
  })

  it('returns the digit of a numeric key', () => {
    expect(keyLabel('Digit5')).toBe('5')
  })

  it('names the numeric keypad in front of its digit', () => {
    expect(keyLabel('Numpad7')).toBe('Pavé 7')
  })

  it('reads the table before reading the prefix', () => {
    expect(keyLabel('NumpadAdd')).toBe('Pavé +')
  })

  it('returns an unknown token as it is', () => {
    expect(keyLabel('F13')).toBe('F13')
  })

  it('writes the letter of the user keyboard before its own', () => {
    expect(keyLabel('KeyW', AZERTY)).toBe('Z')
    expect(keyLabel('KeyA', AZERTY)).toBe('Q')
    expect(keyLabel('Semicolon', AZERTY)).toBe('M')
  })

  it('keeps its letters for a key the keyboard does not name', () => {
    expect(keyLabel('KeyB', AZERTY)).toBe('B')
    expect(keyLabel('ArrowRight', AZERTY)).toBe('→')
  })

  it('keeps its letters when the system could say nothing', () => {
    expect(keyLabel('KeyW', {})).toBe('W')
  })
})
