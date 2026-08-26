import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { NotificationKind } from '@/@types/notification'
import type { RelayLink } from '@/@types/relay'
import type { Gender } from '@/@types/roster'
import type { QuickReplyId, ShortcutAction } from '@/@types/shortcuts'
import type { ScreenName, Snapshot } from '@/@types/snapshot'

const SNAPSHOT_EVENT = 'multifus://snapshot'

export const onSnapshot = async (handle: (snapshot: Snapshot) => void) => {
  return listen<Snapshot>(SNAPSHOT_EVENT, ({ payload }: SnapshotEvent) => {
    handle(payload)
  })
}

type SnapshotEvent = { readonly payload: Snapshot }

const NAVIGATE_EVENT = 'multifus://navigate'

export const onNavigate = async (handle: (screen: ScreenName) => void) => {
  return listen<ScreenName>(NAVIGATE_EVENT, ({ payload }: NavigateEvent) => {
    handle(payload)
  })
}

type NavigateEvent = { readonly payload: ScreenName }

export const snapshot = async () => {
  return invoke<Snapshot>('snapshot')
}

export const refresh = async () => {
  return invoke<Snapshot>('refresh')
}

export const requestAuthorization = async () => {
  return invoke<Snapshot>('request_authorization')
}

export const openAuthorizationSettings = async () => {
  return invoke<null>('open_authorization_settings')
}

export const setGender = async (nickname: string, gender: Gender | null) => {
  return invoke<Snapshot>('set_gender', { nickname, gender })
}

export const toggleAsleep = async (nickname: string) => {
  return invoke<Snapshot>('toggle_asleep', { nickname })
}

export const setGenderAsleep = async (gender: Gender, asleep: boolean) => {
  return invoke<Snapshot>('set_gender_asleep', { gender, asleep })
}

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

export const resetShortcuts = async () => {
  return invoke<Snapshot>('reset_shortcuts')
}

export const addQuickReply = async () => {
  return invoke<Snapshot>('add_quick_reply')
}

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

export const setAutoFocusEnabled = async (enabled: boolean) => {
  return invoke<Snapshot>('set_auto_focus_enabled', { enabled })
}

export const setWakesMinimized = async (wakes: boolean) => {
  return invoke<Snapshot>('set_wakes_minimized', { wakes })
}

export const setStartAtLogin = async (startAtLogin: boolean) => {
  return invoke<Snapshot>('set_start_at_login', { startAtLogin })
}

export const setMaximizeOnLaunch = async (maximize: boolean) => {
  return invoke<Snapshot>('set_maximize_on_launch', { maximize })
}

export const setShortTitles = async (short: boolean) => {
  return invoke<Snapshot>('set_short_titles', { short })
}

export const setRelayed = async (nickname: string, relayed: boolean) => {
  return invoke<Snapshot>('set_relayed', { nickname, relayed })
}

export const setSendBody = async (sendBody: boolean) => {
  return invoke<Snapshot>('set_send_body', { sendBody })
}

export const pairRelay = async (token: string) => {
  return invoke<Snapshot>('pair_relay', { token })
}

export const setRelayActive = async (active: boolean) => {
  return invoke<Snapshot>('set_relay_active', { active })
}

export const testRelay = async () => {
  return invoke<Snapshot>('test_relay')
}

export const unpairRelay = async () => {
  return invoke<Snapshot>('unpair_relay')
}

export const openRelayLink = async (link: RelayLink) => {
  return invoke<null>('open_relay_link', { link })
}

export const reset = async () => {
  return invoke<Snapshot>('reset')
}

export const checkUpdate = async () => {
  return invoke<Snapshot>('check_update')
}

export const installUpdate = async () => {
  return invoke<Snapshot>('install_update')
}

export const dismissConfigProblem = async () => {
  return invoke<Snapshot>('dismiss_config_problem')
}

export const revealJournal = async () => {
  return invoke<null>('reveal_journal')
}

export const revealQuarantinedConfig = async () => {
  return invoke<null>('reveal_quarantined_config')
}
