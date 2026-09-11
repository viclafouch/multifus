import type { Page, PageId } from '../@types/page.ts'

export const PAGES = {
  home: {
    kind: 'home',
    loop: null,
    kin: [],
    slugs: { fr: '', en: '', es: '' }
  },
  autoFocus: {
    kind: 'feature',
    loop: 'autoFocus',
    kin: ['relay', 'shortcuts'],
    slugs: { fr: 'autofocus', en: 'autofocus', es: 'autofocus' }
  },
  wheel: {
    kind: 'feature',
    loop: 'wheel',
    kin: ['shortcuts', 'walk'],
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
    kin: ['runeWeights', 'quickReplies'],
    slugs: { fr: 'tableau-des-runes', en: 'rune-table', es: 'tabla-de-runas' }
  },
  shortcuts: {
    kind: 'feature',
    loop: null,
    kin: ['wheel', 'quickReplies'],
    slugs: { fr: 'raccourcis', en: 'shortcuts', es: 'atajos' }
  },
  relay: {
    kind: 'feature',
    loop: null,
    kin: ['autoFocus', 'quickReplies'],
    slugs: {
      fr: 'messages-prives',
      en: 'private-messages',
      es: 'mensajes-privados'
    }
  },
  quickReplies: {
    kind: 'feature',
    loop: null,
    kin: ['shortcuts', 'relay'],
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
    kin: ['download', 'mac'],
    slugs: { fr: 'comparatif', en: 'comparison', es: 'comparativa' }
  },
  runeWeights: {
    kind: 'plain',
    loop: null,
    kin: ['runeTable', 'download'],
    slugs: {
      fr: 'poids-des-runes',
      en: 'rune-weights',
      es: 'pesos-de-las-runas'
    }
  },
  download: {
    kind: 'download',
    loop: null,
    kin: ['mac', 'comparison'],
    slugs: { fr: 'telecharger', en: 'download', es: 'descargar' }
  },
  journal: {
    kind: 'plain',
    loop: null,
    kin: ['download', 'mac'],
    slugs: { fr: 'journal', en: 'changelog', es: 'novedades' }
  },
  images: {
    kind: 'plain',
    loop: null,
    kin: ['download', 'comparison'],
    slugs: { fr: 'images', en: 'images', es: 'imagenes' }
  }
} as const satisfies Record<PageId, Page>

export const PAGE_IDS = [
  'home',
  'autoFocus',
  'wheel',
  'walk',
  'runeTable',
  'shortcuts',
  'relay',
  'quickReplies',
  'mac',
  'comparison',
  'runeWeights',
  'download',
  'journal',
  'images'
] as const satisfies readonly PageId[]

export const MENU_FEATURES = [
  'autoFocus',
  'wheel',
  'walk',
  'runeTable',
  'shortcuts',
  'relay',
  'quickReplies'
] as const satisfies readonly PageId[]
