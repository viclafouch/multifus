/** What the game notifications are made of, on the way to the AutoFocus. */

/** The seven event categories multifus recognises, in table order. */
export type NotificationKind =
  | 'challenge'
  | 'combat'
  | 'craft'
  | 'group'
  | 'perceptor'
  | 'private_message'
  | 'trade'

export type AutoFocusSwitch = {
  readonly kind: NotificationKind
  readonly enabled: boolean
}
