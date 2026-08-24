/**
 * The journal as it crosses the bridge: structured events, put into words in
 * `helpers/journal.ts` and nowhere else.
 */

import type { NotificationKind } from '@/@types/notification'
import type { NoticeCase, RelayFailure, RelayStop } from '@/@types/relay'
import type { Gender } from '@/@types/roster'
import type { BoundCombination, ShortcutAction } from '@/@types/shortcuts'
import type { Launch, Surface, Work } from '@/@types/system'

/**
 * What became of a game notification. `kindUnknown` is a wording no pattern
 * covers, `bodyUnread` a body Multifus never got to read: two different repairs.
 */
export type NotificationOutcome =
  | { readonly outcome: 'bodyUnread' }
  | { readonly outcome: 'focusFailed'; readonly detail: string }
  | { readonly outcome: 'focused' }
  | { readonly outcome: 'kindDisabled' }
  | { readonly outcome: 'kindUnknown' }
  | { readonly outcome: 'leftMinimized' }
  | { readonly outcome: 'noWindow' }

/** What became of a character clicked in the system tray. */
export type TrayOutcome =
  | { readonly outcome: 'focusFailed'; readonly detail: string }
  | { readonly outcome: 'focused' }
  | { readonly outcome: 'noWindow' }

/** What became of a shortcut that fired. */
export type ShortcutOutcome =
  | {
      readonly outcome: 'focusFailed'
      readonly nickname: string
      readonly detail: string
    }
  | { readonly outcome: 'focused'; readonly nickname: string }
  | { readonly outcome: 'foregroundUnknown'; readonly detail: string }
  | { readonly outcome: 'noGender' }
  | { readonly outcome: 'nobodyInCycle' }
  | { readonly outcome: 'notInRoster'; readonly nickname: string }
  | { readonly outcome: 'noWindow'; readonly nickname: string }
  | { readonly outcome: 'outsideGame' }
  | { readonly outcome: 'slept'; readonly nickname: string }
  | { readonly outcome: 'swapped'; readonly awake: Gender }
  | { readonly outcome: 'woke'; readonly nickname: string }

/**
 * Why a quick reply did not reach the chat, or did and cost the clipboard. Six
 * places to repair it in, and the last one follows a paste that worked.
 */
export type QuickReplyFailure =
  | { readonly reason: 'clipboardNotGivenBack'; readonly detail: string }
  | { readonly reason: 'clipboardRefused'; readonly detail: string }
  | { readonly reason: 'foregroundUnknown'; readonly detail: string }
  | { readonly reason: 'gone' }
  | { readonly reason: 'outsideGame' }
  | { readonly reason: 'pasteRefused'; readonly detail: string }

/** What the user did to the roster from the window. */
export type RosterChange =
  | {
      readonly kind: 'genderAsleep'
      readonly gender: Gender
      readonly asleep: boolean
    }
  | {
      readonly kind: 'genderAssigned'
      readonly nickname: string
      readonly gender: Gender | null
    }
  | {
      readonly kind: 'relayed'
      readonly nickname: string
      readonly relayed: boolean
    }
  | { readonly kind: 'removed'; readonly nickname: string }
  | { readonly kind: 'reordered'; readonly order: readonly string[] }
  | { readonly kind: 'slept'; readonly nickname: string }
  | { readonly kind: 'woke'; readonly nickname: string }

/**
 * What the user changed, and from where when there are two doors. `from` says
 * whether the window had to be opened, the measure of the whole project.
 */
export type SettingChange =
  | {
      readonly kind: 'autoFocusEnabled'
      readonly enabled: boolean
      readonly from: Surface
    }
  | {
      readonly kind: 'autoFocusKind'
      readonly notificationKind: NotificationKind
      readonly enabled: boolean
    }
  | { readonly kind: 'relayBody'; readonly sendBody: boolean }
  | {
      readonly kind: 'wakesMinimized'
      readonly wakes: boolean
      readonly from: Surface
    }

