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

type KeyPress = {
  readonly code: string
  readonly ctrlKey: boolean
  readonly altKey: boolean
  readonly shiftKey: boolean
  readonly metaKey: boolean
}

export const capture = (event: KeyPress): CaptureResult => {
  if (isModifierCode(event.code)) {
    return { status: 'waiting' }
  }

  if (!KEYS.has(event.code)) {
    return { status: 'rejected', reason: 'unsupportedKey' }
  }

  const modifiers = heldModifiers(event)

  if (modifiers.length === 0) {
    return { status: 'rejected', reason: 'noModifier' }
  }

  const accelerator = [...modifiers, event.code].join('+')

  if (accelerator === PASTE_COMBINATION) {
    return { status: 'rejected', reason: 'pasteCombination' }
  }

  return { status: 'captured', accelerator }
}

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

const isModifier = (token: string): token is Modifier => {
  return (MODIFIERS as readonly string[]).includes(token)
}

const isModifierCode = (code: string) => {
  return (
    code.startsWith('Control') ||
    code.startsWith('Shift') ||
    code.startsWith('Alt') ||
    code.startsWith('Meta')
  )
}
