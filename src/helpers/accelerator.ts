/**
 * Reading a key combination off the keyboard, and drawing it. The vocabulary
 * itself, tokens and labels, is in `constants/keyboard.ts`.
 */

import type { CaptureRejection, Modifier } from '@/constants/keyboard'
import {
  ALIASES,
  KEY_LABELS,
  KEYS,
  MODIFIERS,
  PASTE_COMBINATION
} from '@/constants/keyboard'

export type CaptureResult =
  | { readonly status: 'captured'; readonly accelerator: string }
  | { readonly status: 'rejected'; readonly reason: CaptureRejection }
  | { readonly status: 'waiting' }

/** What a key press carries, which is all either function below reads. */
type KeyPress = {
  readonly code: string
  readonly ctrlKey: boolean
  readonly altKey: boolean
  readonly shiftKey: boolean
  readonly metaKey: boolean
}

/**
 * Reads one key press. A press that is nothing but modifiers is somebody halfway
 * through a combination, hence the third answer: the field keeps waiting.
 */
export const capture = (event: KeyPress): CaptureResult => {
  if (isModifierCode(event.code)) {
    return { status: 'waiting' }
  }

  // A key the parser does not know is turned down here rather than at
  // registration time, when it is too late to say so nicely.
  if (!KEYS.has(event.code)) {
    return { status: 'rejected', reason: 'unsupportedKey' }
  }

  const modifiers = heldModifiers(event)

  // A bare key would be swallowed everywhere on the desktop, in every
  // application, which is far worse than refusing it here.
  if (modifiers.length === 0) {
    return { status: 'rejected', reason: 'noModifier' }
  }

  const accelerator = [...modifiers, event.code].join('+')

  // A quick reply laid on it would fire on the paste it lays down itself, and an
  // action laid on it would eat the paste of every application. See ADR 0012.
  if (accelerator === PASTE_COMBINATION) {
    return { status: 'rejected', reason: 'pasteCombination' }
  }

  return { status: 'captured', accelerator }
}

/**
 * The modifiers held down right now, in the order they are written and drawn,
 * which is also all the field shows while it is still waiting for a key.
 */
export const heldModifiers = (
  event: Omit<KeyPress, 'code'>
): readonly string[] => {
  const down = {
    Control: event.ctrlKey,
    Alt: event.altKey,
    Shift: event.shiftKey,
    Super: event.metaKey
  } satisfies Record<Modifier, boolean>

  return MODIFIERS.filter((modifier) => {
    return down[modifier]
  })
}

/**
 * Splits a stored combination into its parts, modifiers first, resolving the
 * aliases so that `Right` and `ArrowRight` draw identically.
 */
export const acceleratorParts = (accelerator: string): readonly string[] => {
  const parts = accelerator
    .split('+')
    .map((part) => {
      const token = part.trim()

      return ALIASES.get(token) ?? token
    })
    .filter((token) => {
      return token.length > 0
    })

  const modifiers = MODIFIERS.filter((modifier) => {
    return parts.includes(modifier)
  })

  const keys = parts.filter((token) => {
    return !isModifier(token)
  })

  return [...modifiers, ...keys]
}

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

/** Whether a token is one of the four modifiers. */
const isModifier = (token: string): token is Modifier => {
  return (MODIFIERS as readonly string[]).includes(token)
}

/** The physical keys that are only ever half of a combination. */
const isModifierCode = (code: string) => {
  return (
    code.startsWith('Control') ||
    code.startsWith('Shift') ||
    code.startsWith('Alt') ||
    code.startsWith('Meta')
  )
}
