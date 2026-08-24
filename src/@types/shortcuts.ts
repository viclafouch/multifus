/** The global combinations, as the system left them: four actions and quick replies. */

/** The four actions of perimetre.md a combination can be bound to. */
export type ShortcutAction = 'next' | 'previous' | 'swap' | 'toggleAsleep'

/** The identity of a quick reply. A number, so its text is free to change. */
export type QuickReplyId = number

/** What a combination fires, whichever of the two families it belongs to. */
export type Binding =
  | { readonly kind: 'action'; readonly action: ShortcutAction }
  | { readonly kind: 'quickReply'; readonly id: QuickReplyId }

/**
 * What the system answered when Multifus laid a combination down. `registered`
 * says the system took it, never that it will fire: see `docs/macos.md` and
 * `docs/windows.md`, « Ce qui mord ».
 */
export type ShortcutStatus =
  | { readonly kind: 'duplicate'; readonly binding: Binding }
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

/** One row of the quick replies panel: a ready-made line and the keys that paste it. */
export type QuickReply = {
  readonly id: QuickReplyId
  /** The whole line. The journal only ever gets an excerpt, see ADR 0012. */
  readonly text: string
  /** As the plugin reads it, `null` for a quick reply nothing fires yet. */
  readonly accelerator: string | null
  readonly status: ShortcutStatus
}

/**
 * One combination laid on the system, whichever family it belongs to. What the
 * journal carries, and it carries no text: that file is meant to be handed over.
 */
export type BoundCombination = {
  readonly binding: Binding
  readonly accelerator: string | null
  readonly status: ShortcutStatus
}
