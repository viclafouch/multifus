import type { Snapshot } from '@/@types/snapshot'

const BLANK: Snapshot = {
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

export const snapshotOf = (fields: Partial<Snapshot> = {}): Snapshot => {
  return { ...BLANK, ...fields }
}
