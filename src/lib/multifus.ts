/**
 * The bridge to the Rust side: the shape of what comes back, and the calls that
 * ask for it.
 *
 * Every mutation answers with the whole snapshot rather than with the thing it
 * changed. Assigning a gender can wake up a grouped action, removing a character
 * renumbers the cycle, and the window scan can land between two clicks; one
 * payload for the whole board is what keeps two panels from ever disagreeing.
 */

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

/** Assigned by hand, kept indefinitely. See CONTEXT.md. */
export type Gender = 'female' | 'male'

/** The seven event categories multifus recognises, in table order. */
export type NotificationKind =
  | 'challenge'
  | 'combat'
  | 'craft'
  | 'group'
  | 'perceptor'
  | 'private_message'
  | 'trade'

/** One of the four screens the window can show. */
export type ScreenName = 'about' | 'autoFocus' | 'characters' | 'shortcuts'

/** The four actions of perimetre.md a combination can be bound to. */
export type ShortcutAction = 'next' | 'previous' | 'swap' | 'toggleAsleep'

/** One line of the roster. */
export type Character = {
  readonly nickname: string
  /** `null` until the user assigns one. */
  readonly gender: Gender | null
  /** Out of the cycle. AutoFocus still applies. */
  readonly asleep: boolean
  /** A window bears this nickname right now. */
  readonly online: boolean
}

/**
 * What the system answered when multifus laid a combination down.
 *
 * `registered` says the system took it, never that it will fire: on macOS a
 * combination the desktop already owns registers cleanly and is then simply
 * never delivered. The journal is where a silent shortcut is diagnosed.
 */
export type ShortcutStatus =
  | { readonly kind: 'duplicate'; readonly action: ShortcutAction }
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

export type AutoFocusSwitch = {
  readonly kind: NotificationKind
  readonly enabled: boolean
}

export type Authorization = {
  /** Accessibility on macOS, notification access on Windows. */
  readonly granted: boolean
  /** The notification listening is running right now. */
  readonly listening: boolean
}

/** Why the configuration on screen is not the one on disk. */
export type ConfigProblem =
  | {
      readonly kind: 'malformed'
      readonly detail: string
      readonly quarantined: string | null
    }
  | { readonly kind: 'notSaved'; readonly detail: string }
  | { readonly kind: 'unreadable'; readonly detail: string }

export type ConfigStatus = {
  readonly path: string
  readonly problem: ConfigProblem | null
}

/**
 * What multifus knows about the version that is published.
 *
 * No idle state: the check starts with the process, so the first snapshot the
 * interface ever sees is already `checking`.
 */
export type UpdateStatus =
  | { readonly kind: 'available'; readonly version: string }
  | { readonly kind: 'checking' }
  | { readonly kind: 'failed'; readonly detail: string }
  | { readonly kind: 'installing' }
  | { readonly kind: 'upToDate' }

/** What became of a game notification. */
export type NotificationOutcome =
  | { readonly outcome: 'focusFailed'; readonly detail: string }
  | { readonly outcome: 'focused' }
  | { readonly outcome: 'kindDisabled' }
  | { readonly outcome: 'kindUnknown' }
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

/** One thing worth knowing about when nothing comes to the front. */
export type JournalEvent =
  | { readonly kind: 'authorization'; readonly granted: boolean }
  | { readonly kind: 'characterOffline'; readonly nickname: string }
  | { readonly kind: 'characterOnline'; readonly nickname: string }
  | { readonly kind: 'listening' }
  | { readonly kind: 'listeningFailed'; readonly detail: string }
  | { readonly kind: 'openFailed'; readonly detail: string }
  | { readonly kind: 'reset' }
  | { readonly kind: 'saveFailed'; readonly detail: string }
  | { readonly kind: 'scanFailed'; readonly detail: string }
  | { readonly kind: 'shortcutsFailed'; readonly detail: string }
  | { readonly kind: 'startAtLoginFailed'; readonly detail: string }
  | { readonly kind: 'started' }
  | { readonly kind: 'trayFailed'; readonly detail: string }
  | { readonly kind: 'updateAvailable'; readonly version: string }
  | { readonly kind: 'updateFailed'; readonly detail: string }
  | { readonly kind: 'windowFailed'; readonly detail: string }
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
      readonly kind: 'shortcutRefused'
      readonly action: ShortcutAction
      readonly accelerator: string
      readonly detail: string
    }
  | {
      readonly kind: 'notification'
      readonly nickname: string
      readonly notificationKind: NotificationKind | null
      readonly outcome: NotificationOutcome
    }

export type JournalEntry = {
  readonly id: number
  /** Milliseconds since the epoch. Formatted here, where the language lives. */
  readonly at: number
  readonly event: JournalEvent
}

