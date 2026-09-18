import craFemale from '@multifus/ankama/portraits/cra_f.png'
import ecaflipMale from '@multifus/ankama/portraits/ecaflip_m.png'
import eniripsaFemale from '@multifus/ankama/portraits/eniripsa_f.png'
import enutrofMale from '@multifus/ankama/portraits/enutrof_m.png'
import pandawaFemale from '@multifus/ankama/portraits/pandawa_f.png'
import sramMale from '@multifus/ankama/portraits/sram_m.png'
import type { FeatureId } from '@/@types/page'

export const PORTRAIT_SIDE = 256

export const FEATURE_PORTRAITS = {
  autoFocus: craFemale,
  wheel: ecaflipMale,
  walk: pandawaFemale,
  runeTable: enutrofMale,
  relay: sramMale,
  quickTexts: eniripsaFemale
} as const satisfies Record<FeatureId, string>
