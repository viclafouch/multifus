import { fireEvent, screen } from '@testing-library/react'
import type { Display } from '@/@types/display'
import type { Onboarding } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import type { QuickText } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { SystemInternals } from '@/@types/system'
import type { WheelSize, WheelSlice } from '@/@types/wheel'
import { OPENING_WAIT_MS } from '@/hooks/use-late-opening'

export const APPLE_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
export const WINDOWS_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

const WINDOWS_TEN = {
  platform: 'windows',
  version: '10.0.19045'
} as const satisfies SystemInternals

export const runOnWindowsTen = () => {
  Object.defineProperty(globalThis, '__TAURI_OS_PLUGIN_INTERNALS__', {
    configurable: true,
    value: WINDOWS_TEN
  })
}

export const NO_BREAK_SPACE = '\u00A0'
export const NARROW_NO_BREAK_SPACE = '\u202F'

export function pending(): Promise<never> {
  return new Promise(() => {})
}

const LATE_DIALOG_WAIT_MS = OPENING_WAIT_MS + 800

export const findLateDialog = () => {
  return screen.findByRole('dialog', {}, { timeout: LATE_DIALOG_WAIT_MS })
}

export const findLateButton = (name: string) => {
  return screen.findByRole('button', { name }, { timeout: LATE_DIALOG_WAIT_MS })
}

const BLANK_CHARACTER: Character = {
  nickname: 'Alpha',
  gender: 'male',
  class: 'iop',
  color: null,
  main: false,
  excluded: false,
  online: true,
  relayed: true,
  shortcut: null,
  shortcutStatus: { kind: 'unbound' }
}

export const characterOf = (fields: Partial<Character> = {}) => {
  return { ...BLANK_CHARACTER, ...fields }
}

const BLANK_QUICK_TEXT: QuickText = {
  id: 1,
  text: '',
  accelerator: null,
  status: { kind: 'unbound' }
}

export const quickTextOf = (fields: Partial<QuickText> = {}) => {
  return { ...BLANK_QUICK_TEXT, ...fields }
}

export type Combination = {
  readonly code: string
  readonly ctrlKey?: boolean
  readonly altKey?: boolean
  readonly shiftKey?: boolean
  readonly metaKey?: boolean
}

export const strike = (field: HTMLElement, combination: Combination) => {
  fireEvent.keyDown(field, { key: combination.code, ...combination })
}

export const keyCapsOf = (field: HTMLElement) => {
  return [...field.querySelectorAll('kbd')].map((keyCap) => {
    return keyCap.textContent
  })
}

const BLANK_SCREEN: Display = {
  name: 'Écran intégré',
  width: 1512,
  height: 982,
  primary: true
}

export const displayOf = (fields: Partial<Display> = {}) => {
  return { ...BLANK_SCREEN, ...fields }
}

const BLANK_SLICE: WheelSlice = {
  nickname: 'Alpha',
  class: 'iop',
  gender: 'male',
  color: null,
  main: false,
  here: false
}

export const wheelSliceOf = (fields: Partial<WheelSlice> = {}) => {
  return { ...BLANK_SLICE, ...fields }
}

const BLANK_ONBOARDING: Onboarding = {
  done: true,
  steps: [
    { step: 'authorization', check: 'ready', proven: false },
    { step: 'notifications', check: 'unknown', proven: false },
    { step: 'focus', check: 'unknown', proven: false },
    { step: 'gameSetting', check: 'unknown', proven: false },
    { step: 'proof', check: 'unknown', proven: false }
  ],
  hasNotice: false
}

export const onboardingOf = (fields: Partial<Onboarding> = {}) => {
  return { ...BLANK_ONBOARDING, ...fields }
}

const DEMO_TEAM = Array.from({ length: 8 }, (_, rank) => {
  return wheelSliceOf({ nickname: `Faux ${rank + 1}`, here: rank === 0 })
})

const BLANK_WHEEL_SIZE: WheelSize = {
  diameter: 400,
  smallest: 280,
  widest: 720,
  step: 20,
  deadZone: 0.32,
  demo: DEMO_TEAM
}

export const wheelSizeOf = (fields: Partial<WheelSize> = {}) => {
  return { ...BLANK_WHEEL_SIZE, ...fields }
}

const BLANK_SNAPSHOT: Snapshot = {
  scanned: true,
  version: '0.0.0',
  system: 'test',
  language: 'fr',
  keyboard: {},
  characters: [],
  shortcuts: [],
  quickTexts: [],
  autoFocus: [],
  autoFocusEnabled: true,
  wakesMinimized: true,
  startAtLogin: false,
  maximizeOnLaunch: true,
  shortTitles: true,
  paintPortraits: true,
  ungroupTaskbar: true,
  taskbarCombines: true,
  shareStats: true,
  authorization: { granted: true, listening: true },
  onboarding: BLANK_ONBOARDING,
  config: { path: '/tmp/multifus.json', problem: null },
  update: { kind: 'upToDate' },
  relay: {
    paired: false,
    sendBody: false,
    active: false,
    ready: false,
    screenSaver: { kind: 'never' },
    pairing: { kind: 'idle' },
    switch: { kind: 'idle' },
    test: { kind: 'idle' }
  },
  walk: { enabled: false, banner: { corner: 'bottomRight', screen: null } },
  wheel: BLANK_WHEEL_SIZE,
  runeTable: {
    width: 420,
    narrowest: 320,
    widest: 560,
    step: 20,
    transparency: 0,
    clearest: 100,
    veilStep: 5,
    everywhere: false,
    previewing: false
  },
  loopsSeen: {
    wheel: true,
    walk: true,
    runeTable: true,
    autoFocus: true,
    relay: true,
    quickTexts: true
  },
  journal: []
}

export const snapshotOf = (fields: Partial<Snapshot> = {}) => {
  return { ...BLANK_SNAPSHOT, ...fields }
}

export const speakFrench = async () => {
  const { SOURCE_LANGUAGE, speak } = await import('@/lib/i18n')

  speak(SOURCE_LANGUAGE)
}