/**
 * One thing worth knowing about when nothing comes to the front. No event
 * carries a word of what a notification said, see ADR 0006 and `app::journal`.
 */
export type JournalEvent =
  | { readonly kind: 'authorization'; readonly granted: boolean }
  | { readonly kind: 'characterOffline'; readonly nickname: string }
  | { readonly kind: 'characterOnline'; readonly nickname: string }
  | { readonly kind: 'configNotSetAside'; readonly detail: string }
  | { readonly kind: 'displayAwake'; readonly held: boolean }
  | { readonly kind: 'displayAwakeFailed'; readonly detail: string }
  | { readonly kind: 'listening' }
  | { readonly kind: 'listeningFailed'; readonly detail: string }
  | { readonly kind: 'notificationUnreadable'; readonly detail: string }
  | { readonly kind: 'openFailed'; readonly detail: string }
  | { readonly kind: 'panicked'; readonly work: Work }
  | { readonly kind: 'quickReplyFailed'; readonly reason: QuickReplyFailure }
  /** The first forty characters of the line, and the one place this file holds
   * words somebody typed. See ADR 0012. */
  | { readonly kind: 'quickReplyPasted'; readonly excerpt: string }
  | { readonly kind: 'quit' }
  | { readonly kind: 'relayDisabled'; readonly reason: RelayStop }
  | { readonly kind: 'relayEnabled'; readonly surface: Surface }
  | { readonly kind: 'relayFailed'; readonly reason: RelayFailure }
  | { readonly kind: 'relayNoticeSent'; readonly case: NoticeCase }
  | { readonly kind: 'relayPaired' }
  | { readonly kind: 'relaySent'; readonly nickname: string }
  | { readonly kind: 'relayTestSent' }
  | { readonly kind: 'relayUnpaired' }
  | { readonly kind: 'reset' }
  | { readonly kind: 'roster'; readonly change: RosterChange }
  | { readonly kind: 'saveFailed'; readonly detail: string }
  | { readonly kind: 'scanFailed'; readonly detail: string }
  | { readonly kind: 'setting'; readonly change: SettingChange }
  | {
      readonly kind: 'shortcutsBound'
      readonly bindings: readonly BoundCombination[]
    }
  | { readonly kind: 'shortcutsFailed'; readonly detail: string }
  | { readonly kind: 'snapshotFailed'; readonly detail: string }
  | { readonly kind: 'startAtLoginFailed'; readonly detail: string }
  | { readonly kind: 'startAtLoginReconciled'; readonly enabled: boolean }
  | { readonly kind: 'trayFailed'; readonly detail: string }
  | { readonly kind: 'updateAvailable'; readonly version: string }
  | { readonly kind: 'updateFailed'; readonly detail: string }
  | { readonly kind: 'updateUpToDate' }
  | { readonly kind: 'windowFailed'; readonly detail: string }
  | {
      readonly kind: 'authorizationRequested'
      readonly granted: boolean
      /** What the system said when it would not even answer the question. */
      readonly failure: string | null
    }
  | {
      readonly kind: 'configLoadFailed'
      readonly detail: string
      /** Where the file went, `null` when nothing was moved. */
      readonly quarantined: string | null
    }
  | {
      readonly kind: 'started'
      readonly version: string
      readonly system: string
      readonly launch: Launch
    }
  | {
      readonly kind: 'trayFocus'
      readonly nickname: string
      readonly outcome: TrayOutcome
    }
  | {
      readonly kind: 'shortcut'
      readonly action: ShortcutAction
      readonly outcome: ShortcutOutcome
    }
  | {
      readonly kind: 'notification'
      readonly nickname: string
      readonly notificationKind: NotificationKind | null
      readonly outcome: NotificationOutcome
    }

export type JournalEntry = {
  readonly id: number
  /** Milliseconds since the epoch. Formatted where the language lives. */
  readonly at: number
  readonly event: JournalEvent
}
