import craFemale from '@multifus/ankama/portraits/cra_f.webp'
import ecaflipMale from '@multifus/ankama/portraits/ecaflip_m.webp'
import eniripsaFemale from '@multifus/ankama/portraits/eniripsa_f.webp'
import enutrofMale from '@multifus/ankama/portraits/enutrof_m.webp'
import pandawaFemale from '@multifus/ankama/portraits/pandawa_f.webp'
import sramMale from '@multifus/ankama/portraits/sram_m.webp'
import type { FeatureId, PageId } from '@/@types/page'

export const PORTRAIT_SIDE = 256

export const PAGE_PORTRAITS = {
  home: null,
  autoFocus: craFemale,
  wheel: ecaflipMale,
  walk: pandawaFemale,
  runeTable: enutrofMale,
  relay: sramMale,
  quickTexts: eniripsaFemale,
  mac: null,
  windows: null,
  comparison: null,
  download: null,
  faq: null,
  journal: null,
  ankama: null,
  legal: null
} as const satisfies Record<FeatureId, string> & Record<PageId, string | null>
