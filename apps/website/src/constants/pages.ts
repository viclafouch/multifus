import type { Page, PageId } from '../@types/page.ts'

export const PAGES = {
  home: {
    kind: 'home',
    loop: 'home',
    kin: [],
    slugs: { fr: '', en: '', es: '' }
  },
  autoFocus: {
    kind: 'feature',
    loop: 'autoFocus',
    kin: ['relay', 'wheel'],
    slugs: { fr: 'autofocus', en: 'autofocus', es: 'autofocus' }
  },
  wheel: {
    kind: 'feature',
    loop: 'wheel',
    kin: ['walk', 'autoFocus'],
    slugs: {
      fr: 'roue-des-personnages',
      en: 'character-wheel',
      es: 'rueda-de-personajes'
    }
  },
  walk: {
    kind: 'feature',
    loop: 'walk',
    kin: ['wheel', 'autoFocus'],
    slugs: {
      fr: 'deplacement-rapide',
      en: 'quick-move',
      es: 'movimiento-rapido'
    }
  },
  runeTable: {
    kind: 'feature',
    loop: 'runeTable',
    kin: ['quickReplies', 'download'],
    slugs: { fr: 'tableau-des-runes', en: 'rune-table', es: 'tabla-de-runas' }
  },
  relay: {
    kind: 'feature',
    loop: 'relay',
    kin: ['autoFocus', 'quickReplies'],
    slugs: {
      fr: 'messages-prives',
      en: 'private-messages',
      es: 'mensajes-privados'
    }
  },
  quickReplies: {
    kind: 'feature',
    loop: 'quickReplies',
    kin: ['relay', 'runeTable'],
    slugs: {
      fr: 'reponses-rapides',
      en: 'quick-replies',
      es: 'respuestas-rapidas'
    }
  },
  mac: {
    kind: 'feature',
    loop: null,
    kin: ['autoFocus', 'download'],
    slugs: { fr: 'mac', en: 'mac', es: 'mac' }
  },
  comparison: {
    kind: 'comparison',
    loop: null,
    kin: ['download', 'ankama'],
    slugs: { fr: 'comparatif', en: 'comparison', es: 'comparativa' }
  },
  download: {
    kind: 'download',
    loop: null,
    kin: ['ankama', 'mac'],
    slugs: { fr: 'telecharger', en: 'download', es: 'descargar' }
  },
  journal: {
    kind: 'plain',
    loop: null,
    kin: ['download', 'mac'],
    slugs: { fr: 'journal', en: 'changelog', es: 'novedades' }
  },
  ankama: {
    kind: 'ankama',
    loop: null,
    kin: ['download', 'comparison'],
    slugs: { fr: 'ankama', en: 'ankama', es: 'ankama' }
  }
} as const satisfies Record<PageId, Page>

export const PAGE_IDS = [
  'home',
  'autoFocus',
  'wheel',
  'walk',
  'runeTable',
  'relay',
  'quickReplies',
  'mac',
  'comparison',
  'download',
  'journal',
  'ankama'
] as const satisfies readonly PageId[]

export const MENU_FEATURES = [
  'autoFocus',
  'wheel',
  'walk',
  'runeTable',
  'relay',
  'quickReplies'
] as const satisfies readonly PageId[]
