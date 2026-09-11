import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { Mark, Rival, RivalId, Trait, TraitId } from '@/@types/rival'
import { PAGE_NAMES } from '@/constants/wording'

export const SURVEYED_ON = '2026-08-31'

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
  'quickReplies',
  'split',
  'teams',
  'signed',
  'source'
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
  quickReplies: {
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
      dosoft: 'half',
      retroToolbox: 'yes',
      rorganizer: 'no'
    }
  },
  teams: {
    mine: 'no',
    theirs: {
      dracoon: 'yes',
      focusRetro: 'no',
      dosoft: 'half',
      retroToolbox: 'half',
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
  autoFocus: msg`AutoFocus quand le jeu vous appelle`,
  runeTable: PAGE_NAMES.runeTable,
  relay: PAGE_NAMES.relay,
  quickReplies: PAGE_NAMES.quickReplies,
  split: msg`Fenêtres rangées côte à côte`,
  teams: msg`Compositions d’équipe enregistrées`,
  signed: msg`Paquet signé`,
  source: msg`Code publié`
} as const satisfies Record<TraitId, MessageDescriptor>

export const MARK_NAMES = {
  yes: msg`oui`,
  half: msg`à moitié`,
  no: msg`non`
} as const satisfies Record<Mark, MessageDescriptor>
