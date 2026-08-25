/**
 * The bridge to the Rust side: every call Multifus can make, and the two events
 * it listens to. What crosses is typed in `@types/`, which imports nothing.
 */

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { NotificationKind } from '@/@types/notification'
import type { RelayLink } from '@/@types/relay'
import type { Gender } from '@/@types/roster'
import type { QuickReplyId, ShortcutAction } from '@/@types/shortcuts'
import type { ScreenName, Snapshot } from '@/@types/snapshot'

/** The one event the Rust side pushes, carrying the same snapshot. */
const SNAPSHOT_EVENT = 'multifus://snapshot'

/**
 * Subscribes to the snapshots the window scan and the AutoFocus send. Subscribe
 * before the first `snapshot()` call, so nothing emitted while mounting is lost.
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
 * Subscribes to the screen the system tray asks for. A request and not a state:
 * carried in every snapshot, it would drag the window back at each scan.
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

/** Opens the system dialog for the authorization Multifus needs. */
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

/** Adds an empty quick reply at the end of the list. It fires nothing until a
 * combination is bound to it. */
export const addQuickReply = async () => {
  return invoke<Snapshot>('add_quick_reply')
}

/**
 * Rewrites the line a quick reply pastes. Called when the field loses the focus and
 * not on every key press: this writes the configuration to disk.
 */
export const setQuickReplyText = async (id: QuickReplyId, text: string) => {
  return invoke<Snapshot>('set_quick_reply_text', { id, text })
}

export const setQuickReplyShortcut = async (
  id: QuickReplyId,
  accelerator: string | null
) => {
  return invoke<Snapshot>('set_quick_reply_shortcut', { id, accelerator })
}

export const removeQuickReply = async (id: QuickReplyId) => {
  return invoke<Snapshot>('remove_quick_reply', { id })
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
 * Says whether a notification takes a window out of the Dock. The AutoFocus
 * alone reads it: a shortcut and a click in the tray were asked for.
 */
export const setWakesMinimized = async (wakes: boolean) => {
  return invoke<Snapshot>('set_wakes_minimized', { wakes })
}

/**
 * Asks Multifus to start with the session, or to stop doing so. What comes back
 * is what the user asked for even if the registration failed, see the journal.
 */
export const setStartAtLogin = async (startAtLogin: boolean) => {
  return invoke<Snapshot>('set_start_at_login', { startAtLogin })
}

export const setMaximizeOnLaunch = async (maximize: boolean) => {
  return invoke<Snapshot>('set_maximize_on_launch', { maximize })
}

/**
 * Says whether a game window's title is cut down to the bare nickname. The
 * windows follow on the next sweep, at most a second later.
 */
export const setShortTitles = async (short: boolean) => {
  return invoke<Snapshot>('set_short_titles', { short })
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
 * Pairs the relay with the bot whose token this is. Answers with the pairing in
 * flight: the token goes in and never comes back, since no command returns one.
 */
export const pairRelay = async (token: string) => {
  return invoke<Snapshot>('pair_relay', { token })
}

/**
 * Moves the switch of the Relais screen, the twin of the tray item. Answers with
 * the switching in flight: it reads the keychain, which can raise a dialog.
 */
export const setRelayActive = async (active: boolean) => {
  return invoke<Snapshot>('set_relay_active', { active })
}

/**
 * Sends one message to the telephone, on demand. Answers with the sending in
 * flight: with no relay running it reads the keychain, which can raise a dialog.
 */
export const testRelay = async () => {
  return invoke<Snapshot>('test_relay')
}

/** Forgets the bot: the token leaves the keychain, the chat leaves the file. */
export const unpairRelay = async () => {
  return invoke<Snapshot>('unpair_relay')
}

/**
 * Opens one of the three Telegram pages the setup sends the user to. A
 * destination and never an address: the URLs live on the Rust side.
 */
export const openRelayLink = async (link: RelayLink) => {
  return invoke<null>('open_relay_link', { link })
}

/** Everything back to the defaults, roster included. */
export const reset = async () => {
  return invoke<Snapshot>('reset')
}

/**
 * Asks whether a newer version is out. Answers with the check in flight: what it
 * finds arrives a moment later, in a snapshot of its own.
 */
export const checkUpdate = async () => {
  return invoke<Snapshot>('check_update')
}

/** Downloads the version that was found. Multifus restarts on its own after. */
export const installUpdate = async () => {
  return invoke<Snapshot>('install_update')
}

export const dismissConfigProblem = async () => {
  return invoke<Snapshot>('dismiss_config_problem')
}

/**
 * Shows the journal file in the system's own file browser. The other half of the
 * export: the copy button carries the entries, this carries the weeks.
 */
export const revealJournal = async () => {
  return invoke<null>('reveal_journal')
}

/** Shows the file that was set aside, in the system's own file browser. */
export const revealQuarantinedConfig = async () => {
  return invoke<null>('reveal_quarantined_config')
}
