/** The relay as it crosses the bridge, and never the bot token. See ADR 0009. */

import type { ScreenSaver } from '@/@types/system'

/**
 * One of the three Telegram pages the setup offers to open. A name and not a
 * URL: the addresses live in `app::relay::links`, on the Rust side.
 */
export type RelayLink = 'botFather' | 'faq' | 'web'

/**
 * Why a pairing did not go through. Five and not one, because they are repaired
 * in five different places, and `noChat` is the half only the user can do.
 */
export type PairingProblem =
  | { readonly kind: 'keychain'; readonly detail: string }
  | { readonly kind: 'network'; readonly detail: string }
  | { readonly kind: 'noChat' }
  | { readonly kind: 'tokenBlank' }
  | { readonly kind: 'tokenRefused'; readonly detail: string }

/** Whether a pairing or an unlinking is in flight, and how the last one ended. */
export type PairingStatus =
  | { readonly kind: 'failed'; readonly problem: PairingProblem }
  | { readonly kind: 'idle' }
  | { readonly kind: 'working' }

/**
 * What the relay screen draws. Never the bot token, and there could not be one:
 * a read hands back a type that is not serialisable, ADR 0009.
 */
export type RelayStatus = {
  /**
   * The pairing has run on this machine, so a chat is known. Answered from the
   * configuration and never from the keychain, which can raise a dialog.
   */
  readonly paired: boolean
  /** The text of a private message goes out with it. Off by default, ADR 0008. */
  readonly sendBody: boolean
  /** The relay is carrying messages right now. Never persisted: a multifus back
   * from a crash relays nothing until somebody asks. */
  readonly active: boolean
  /** What this machine's screen saver is set to, since it locks the session. */
  readonly screenSaver: ScreenSaver
  readonly pairing: PairingStatus
}

/**
 * Why the relay could not do what was asked. Three and not one: the keychain of
 * the system, the bot at Telegram, and the network in between.
 */
export type RelayFailure =
  | { readonly reason: 'keychain'; readonly detail: string }
  | { readonly reason: 'network'; readonly detail: string }
  | { readonly reason: 'telegram'; readonly detail: string }

/**
 * What stopped the relay. A reason and not a surface, since two of these four
 * are not a door the user pressed.
 */
export type RelayStop =
  | 'noLongerPaired'
  | 'noRelayedCharacter'
  | 'shortcut'
  | 'tray'

/**
 * What an avis of ADR 0010 said. Three and not two, since one scan sends at most
 * one message and the two phrases travel in it together.
 */
export type NoticeCase = 'both' | 'disconnected' | 'nobodyLeft'
