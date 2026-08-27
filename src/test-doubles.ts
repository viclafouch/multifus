import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import type { BannerScreen } from '@/@types/walk'

export const APPLE_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
export const WINDOWS_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

export function pending(): Promise<never> {
  return new Promise(() => {})
}

const BLANK_CHARACTER: Character = {
  nickname: 'Alpha',
  gender: 'male',
  class: 'iop',
  excluded: false,
  online: true,
  relayed: true
}

export const characterOf = (fields: Partial<Character> = {}) => {
  return { ...BLANK_CHARACTER, ...fields }
}

const BLANK_SCREEN: BannerScreen = {
  name: 'Écran intégré',
  width: 1512,
  height: 982,
  primary: true
}

export const bannerScreenOf = (fields: Partial<BannerScreen> = {}) => {
  return { ...BLANK_SCREEN, ...fields }
}

const BLANK_SNAPSHOT: Snapshot = {
  version: '0.0.0',
  system: 'test',
  characters: [],
  shortcuts: [],
  quickReplies: [],
  autoFocus: [],
  autoFocusEnabled: true,
  wakesMinimized: true,
  startAtLogin: false,
  maximizeOnLaunch: false,
  shortTitles: false,
  paintPortraits: true,
  ungroupTaskbar: false,
  taskbarCombines: true,
  authorization: { granted: true, listening: true },
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
  journal: []
}

export const snapshotOf = (fields: Partial<Snapshot> = {}) => {
  return { ...BLANK_SNAPSHOT, ...fields }
}
