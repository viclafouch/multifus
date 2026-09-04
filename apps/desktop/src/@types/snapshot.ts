import type { JournalEntry } from '@/@types/journal'
import type { Language } from '@/@types/language'
import type { AutoFocusSwitch } from '@/@types/notification'
import type { Onboarding } from '@/@types/onboarding'
import type { RelayStatus } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { RuneTableStatus } from '@/@types/rune'
import type { QuickReply, ShortcutBinding } from '@/@types/shortcuts'
import type {
  Authorization,
  ConfigStatus,
  KeyLabels,
  UpdateStatus
} from '@/@types/system'
import type { WalkStatus } from '@/@types/walk'
import type { WheelSize } from '@/@types/wheel'

export type Clients = {
  readonly open: number
  readonly small: number
  readonly readable: boolean
}

export type ClientsState = 'maximized' | 'none' | 'small' | 'unreadable'

export type ScreenName =
  | 'about'
  | 'autoFocus'
  | 'characters'
  | 'quickReplies'
  | 'relay'
  | 'runeTable'
  | 'settings'
  | 'shortcuts'
  | 'walk'
  | 'wheel'

export type Snapshot = {
  readonly version: string
  readonly system: string
  readonly language: Language
  readonly keyboard: KeyLabels
  readonly characters: readonly Character[]
  readonly shortcuts: readonly ShortcutBinding[]
  readonly quickReplies: readonly QuickReply[]
  readonly autoFocus: readonly AutoFocusSwitch[]
  readonly autoFocusEnabled: boolean
  readonly wakesMinimized: boolean
  readonly startAtLogin: boolean
  readonly maximizeOnLaunch: boolean
  readonly shortTitles: boolean
  readonly paintPortraits: boolean
  readonly ungroupTaskbar: boolean
  readonly taskbarCombines: boolean
  readonly authorization: Authorization
  readonly onboarding: Onboarding
  readonly config: ConfigStatus
  readonly update: UpdateStatus
  readonly relay: RelayStatus
  readonly walk: WalkStatus
  readonly wheel: WheelSize
  readonly runeTable: RuneTableStatus
  readonly journal: readonly JournalEntry[]
}
