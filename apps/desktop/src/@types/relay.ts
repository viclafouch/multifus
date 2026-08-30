import type { ScreenSaver } from '@/@types/system'

export type RelayLink = 'botFather' | 'faq' | 'web'

export type PairingProblem =
  | { readonly kind: 'keychain'; readonly detail: string }
  | { readonly kind: 'network'; readonly detail: string }
  | { readonly kind: 'noChat' }
  | { readonly kind: 'tokenBlank' }
  | { readonly kind: 'tokenRefused'; readonly detail: string }

export type PairingStatus =
  | { readonly kind: 'failed'; readonly problem: PairingProblem }
  | { readonly kind: 'idle' }
  | { readonly kind: 'working' }

export type SwitchStatus =
  | { readonly kind: 'failed'; readonly reason: RelayFailure }
  | { readonly kind: 'idle' }
  | { readonly kind: 'starting' }

export type TestStatus =
  | { readonly kind: 'failed'; readonly reason: RelayFailure }
  | { readonly kind: 'idle' }
  | { readonly kind: 'sent' }
  | { readonly kind: 'tooSoon' }
  | { readonly kind: 'working' }

export type RelayStatus = {
  readonly paired: boolean
  readonly sendBody: boolean
  readonly active: boolean
  readonly ready: boolean
  readonly screenSaver: ScreenSaver
  readonly pairing: PairingStatus
  readonly switch: SwitchStatus
  readonly test: TestStatus
}

export type RelayLiveState = 'active' | 'incomplete' | 'ready'

export type RelayFailure =
  | { readonly reason: 'keychain'; readonly detail: string }
  | { readonly reason: 'network'; readonly detail: string }
  | { readonly reason: 'telegram'; readonly detail: string }

export type RelayStop =
  | 'noLongerPaired'
  | 'noRelayedCharacter'
  | 'shortcut'
  | 'tray'
  | 'window'

export type NoticeCase = 'both' | 'disabled' | 'disconnected' | 'enabled'
