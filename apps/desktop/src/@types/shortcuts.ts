export type ShortcutAction =
  | 'main'
  | 'maximizeAll'
  | 'next'
  | 'previous'
  | 'runeTable'
  | 'toggleExcluded'
  | 'walk'
  | 'wheel'

export type QuickReplyId = number

export type Binding =
  | { readonly kind: 'action'; readonly action: ShortcutAction }
  | { readonly kind: 'character'; readonly nickname: string }
  | { readonly kind: 'quickReply'; readonly id: QuickReplyId }

export type ShortcutStatus =
  | { readonly kind: 'duplicate'; readonly binding: Binding }
  | { readonly kind: 'invalid'; readonly detail: string }
  | { readonly kind: 'refused'; readonly detail: string }
  | { readonly kind: 'registered' }
  | { readonly kind: 'unbound' }

export type ShortcutBinding = {
  readonly action: ShortcutAction
  readonly accelerator: string | null
  readonly status: ShortcutStatus
  readonly isDefault: boolean
}

export type QuickReply = {
  readonly id: QuickReplyId
  readonly text: string
  readonly accelerator: string | null
  readonly status: ShortcutStatus
}

export type BoundCombination = {
  readonly binding: Binding
  readonly accelerator: string | null
  readonly status: ShortcutStatus
}
