/**
 * How a combination is drawn, the only half of the keyboard vocabulary that is a
 * user-facing word. The capture itself follows, see le lot C de l'étape 12.
 */

import { IS_APPLE } from '@/lib/accelerator'

/** At module scope, next to its only reader, rather than rebuilt on every call. */
const KEY_LABELS = new Map<string, string>([
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

/** The label a key token gets on this keyboard. */
export const keyLabel = (token: string) => {
  const known = KEY_LABELS.get(token)

  if (known !== undefined) {
    return known
  }

  if (token.startsWith('Key')) {
    return token.slice(3)
  }

  if (token.startsWith('Digit')) {
    return token.slice(5)
  }

  if (token.startsWith('Numpad')) {
    return `Pavé ${token.slice(6)}`
  }

  return token
}
