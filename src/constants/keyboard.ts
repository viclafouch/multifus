/**
 * The keyboard vocabulary, in the exact spelling the global shortcut plugin
 * parses, plus the label each token is drawn with.
 */

/** The modifiers, in the order they are written and drawn. */
export const MODIFIERS = [
  'Control',
  'Alt',
  'Shift',
  'Super'
] as const satisfies readonly string[]

export type Modifier = (typeof MODIFIERS)[number]

/** Why a key press did not make a combination. */
export type CaptureRejection = 'noModifier' | 'unsupportedKey'

/** A key the parser of the plugin accepts, spelled as `KeyboardEvent.code`. */
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

/**
 * The combinations proposed at the first launch are written with the short arrow
 * names, `Right` rather than `ArrowRight`, and the plugin takes both.
 */
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

/** Whether the keyboard in front of the user has a Command key on it. */
export const IS_APPLE = navigator.userAgent.includes('Mac')

/** The tokens whose label is not their own name, this keyboard being read. */
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
