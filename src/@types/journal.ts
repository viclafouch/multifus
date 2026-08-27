import type { NotificationKind } from '@/@types/notification'
import type { NoticeCase, RelayFailure, RelayStop } from '@/@types/relay'
import type { Class, Gender } from '@/@types/roster'
import type { BoundCombination, ShortcutAction } from '@/@types/shortcuts'
import type { Launch, Surface, Work } from '@/@types/system'
import type { WalkFrom, WalkIdle } from '@/@types/walk'

export type NotificationOutcome =
  | { readonly outcome: 'bodyUnread' }
  | { readonly outcome: 'excluded' }
  | { readonly outcome: 'focusFailed'; readonly detail: string }
  | { readonly outcome: 'focused' }
  | { readonly outcome: 'kindDisabled' }
  | { readonly outcome: 'kindUnknown' }
  | { readonly outcome: 'leftMinimized' }
  | { readonly outcome: 'noWindow' }

export type TrayOutcome =
  | { readonly outcome: 'focusFailed'; readonly detail: string }
  | { readonly outcome: 'focused' }
  | { readonly outcome: 'noWindow' }

export type ShortcutOutcome =
  | {
      readonly outcome: 'focusFailed'
      readonly nickname: string
      readonly detail: string
    }
  | { readonly outcome: 'focused'; readonly nickname: string }
  | { readonly outcome: 'foregroundUnknown'; readonly detail: string }
  | { readonly outcome: 'alreadyThere'; readonly nickname: string }
  | { readonly outcome: 'noGender' }
  | { readonly outcome: 'noMain' }
  | { readonly outcome: 'nobodyInCycle' }
  | { readonly outcome: 'notInRoster'; readonly nickname: string }
  | { readonly outcome: 'noWindow'; readonly nickname: string }
  | { readonly outcome: 'outsideGame' }
  | { readonly outcome: 'excluded'; readonly nickname: string }
  | { readonly outcome: 'swapped'; readonly kept: Gender }
  | { readonly outcome: 'walk'; readonly enabled: boolean }
  | { readonly outcome: 'included'; readonly nickname: string }

export type QuickReplyFailure =
  | { readonly reason: 'clipboardNotGivenBack'; readonly detail: string }
  | { readonly reason: 'clipboardRefused'; readonly detail: string }
  | { readonly reason: 'foregroundUnknown'; readonly detail: string }
  | { readonly reason: 'gone' }
  | { readonly reason: 'outsideGame' }
  | { readonly reason: 'pasteRefused'; readonly detail: string }

export type RosterChange =
  | {
      readonly kind: 'genderExcluded'
      readonly gender: Gender
      readonly excluded: boolean
    }
  | {
      readonly kind: 'genderAssigned'
      readonly nickname: string
      readonly gender: Gender | null
    }
  | {
      readonly kind: 'classAssigned'
      readonly nickname: string
      readonly class: Class | null
    }
  | {
      readonly kind: 'relayed'
      readonly nickname: string
      readonly relayed: boolean
    }
  | { readonly kind: 'main'; readonly nickname: string; readonly main: boolean }
  | { readonly kind: 'removed'; readonly nickname: string }
  | { readonly kind: 'reordered'; readonly order: readonly string[] }
  | { readonly kind: 'excluded'; readonly nickname: string }
  | { readonly kind: 'included'; readonly nickname: string }

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
  | { readonly kind: 'maximizeOnLaunch'; readonly maximize: boolean }
  | { readonly kind: 'shortTitles'; readonly short: boolean }
  | { readonly kind: 'paintPortraits'; readonly paint: boolean }
  | { readonly kind: 'ungroupTaskbar'; readonly ungroup: boolean }
  | { readonly kind: 'relayBody'; readonly sendBody: boolean }
  | {
      readonly kind: 'wakesMinimized'
      readonly wakes: boolean
      readonly from: Surface
    }

export type JournalEvent =
  | { readonly kind: 'authorization'; readonly granted: boolean }
  | { readonly kind: 'characterOffline'; readonly nickname: string }
  | { readonly kind: 'characterOnline'; readonly nickname: string }
  | { readonly kind: 'clientMaximized' }
  | { readonly kind: 'clientMaximizeFailed'; readonly detail: string }
  | { readonly kind: 'shortTitlesFailed'; readonly detail: string }
  | { readonly kind: 'windowIconFailed'; readonly detail: string }
  | { readonly kind: 'configNotSetAside'; readonly detail: string }
  | { readonly kind: 'displayAwake'; readonly held: boolean }
  | { readonly kind: 'displayAwakeFailed'; readonly detail: string }
  | { readonly kind: 'listening' }
  | { readonly kind: 'listeningFailed'; readonly detail: string }
  | { readonly kind: 'notificationUnreadable'; readonly detail: string }
  | { readonly kind: 'openFailed'; readonly detail: string }
  | { readonly kind: 'panicked'; readonly work: Work }
  | { readonly kind: 'quickReplyFailed'; readonly reason: QuickReplyFailure }
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
  | { readonly kind: 'walkIdle'; readonly reason: WalkIdle }
  | { readonly kind: 'walkListeningRefused'; readonly detail: string }
  | { readonly kind: 'walkListeningResumed' }
  | { readonly kind: 'walkListeningLost' }
  | { readonly kind: 'bannerFailed'; readonly detail: string }
  | { readonly kind: 'walkSwitchFailed'; readonly detail: string }
  | { readonly kind: 'windowFailed'; readonly detail: string }
  | {
      readonly kind: 'walkEnabled'
      readonly enabled: boolean
      readonly from: WalkFrom
    }
  | {
      readonly kind: 'authorizationRequested'
      readonly granted: boolean
      readonly failure: string | null
    }
  | {
      readonly kind: 'configLoadFailed'
      readonly detail: string
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
  readonly at: number
  readonly event: JournalEvent
}
