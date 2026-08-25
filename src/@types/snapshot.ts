/**
 * Everything the six screens draw, in one piece. One payload for the whole
 * board is what keeps two panels from ever disagreeing.
 */

import type { JournalEntry } from '@/@types/journal'
import type { AutoFocusSwitch } from '@/@types/notification'
import type { RelayStatus } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { QuickReply, ShortcutBinding } from '@/@types/shortcuts'
import type { Authorization, ConfigStatus, UpdateStatus } from '@/@types/system'

/** One of the six screens the window can show. */
export type ScreenName =
  | 'about'
  | 'autoFocus'
  | 'characters'
  | 'relay'
  | 'settings'
  | 'shortcuts'

export type Snapshot = {
  /** The version of the bundle, the one the changelog talks about. */
  readonly version: string
  /**
   * The system, its version and its architecture. Read by the head of a copied
   * journal and nothing else.
   */
  readonly system: string
  /** The roster, in cycle order. */
  readonly characters: readonly Character[]
  readonly shortcuts: readonly ShortcutBinding[]
  /** The quick replies, in the order of the file. Empty on a first launch. */
  readonly quickReplies: readonly QuickReply[]
  readonly autoFocus: readonly AutoFocusSwitch[]
  /** The AutoFocus is running at all. Off, the seven above still say what they
   * will come back to. */
  readonly autoFocusEnabled: boolean
  /** A notification takes a window out of the Dock. Off, minimizing a client
   * puts it out of the AutoFocus's reach, and only the AutoFocus's. */
  readonly wakesMinimized: boolean
  /** What the user asked for, not what the system currently holds. */
  readonly startAtLogin: boolean
  readonly maximizeOnLaunch: boolean
  /** A game window's title is cut down to the bare nickname, so the taskbar
   * shows the character and nothing else. */
  readonly shortTitles: boolean
  readonly authorization: Authorization
  readonly config: ConfigStatus
  /** Where Multifus is with the version that is published. */
  readonly update: UpdateStatus
  /** What the relay screen draws. Never the bot token, ADR 0009. */
  readonly relay: RelayStatus
  /**
   * The entries the Rust side still holds in memory, oldest first. Not the whole
   * journal: the file `revealJournal` opens keeps weeks of them.
   */
  readonly journal: readonly JournalEntry[]
}
