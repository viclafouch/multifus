import type { JournalEntry } from '@/@types/journal'
import type { AutoFocusSwitch } from '@/@types/notification'
import type { RelayStatus } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { QuickReply, ShortcutBinding } from '@/@types/shortcuts'
import type { Authorization, ConfigStatus, UpdateStatus } from '@/@types/system'

export type ScreenName =
  | 'about'
  | 'autoFocus'
  | 'characters'
  | 'relay'
  | 'settings'
  | 'shortcuts'

export type Snapshot = {
  readonly version: string
  readonly system: string
  readonly characters: readonly Character[]
  readonly shortcuts: readonly ShortcutBinding[]
  readonly quickReplies: readonly QuickReply[]
  readonly autoFocus: readonly AutoFocusSwitch[]
  readonly autoFocusEnabled: boolean
  readonly wakesMinimized: boolean
  readonly startAtLogin: boolean
  readonly maximizeOnLaunch: boolean
  readonly shortTitles: boolean
  readonly ungroupTaskbar: boolean
  readonly taskbarCombines: boolean
  readonly authorization: Authorization
  readonly config: ConfigStatus
  readonly update: UpdateStatus
  readonly relay: RelayStatus
  readonly journal: readonly JournalEntry[]
}
