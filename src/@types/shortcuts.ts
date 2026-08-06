/** The four global combinations, as the system left them. */

/** The four actions of perimetre.md a combination can be bound to. */
export type ShortcutAction = 'next' | 'previous' | 'swap' | 'toggleAsleep'

/**
 * What the system answered when multifus laid a combination down. `registered`
 * says the system took it, never that it will fire: see le plan, « Ce qui mord ».
 */
export type ShortcutStatus =
  | { readonly kind: 'duplicate'; readonly action: ShortcutAction }
  | { readonly kind: 'invalid'; readonly detail: string }
  | { readonly kind: 'pending' }
  | { readonly kind: 'refused'; readonly detail: string }
  | { readonly kind: 'registered' }
  | { readonly kind: 'unbound' }

export type ShortcutBinding = {
  readonly action: ShortcutAction
  /** As the plugin reads it, `null` for an action with no combination. */
  readonly accelerator: string | null
  readonly status: ShortcutStatus
}
