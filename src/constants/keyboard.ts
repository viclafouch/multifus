export const MODIFIERS = [
  'Control',
  'Alt',
  'Shift',
  'Super'
] as const satisfies readonly string[]

export type Modifier = (typeof MODIFIERS)[number]

export type CaptureRejection =
  | 'noModifier'
  | 'pasteCombination'
  | 'unsupportedKey'

export const KEYS: ReadonlySet<string> = new Set([
  ...Array.from({ length: 26 }, (_, index) => {
    return `Key${String.fromCodePoint(65 + index)}`
  }),
  ...Array.from({ length: 10 }, (_, index) => {
    return `Digit${index}`
  }),
  ...Array.from({ length: 24 }, (_, index) => {
    return `F${index + 1}`
  }),
  ...Array.from({ length: 10 }, (_, index) => {
    return `Numpad${index}`
  }),
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'Backquote',
  'Backslash',
  'Backspace',
  'BracketLeft',
  'BracketRight',
  'CapsLock',
  'Comma',
  'Delete',
  'End',
  'Enter',
  'Equal',
  'Escape',
  'Home',
  'Insert',
  'Minus',
  'NumLock',
  'NumpadAdd',
  'NumpadDecimal',
  'NumpadDivide',
  'NumpadEnter',
  'NumpadEqual',
  'NumpadMultiply',
  'NumpadSubtract',
  'PageDown',
  'PageUp',
  'Pause',
  'Period',
  'PrintScreen',
  'Quote',
  'ScrollLock',
  'Semicolon',
  'Slash',
  'Space',
  'Tab'
])

export const ALIASES = new Map<string, string>([
  ['Cmd', 'Super'],
  ['Command', 'Super'],
  ['Ctrl', 'Control'],
  ['Down', 'ArrowDown'],
  ['Esc', 'Escape'],
  ['Left', 'ArrowLeft'],
  ['Meta', 'Super'],
  ['Option', 'Alt'],
  ['Right', 'ArrowRight'],
  ['Up', 'ArrowUp']
])

export const IS_APPLE = navigator.userAgent.includes('Mac')

export const PASTE_COMBINATION = IS_APPLE ? 'Super+KeyV' : 'Control+KeyV'

export const KEY_LABELS = new Map<string, string>([
  ['Alt', IS_APPLE ? '⌥' : 'Alt'],
  ['ArrowDown', '↓'],
  ['ArrowLeft', '←'],
  ['ArrowRight', '→'],
  ['ArrowUp', '↑'],
  ['Backquote', '`'],
  ['Backslash', '\\'],
  ['Backspace', '⌫'],
  ['BracketLeft', '['],
  ['BracketRight', ']'],
  ['CapsLock', 'Verr. maj'],
  ['Comma', ','],
  ['Control', IS_APPLE ? '⌃' : 'Ctrl'],
  ['Delete', 'Suppr'],
  ['End', 'Fin'],
  ['Enter', '↵'],
  ['Equal', '='],
  ['Escape', 'Échap'],
  ['Home', 'Origine'],
  ['Insert', 'Inser'],
  ['Minus', '-'],
  ['NumLock', 'Verr. num'],
  ['NumpadAdd', 'Pavé +'],
  ['NumpadDecimal', 'Pavé ,'],
  ['NumpadDivide', 'Pavé /'],
  ['NumpadEnter', 'Pavé ↵'],
  ['NumpadEqual', 'Pavé ='],
  ['NumpadMultiply', 'Pavé ×'],
  ['NumpadSubtract', 'Pavé -'],
  ['PageDown', 'Page ↓'],
  ['PageUp', 'Page ↑'],
  ['Pause', 'Pause'],
  ['Period', '.'],
  ['PrintScreen', 'Impr. écran'],
  ['Quote', '’'],
  ['ScrollLock', 'Arrêt défil.'],
  ['Semicolon', ';'],
  ['Shift', IS_APPLE ? '⇧' : 'Maj'],
  ['Slash', '/'],
  ['Space', 'Espace'],
  ['Super', IS_APPLE ? '⌘' : 'Win'],
  ['Tab', '⇥']
])
