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