/** Everything the four screens draw, in one piece. */
export type Snapshot = {
  /** The version of the bundle, the one the changelog talks about. */
  readonly version: string
  /** The roster, in cycle order. */
  readonly characters: readonly Character[]
  readonly shortcuts: readonly ShortcutBinding[]
  readonly autoFocus: readonly AutoFocusSwitch[]
  /** The AutoFocus is running at all. Off, the seven above still say what they
   * will come back to. */
  readonly autoFocusEnabled: boolean
  /** What the user asked for, not what the system currently holds. */
  readonly startAtLogin: boolean
  readonly authorization: Authorization
  readonly config: ConfigStatus
  /** Where multifus is with the version that is published. */
  readonly update: UpdateStatus
  readonly journal: readonly JournalEntry[]
}

/** The one event the Rust side pushes, carrying the same snapshot. */
const SNAPSHOT_EVENT = 'multifus://snapshot'

/**
 * Subscribes to the snapshots the window scan and the AutoFocus send.
 *
 * Subscribe before the first `snapshot()` call, so that nothing emitted while
 * the interface was mounting is lost.
 */
export const onSnapshot = async (handle: (snapshot: Snapshot) => void) => {
  // Narrowed to the one field that is read. Tauri's own `Event<T>` is not a
  // readonly type and nothing here needs the rest of it.
  return listen<Snapshot>(SNAPSHOT_EVENT, ({ payload }: SnapshotEvent) => {
    handle(payload)
  })
}

type SnapshotEvent = { readonly payload: Snapshot }

/** The event the system tray sends when it wants a screen brought up. */
const NAVIGATE_EVENT = 'multifus://navigate'

/**
 * Subscribes to the screen the system tray asks for.
 *
 * Separate from the snapshot because it is a request and not a state: a screen
 * carried in every snapshot would drag the window back each time the scan found
 * a new client.
 */
export const onNavigate = async (handle: (screen: ScreenName) => void) => {
  return listen<ScreenName>(NAVIGATE_EVENT, ({ payload }: NavigateEvent) => {
    handle(payload)
  })
}

type NavigateEvent = { readonly payload: ScreenName }

export const snapshot = async () => {
  return invoke<Snapshot>('snapshot')
}

/** Looks at the game windows now rather than at the next turn of the scan. */
export const refresh = async () => {
  return invoke<Snapshot>('refresh')
}

/** Opens the system dialog for the authorization multifus needs. */
export const requestAuthorization = async () => {
  return invoke<Snapshot>('request_authorization')
}

/** Sends the user to the settings pane that grants it. */
export const openAuthorizationSettings = async () => {
  return invoke<null>('open_authorization_settings')
}

export const setGender = async (nickname: string, gender: Gender | null) => {
  return invoke<Snapshot>('set_gender', { nickname, gender })
}

export const toggleAsleep = async (nickname: string) => {
  return invoke<Snapshot>('toggle_asleep', { nickname })
}

/** One of the two grouped actions: the same veille on a whole gender. */
export const setGenderAsleep = async (gender: Gender, asleep: boolean) => {
  return invoke<Snapshot>('set_gender_asleep', { gender, asleep })
}

/** The new cycle order, as the drag and drop left it. */
export const reorder = async (order: readonly string[]) => {
  return invoke<Snapshot>('reorder', { order })
}

export const removeCharacter = async (nickname: string) => {
  return invoke<Snapshot>('remove_character', { nickname })
}

export const setShortcut = async (
  action: ShortcutAction,
  accelerator: string | null
) => {
  return invoke<Snapshot>('set_shortcut', { action, accelerator })
}

export const setAutoFocus = async (
  kind: NotificationKind,
  enabled: boolean
) => {
  return invoke<Snapshot>('set_auto_focus', { kind, enabled })
}

/** Suspends the AutoFocus as a whole, or brings it back. */
export const setAutoFocusEnabled = async (enabled: boolean) => {
  return invoke<Snapshot>('set_auto_focus_enabled', { enabled })
}

/**
 * Asks multifus to start with the session, or to stop doing so.
 *
 * The Rust side writes the intent and then makes the system follow it, so what
 * comes back is what the user asked for even if the registration failed. The
 * journal is where a refusal is read.
 */
export const setStartAtLogin = async (startAtLogin: boolean) => {
  return invoke<Snapshot>('set_start_at_login', { startAtLogin })
}

/** Everything back to the defaults, roster included. */
export const reset = async () => {
  return invoke<Snapshot>('reset')
}

/**
 * Asks whether a newer version is out.
 *
 * Answers with the check in flight and not with its result: what it finds
 * arrives a moment later, in a snapshot of its own.
 */
export const checkUpdate = async () => {
  return invoke<Snapshot>('check_update')
}

/** Downloads the version that was found. multifus restarts on its own after. */
export const installUpdate = async () => {
  return invoke<Snapshot>('install_update')
}

export const dismissConfigProblem = async () => {
  return invoke<Snapshot>('dismiss_config_problem')
}

/** Shows the file that was set aside, in the system's own file browser. */
export const revealQuarantinedConfig = async () => {
  return invoke<null>('reveal_quarantined_config')
}
