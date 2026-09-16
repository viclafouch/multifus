import type { FeatureId, Page, PageId } from '../@types/page.ts'

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
    kin: ['quickTexts', 'wheel'],
    slugs: { fr: 'tableau-des-runes', en: 'rune-table', es: 'tabla-de-runas' }
  },
  relay: {
    kind: 'feature',
    loop: 'relay',
    kin: ['autoFocus', 'quickTexts'],
    slugs: {
      fr: 'messages-prives',
      en: 'private-messages',
      es: 'mensajes-privados'
    }
  },
  quickTexts: {
    kind: 'feature',
    loop: 'quickTexts',
    kin: ['relay', 'runeTable'],
    slugs: {
      fr: 'textes-rapides',
      en: 'quick-texts',
      es: 'textos-rapidos'
    }
  },
  mac: {
    kind: 'mac',
    loop: null,
    kin: ['autoFocus', 'walk'],
    slugs: { fr: 'mac', en: 'mac', es: 'mac' }
  },
  windows: {
    kind: 'windows',
    loop: null,
    kin: [],
    slugs: { fr: 'windows', en: 'windows', es: 'windows' }
  },
  comparison: {
    kind: 'comparison',
    loop: null,
    kin: ['autoFocus', 'wheel'],
    slugs: { fr: 'comparatif', en: 'comparison', es: 'comparativa' }
  },
  download: {
    kind: 'download',
    loop: null,
    kin: ['wheel', 'walk'],
    slugs: { fr: 'telecharger', en: 'download', es: 'descargar' }
  },
  journal: {
    kind: 'plain',
    loop: null,
    kin: ['runeTable', 'quickTexts'],
    slugs: { fr: 'journal', en: 'changelog', es: 'novedades' }
  },
  ankama: {
    kind: 'ankama',
    loop: null,
    kin: ['autoFocus', 'relay'],
    slugs: { fr: 'ankama', en: 'ankama', es: 'ankama' }
  },
  legal: {
    kind: 'legal',
    loop: null,
    kin: [],
    slugs: {
      fr: 'mentions-legales',
      en: 'legal-notice',
      es: 'aviso-legal'
    }
  }
} as const satisfies Record<PageId, Page>

export const PAGE_IDS = [
  'home',
  'autoFocus',
  'wheel',
  'walk',
  'runeTable',
  'relay',
  'quickTexts',
  'mac',
  'windows',
  'comparison',
  'download',
  'journal',
  'ankama',
  'legal'
] as const satisfies readonly PageId[]

export const MENU_FEATURES = [
  'autoFocus',
  'wheel',
  'walk',
  'runeTable',
  'relay',
  'quickTexts'
] as const satisfies readonly FeatureId[]

export const SOFTWARE_PAGES = [
  'download',
  'windows',
  'mac',
  'comparison'
] as const satisfies readonly PageId[]

export const PROJECT_PAGES = [
  'ankama',
  'journal',
  'legal'
] as const satisfies readonly PageId[]
