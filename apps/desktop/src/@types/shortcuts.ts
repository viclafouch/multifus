export type ShortcutAction =
  | 'health'
  | 'main'
  | 'maximizeAll'
  | 'next'
  | 'previous'
  | 'runeTable'
  | 'toggleExcluded'
  | 'walk'
  | 'wheel'

export type QuickTextId = number

export type Binding =
  | { readonly kind: 'action'; readonly action: ShortcutAction }
  | { readonly kind: 'character'; readonly nickname: string }
  | { readonly kind: 'quickText'; readonly id: QuickTextId }

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

export type QuickText = {
  readonly id: QuickTextId
  readonly text: string
  readonly accelerator: string | null
  readonly status: ShortcutStatus
}

export type BoundCombination = {
  readonly binding: Binding
  readonly accelerator: string | null
  readonly status: ShortcutStatus
}
