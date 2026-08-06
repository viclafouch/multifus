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

/** One of the five screens the window can show. */
export type ScreenName =
  | 'about'
  | 'autoFocus'
  | 'characters'
  | 'relay'
  | 'shortcuts'

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
  /** The relay carries this character's private messages. Unrelated to the
   * veille, which only takes a character out of the cycle. See ADR 0011. */
  readonly relayed: boolean
}

/**
 * Why a pairing did not go through.
 *
 * Five and not one, because they are repaired in five different places. A screen
 * that said « la connexion a échoué » would send the user to the wrong one every
 * time: `noChat` is not even a failure, it is the half of the pairing only the
 * user can do.
 */
export type PairingProblem =
  | { readonly kind: 'keychain'; readonly detail: string }
  | { readonly kind: 'network'; readonly detail: string }
  | { readonly kind: 'noChat' }
  | { readonly kind: 'tokenBlank' }
  | { readonly kind: 'tokenRefused'; readonly detail: string }

/**
 * One of the three Telegram pages the setup offers to open.
 *
 * A name and not a URL. The addresses live in `app::relay::links` on the Rust
 * side, so nothing here can point the browser somewhere it was not meant to go.
 */
export type RelayLink = 'botFather' | 'faq' | 'web'

/** Whether a pairing or an unlinking is in flight, and how the last one ended. */
export type PairingStatus =
  | { readonly kind: 'failed'; readonly problem: PairingProblem }
  | { readonly kind: 'idle' }
  | { readonly kind: 'working' }

/**
 * What the relay screen draws, and the whole of what crosses about the relay.
 *
 * **No bot token, and there could not be one**: on the Rust side a read hands
 * back a type that is not serialisable. The screen shows a state and a button
 * that unlinks. See ADR 0009.
 */
export type RelayStatus = {
  /**
   * The pairing has run on this machine, so a chat is known.
   *
   * Answered from the configuration and never from the keychain: this travels in
   * every snapshot, and reading the token can raise a system dialog. Whether the
   * token is still readable is asked once, when the relay is switched on.
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
 * What the screen saver of this machine is set to. Read once at startup and not
 * at each activation, see l'étape 11 du plan.
 */
export type ScreenSaver =
  | { readonly kind: 'after'; readonly seconds: number }
  | { readonly kind: 'never' }
  | { readonly kind: 'unknown' }

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

/**
 * Why the relay could not do what was asked.
 *
 * Three and not one, because they are repaired in three different places: the
 * keychain of the system, the bot at Telegram, and the network in between. No
 * detail here ever carries the URL of a call, which holds the bot token.
 */
export type RelayFailure =
  | { readonly reason: 'keychain'; readonly detail: string }
  | { readonly reason: 'network'; readonly detail: string }
  | { readonly reason: 'telegram'; readonly detail: string }

/**
 * What stopped the relay. A reason and not a {@link Surface}, since two of these
 * four are not a door the user pressed.
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
  | { readonly kind: 'relayBody'; readonly sendBody: boolean }
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
  | { readonly kind: 'displayAwake'; readonly held: boolean }
  | { readonly kind: 'displayAwakeFailed'; readonly detail: string }
  | { readonly kind: 'listening' }
  | { readonly kind: 'listeningFailed'; readonly detail: string }
  | { readonly kind: 'notificationUnreadable'; readonly detail: string }
  | { readonly kind: 'openFailed'; readonly detail: string }
  | { readonly kind: 'panicked'; readonly work: Work }
  | { readonly kind: 'quit' }
  | { readonly kind: 'relayDisabled'; readonly reason: RelayStop }
  | { readonly kind: 'relayEnabled' }
  | { readonly kind: 'relayFailed'; readonly reason: RelayFailure }
  | { readonly kind: 'relayNoticeSent'; readonly case: NoticeCase }
  | { readonly kind: 'relayPaired' }
  | { readonly kind: 'relaySent'; readonly nickname: string }
  | { readonly kind: 'relayUnpaired' }
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

/** Everything the five screens draw, in one piece. */
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
  /** What the relay screen draws. Never the bot token, ADR 0009. */
  readonly relay: RelayStatus
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

/** Puts a character in or out of the relay. Kept indefinitely, ADR 0011. */
export const setRelayed = async (nickname: string, relayed: boolean) => {
  return invoke<Snapshot>('set_relayed', { nickname, relayed })
}

/** Says whether the text of a private message goes out with it, ADR 0008. */
export const setSendBody = async (sendBody: boolean) => {
  return invoke<Snapshot>('set_send_body', { sendBody })
}

/**
 * Pairs the relay with the bot whose token this is.
 *
 * Answers with the pairing in flight and not with its result: it is two network
 * round trips and a keychain. What it finds arrives in a snapshot of its own.
 *
 * The token goes in and never comes back. No command returns one, and none can.
 */
export const pairRelay = async (token: string) => {
  return invoke<Snapshot>('pair_relay', { token })
}

/** Forgets the bot: the token leaves the keychain, the chat leaves the file. */
export const unpairRelay = async () => {
  return invoke<Snapshot>('unpair_relay')
}

/**
 * Opens one of the three Telegram pages the setup sends the user to.
 *
 * A destination and never an address: the URLs live on the Rust side, so nothing
 * that crosses the bridge can point the browser somewhere else.
 */
export const openRelayLink = async (link: RelayLink) => {
  return invoke<null>('open_relay_link', { link })
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
