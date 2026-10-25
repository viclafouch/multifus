export type ShortcutAction =
  | 'main'
  | 'maximizeAll'
  | 'next'
  | 'notes'
  | 'previous'
  | 'runeTable'
  | 'toggleExcluded'
  | 'walk'
  | 'wheel'

export type Binding =
  | { readonly kind: 'action'; readonly action: ShortcutAction }
  | { readonly kind: 'character'; readonly nickname: string }

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

export type BoundCombination = {
  readonly binding: Binding
  readonly accelerator: string | null
  readonly status: ShortcutStatus
}
