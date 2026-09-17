import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type {
  HalfNote,
  Mark,
  Rival,
  RivalId,
  Trait,
  TraitId
} from '@/@types/rival'
import { PAGE_NAMES } from '@/constants/wording'

export const SURVEYED_ON = '2026-09-14'

export const RIVAL_IDS = [
  'dracoon',
  'focusRetro',
  'dosoft',
  'retroToolbox',
  'rorganizer'
] as const satisfies readonly RivalId[]

export const RIVALS = {
  dracoon: {
    name: 'Dracoon',
    code: 'https://github.com/Slyss42/Dracoon'
  },
  focusRetro: {
    name: 'Focus Retro',
    code: 'https://github.com/alacroix/focusretro'
  },
  dosoft: {
    name: 'Dosoft',
    code: 'https://github.com/luframecode/dosoft'
  },
  retroToolbox: {
    name: 'Retro Toolbox',
    code: 'https://github.com/Webn-Benjamin/retro_toolbox'
  },
  rorganizer: {
    name: 'ROrganizer',
    code: 'https://github.com/Loulouw/ROrganizer'
  }
} as const satisfies Record<RivalId, Rival>

export const TRAIT_IDS = [
  'macos',
  'windows',
  'wheel',
  'walk',
  'autoFocus',
  'runeTable',
  'relay',
  'quickTexts',
  'split',
  'savedOrders',
  'signed',
  'source'
] as const satisfies readonly TraitId[]

export const PEEK_TRAITS = [
  'macos',
  'windows',
  'wheel',
  'walk',
  'autoFocus',
  'relay',
  'quickTexts'
] as const satisfies readonly TraitId[]

export const TRAITS = {
  macos: {
    mine: 'yes',
    theirs: {
      dracoon: 'no',
      focusRetro: 'yes',
      dosoft: 'no',
      retroToolbox: 'no',
      rorganizer: 'no'
    }
  },
  windows: {
    mine: 'yes',
    theirs: {
      dracoon: 'yes',
      focusRetro: 'yes',
      dosoft: 'yes',
      retroToolbox: 'yes',
      rorganizer: 'yes'
    }
  },
  wheel: {
    mine: 'yes',
    theirs: {
      dracoon: 'no',
      focusRetro: 'yes',
      dosoft: 'yes',
      retroToolbox: 'no',
      rorganizer: 'no'
    }
  },
  walk: {
    mine: 'yes',
    theirs: {
      dracoon: 'yes',
      focusRetro: 'no',
      dosoft: 'no',
      retroToolbox: 'no',
      rorganizer: 'no'
    }
  },
  autoFocus: {
    mine: 'yes',
    theirs: {
      dracoon: 'yes',
      focusRetro: 'yes',
      dosoft: 'no',
      retroToolbox: 'yes',
      rorganizer: 'no'
    }
  },
  runeTable: {
    mine: 'yes',
    theirs: {
      dracoon: 'no',
      focusRetro: 'no',
      dosoft: 'no',
      retroToolbox: 'half',
      rorganizer: 'no'
    }
  },
  relay: {
    mine: 'yes',
    theirs: {
      dracoon: 'no',
      focusRetro: 'no',
      dosoft: 'no',
      retroToolbox: 'no',
      rorganizer: 'no'
    }
  },
  quickTexts: {
    mine: 'yes',
    theirs: {
      dracoon: 'no',
      focusRetro: 'no',
      dosoft: 'no',
      retroToolbox: 'no',
      rorganizer: 'no'
    }
  },
  split: {
    mine: 'no',
    theirs: {
      dracoon: 'no',
      focusRetro: 'yes',
      dosoft: 'no',
      retroToolbox: 'no',
      rorganizer: 'no'
    }
  },
  savedOrders: {
    mine: 'no',
    theirs: {
      dracoon: 'yes',
      focusRetro: 'no',
      dosoft: 'half',
      retroToolbox: 'yes',
      rorganizer: 'no'
    }
  },
  signed: {
    mine: 'yes',
    theirs: {
      dracoon: 'no',
      focusRetro: 'half',
      dosoft: 'no',
      retroToolbox: 'no',
      rorganizer: 'no'
    }
  },
  source: {
    mine: 'yes',
    theirs: {
      dracoon: 'yes',
      focusRetro: 'yes',
      dosoft: 'yes',
      retroToolbox: 'half',
      rorganizer: 'yes'
    }
  }
} as const satisfies Record<TraitId, Trait>

export const TRAIT_NAMES = {
  macos: msg`Sur Mac`,
  windows: msg`Sur Windows`,
  wheel: PAGE_NAMES.wheel,
  walk: PAGE_NAMES.walk,
  autoFocus: msg`AutoFocus`,
  runeTable: PAGE_NAMES.runeTable,
  relay: PAGE_NAMES.relay,
  quickTexts: PAGE_NAMES.quickTexts,
  split: msg`Fenêtres rangées côte à côte`,
  savedOrders: msg`Plusieurs ordres de personnages enregistrés`,
  signed: msg`Paquet signé`,
  source: msg`Code publié`
} as const satisfies Record<TraitId, MessageDescriptor>

export const MARK_NAMES = {
  yes: msg`oui`,
  half: msg`à moitié`,
  no: msg`non`
} as const satisfies Record<Mark, MessageDescriptor>

export const HALF_NOTES = [
  {
    trait: 'runeTable',
    rival: 'retroToolbox',
    line: msg`Dans sa fenêtre à lui, pas par-dessus le jeu.`
  },
  {
    trait: 'savedOrders',
    rival: 'dosoft',
    line: msg`Deux équipes fixes, T1 et T2 : elles filtrent le cycle, elles n’enregistrent pas d’ordre.`
  },
  {
    trait: 'signed',
    rival: 'focusRetro',
    line: msg`Pas signé, mais l’attestation GitHub y est.`
  },
  {
    trait: 'source',
    rival: 'retroToolbox',
    line: msg`Code publié, sans licence libre.`
  }
] as const satisfies readonly HalfNote[]
