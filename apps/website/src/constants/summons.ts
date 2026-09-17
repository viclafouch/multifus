import { msg } from '@lingui/core/macro'
import type { PageId } from '@/@types/page'
import type { Summons } from '@/@types/summons'
import { BAND_DECORS } from '@/constants/decors'

type SummonsId = 'start' | 'trust' | 'whole'

export const SUMMONS = {
  start: {
    decor: BAND_DECORS.marsh,
    shape: 'stack',
    title: msg`Multifus s’installe sur Mac et sur Windows`,
    line: msg`Un fichier par système, trois gestes à l’installation, et vous jouez en multicompte le soir même.`
  },
  trust: {
    decor: BAND_DECORS.bones,
    shape: 'center',
    title: msg`Multifus respecte les CGU d’Ankama`,
    line: msg`Aucun fichier du jeu n’est lu, et aucune action n’est jouée à votre place.`
  },
  whole: {
    decor: BAND_DECORS.zaap,
    shape: 'split',
    title: msg`Six mécanismes, une seule installation`,
    line: msg`L’AutoFocus, la roue, le déplacement rapide, le tableau des runes, les messages privés et les textes rapides arrivent ensemble.`
  }
} as const satisfies Record<SummonsId, Summons>

export const PAGE_SUMMONS = {
  home: SUMMONS.start,
  autoFocus: SUMMONS.whole,
  wheel: SUMMONS.start,
  walk: SUMMONS.trust,
  runeTable: SUMMONS.whole,
  relay: SUMMONS.start,
  quickTexts: SUMMONS.trust,
  mac: SUMMONS.trust,
  windows: SUMMONS.whole,
  comparison: SUMMONS.trust,
  download: null,
  journal: SUMMONS.whole,
  ankama: SUMMONS.start,
  legal: SUMMONS.trust
} as const satisfies Record<PageId, Summons | null>
