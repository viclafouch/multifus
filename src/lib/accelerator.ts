/**
 * Reading a key combination off the keyboard, in the exact vocabulary the global
 * shortcut plugin of step 7 will have to parse.
 *
 * Nothing here is a user-facing word. The plugin reads `Control+Shift+Right`, so
 * that is what is captured and that is what reaches the configuration file; how
 * it is drawn on screen is decided once, in the strings of the interface.
 *
 * Two rules keep this capture from producing something the plugin will refuse.
 * The key must be one of the names the parser accepts, which are the W3C
 * `KeyboardEvent.code` values it knows; anything else is turned down at capture
 * time rather than at registration time, when it is too late to say so nicely.
 * And a combination has to carry at least one modifier: registering a bare key
 * would swallow it everywhere on the desktop, in every application, which is a
 * far worse outcome than refusing it here.
 */

/** The modifiers, in the order they are written and drawn. */
const MODIFIERS = [
  'Control',
  'Alt',
  'Shift',
  'Super'
] as const satisfies readonly string[]

export type Modifier = (typeof MODIFIERS)[number]

/** A key the parser of the plugin accepts, spelled as `KeyboardEvent.code`. */
const KEYS: ReadonlySet<string> = new Set([
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
 * names, `Right` rather than `ArrowRight`. The plugin takes both; the interface
 * has to draw both the same way.
 */
const ALIASES = new Map<string, string>([
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

/** Whether a token is one of the four modifiers. */
export const isModifier = (token: string): token is Modifier => {
  return (MODIFIERS as readonly string[]).includes(token)
}

/**
 * Splits a stored combination into its parts, modifiers first, and resolves the
 * aliases so that `Control+Shift+Right` and `Control+Shift+ArrowRight` draw
 * identically.
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

/** Why a key press did not make a combination. */
export type CaptureRejection = 'noModifier' | 'unsupportedKey'

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
 * Reads one key press.
 *
 * A press that is nothing but modifiers is neither a combination nor a mistake,
 * it is somebody halfway through one, hence the third answer: the field keeps
 * waiting and shows what is held down.
 */
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

  return {
    status: 'captured',
    accelerator: [...modifiers, event.code].join('+')
  }
}

/**
 * The modifiers held down right now, in the order they are written and drawn.
 * Half of a captured combination, and the whole of what the field shows while it
 * is still waiting for a key.
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

/** The physical keys that are only ever half of a combination. */
const isModifierCode = (code: string) => {
  return (
    code.startsWith('Control') ||
    code.startsWith('Shift') ||
    code.startsWith('Alt') ||
    code.startsWith('Meta')
  )
}
