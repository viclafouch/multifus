import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { Display } from '@/@types/display'
import type { NotificationKind } from '@/@types/notification'
import type { RelayLink } from '@/@types/relay'
import type { Class, Gender } from '@/@types/roster'
import type { QuickReplyId, ShortcutAction } from '@/@types/shortcuts'
import type { Clients, ScreenName, Snapshot } from '@/@types/snapshot'
import type { BannerCorner, BannerStep } from '@/@types/walk'
import type { WheelStep } from '@/@types/wheel'

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

export const requestAuthorization = async () => {
  return invoke<Snapshot>('request_authorization')
}

export const openAuthorizationSettings = async () => {
  return invoke<null>('open_authorization_settings')
}

export const setGender = async (nickname: string, gender: Gender | null) => {
  return invoke<Snapshot>('set_gender', { nickname, gender })
}

export const setClass = async (
  nickname: string,
  characterClass: Class | null
) => {
  return invoke<Snapshot>('set_class', { nickname, class: characterClass })
}

export const toggleExcluded = async (nickname: string) => {
  return invoke<Snapshot>('toggle_excluded', { nickname })
}

export const setMain = async (nickname: string, main: boolean) => {
  return invoke<Snapshot>('set_main', { nickname, main })
}

export const setGenderExcluded = async (gender: Gender, excluded: boolean) => {
  return invoke<Snapshot>('set_gender_excluded', { gender, excluded })
}

export const reorder = async (order: readonly string[]) => {
  return invoke<Snapshot>('reorder', { order })
}

export const removeCharacter = async (nickname: string) => {
  return invoke<Snapshot>('remove_character', { nickname })
}

export const suspendShortcuts = async () => {
  return invoke<null>('suspend_shortcuts')
}

export const resumeShortcuts = async () => {
  return invoke<null>('resume_shortcuts')
}

export const setShortcut = async (
  action: ShortcutAction,
  accelerator: string | null
) => {
  return invoke<Snapshot>('set_shortcut', { action, accelerator })
}

export const setCharacterShortcut = async (
  nickname: string,
  accelerator: string | null
) => {
  return invoke<Snapshot>('set_character_shortcut', { nickname, accelerator })
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

export const setWalkEnabled = async (enabled: boolean) => {
  return invoke<Snapshot>('set_walk_enabled', { enabled })
}

export const setBannerCorner = async (corner: BannerCorner) => {
  return invoke<Snapshot>('set_banner_corner', { corner })
}

export const setBannerScreen = async (screen: string | null) => {
  return invoke<Snapshot>('set_banner_screen', { screen })
}

export const bannerScreens = async () => {
  return invoke<Display[]>('banner_screens')
}

export const bannerStep = async () => {
  return invoke<BannerStep>('banner_step')
}

const BANNER_EVENT = 'multifus://banner'

export const onBannerStep = async (handle: (step: BannerStep) => void) => {
  return listen<BannerStep>(BANNER_EVENT, ({ payload }: BannerStepEvent) => {
    handle(payload)
  })
}

type BannerStepEvent = { readonly payload: BannerStep }

export const setWheelDiameter = async (diameter: number) => {
  return invoke<Snapshot>('set_wheel_diameter', { diameter })
}

export const previewWheel = async (crowd: number) => {
  return invoke<Snapshot>('preview_wheel', { crowd })
}

export const wheelDisplay = async () => {
  return invoke<Display | null>('wheel_display')
}

export const wheelStep = async () => {
  return invoke<WheelStep>('wheel_step')
}

const WHEEL_EVENT = 'multifus://wheel'

export const onWheelStep = async (handle: (step: WheelStep) => void) => {
  return listen<WheelStep>(WHEEL_EVENT, ({ payload }: WheelStepEvent) => {
    handle(payload)
  })
}

type WheelStepEvent = { readonly payload: WheelStep }

const WHEEL_AIM_EVENT = 'multifus://wheel-aim'

export const onWheelAim = async (handle: (hovered: number | null) => void) => {
  return listen<number | null>(
    WHEEL_AIM_EVENT,
    ({ payload }: WheelAimEvent) => {
      handle(payload)
    }
  )
}

type WheelAimEvent = { readonly payload: number | null }

export const setWakesMinimized = async (wakes: boolean) => {
  return invoke<Snapshot>('set_wakes_minimized', { wakes })
}

export const setStartAtLogin = async (startAtLogin: boolean) => {
  return invoke<Snapshot>('set_start_at_login', { startAtLogin })
}

export const setMaximizeOnLaunch = async (maximize: boolean) => {
  return invoke<Snapshot>('set_maximize_on_launch', { maximize })
}

export const maximizeAllClients = async () => {
  return invoke<Snapshot>('maximize_all_clients')
}

export const clients = async () => {
  return invoke<Clients>('clients')
}

export const watchClients = async (watching: boolean) => {
  return invoke<null>('watch_clients', { watching })
}

const CLIENTS_EVENT = 'multifus://clients'

export const onClients = async (handle: (counted: Clients) => void) => {
  return listen<Clients>(CLIENTS_EVENT, ({ payload }: ClientsEvent) => {
    handle(payload)
  })
}

type ClientsEvent = { readonly payload: Clients }

export const setShortTitles = async (short: boolean) => {
  return invoke<Snapshot>('set_short_titles', { short })
}

export const setPaintPortraits = async (paint: boolean) => {
  return invoke<Snapshot>('set_paint_portraits', { paint })
}

export const setUngroupTaskbar = async (ungroup: boolean) => {
  return invoke<Snapshot>('set_ungroup_taskbar', { ungroup })
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
