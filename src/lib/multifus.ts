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

/**
 * Why the configuration on screen is not the one on disk.
 *
 * `notSetAside` is the only one where doing nothing loses something: the file
 * could not be read and could not be moved, so it is still sitting where the
 * next save writes.
 */
export type ConfigProblem =
  | {
      readonly kind: 'malformed'
      readonly detail: string
      readonly quarantined: string | null
    }
  | { readonly kind: 'notSaved'; readonly detail: string }
  | { readonly kind: 'notSetAside'; readonly detail: string }
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

/**
 * What became of a game notification.
 *
 * `kindUnknown` is a wording no pattern covers, `bodyUnread` is a body multifus
 * never got to read. Two different repairs, in two different files, which is why
 * they are two outcomes and not one.
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

/** How multifus was started. A session start does not show the window. */
export type Launch = 'byHand' | 'session'

/** Which of the two surfaces the user acted on. */
export type Surface = 'tray' | 'window'

/**
 * One of the three things multifus does on a thread of its own.
 *
 * What `panicked` names. Each of them going quiet used to look exactly like a
 * user who had stopped touching anything.
 */
export type Work = 'scan' | 'shortcuts' | 'tray'

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
  | { readonly kind: 'removed'; readonly nickname: string }
  | { readonly kind: 'reordered'; readonly order: readonly string[] }
  | { readonly kind: 'slept'; readonly nickname: string }
  | { readonly kind: 'woke'; readonly nickname: string }

/**
 * What the user changed, and from where when there are two doors.
 *
 * `from` says whether the window had to be opened, which is the measure of the
 * whole principle of the project.
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
  | {
      readonly kind: 'wakesMinimized'
      readonly wakes: boolean
      readonly from: Surface
    }

/**
 * One thing worth knowing about when nothing comes to the front.
 *
 * No event carries a word of what a notification said. The seven kinds are read
 * from the body on the Rust side and only the kind travels; a private message is
 * somebody writing to the user, and this journal is a file that lives for weeks.
 * See the note at the top of `app::journal`.
 */
export type JournalEvent =
  | { readonly kind: 'authorization'; readonly granted: boolean }
  | { readonly kind: 'characterOffline'; readonly nickname: string }
  | { readonly kind: 'characterOnline'; readonly nickname: string }
  | { readonly kind: 'configNotSetAside'; readonly detail: string }
  | { readonly kind: 'listening' }
  | { readonly kind: 'listeningFailed'; readonly detail: string }
  | { readonly kind: 'notificationUnreadable'; readonly detail: string }
  | { readonly kind: 'openFailed'; readonly detail: string }
  | { readonly kind: 'panicked'; readonly work: Work }
  | { readonly kind: 'quit' }
  | { readonly kind: 'reset' }
  | { readonly kind: 'roster'; readonly change: RosterChange }
  | { readonly kind: 'saveFailed'; readonly detail: string }
  | { readonly kind: 'scanFailed'; readonly detail: string }
  | { readonly kind: 'setting'; readonly change: SettingChange }
  | {
      readonly kind: 'shortcutsBound'
      readonly bindings: readonly ShortcutBinding[]
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
  /** Milliseconds since the epoch. Formatted here, where the language lives. */
  readonly at: number
  readonly event: JournalEvent
}

/** Everything the four screens draw, in one piece. */
export type Snapshot = {
  /** The version of the bundle, the one the changelog talks about. */
  readonly version: string
  /**
   * The system, its version and its architecture.
   *
   * Read by the head of a copied journal and nothing else. A transcript is read
   * against a release and against an operating system, and the `started` line
   * that also carries it is the first to leave a journal that has been running.
   */
  readonly system: string
  /** The roster, in cycle order. */
  readonly characters: readonly Character[]
  readonly shortcuts: readonly ShortcutBinding[]
  readonly autoFocus: readonly AutoFocusSwitch[]
  /** The AutoFocus is running at all. Off, the seven above still say what they
   * will come back to. */
  readonly autoFocusEnabled: boolean
  /** A notification takes a window out of the Dock. Off, minimizing a client
   * puts it out of the AutoFocus's reach, and only the AutoFocus's. */
  readonly wakesMinimized: boolean
  /** What the user asked for, not what the system currently holds. */
  readonly startAtLogin: boolean
  readonly authorization: Authorization
  readonly config: ConfigStatus
  /** Where multifus is with the version that is published. */
  readonly update: UpdateStatus
  /**
   * The entries the Rust side still holds in memory, oldest first.
   *
   * Not the whole journal: every entry also goes to a file that keeps weeks of
   * them, which is what `revealJournal` opens. This is the window the drawer
   * draws.
   */
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
 * Says whether a notification takes a window out of the Dock.
 *
 * The AutoFocus alone reads it. A shortcut and a click in the system tray were
 * asked for, so they bring the window back whatever this says.
 */
export const setWakesMinimized = async (wakes: boolean) => {
  return invoke<Snapshot>('set_wakes_minimized', { wakes })
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

/**
 * Shows the journal file in the system's own file browser.
 *
 * The other half of the export. The copy button carries the entries above, this
 * carries the weeks the file holds, and the same item sits in the menu of the
 * system tray for the day the window is the thing that is wrong.
 */
export const revealJournal = async () => {
  return invoke<null>('reveal_journal')
}

/** Shows the file that was set aside, in the system's own file browser. */
export const revealQuarantinedConfig = async () => {
  return invoke<null>('reveal_quarantined_config')
}
