import craFemale from '@multifus/ankama/portraits/cra_f.webp'
import craMale from '@multifus/ankama/portraits/cra_m.webp'
import ecaflipFemale from '@multifus/ankama/portraits/ecaflip_f.webp'
import ecaflipMale from '@multifus/ankama/portraits/ecaflip_m.webp'
import eniripsaFemale from '@multifus/ankama/portraits/eniripsa_f.webp'
import eniripsaMale from '@multifus/ankama/portraits/eniripsa_m.webp'
import enutrofFemale from '@multifus/ankama/portraits/enutrof_f.webp'
import enutrofMale from '@multifus/ankama/portraits/enutrof_m.webp'
import fecaFemale from '@multifus/ankama/portraits/feca_f.webp'
import fecaMale from '@multifus/ankama/portraits/feca_m.webp'
import iopFemale from '@multifus/ankama/portraits/iop_f.webp'
import iopMale from '@multifus/ankama/portraits/iop_m.webp'
import osamodasFemale from '@multifus/ankama/portraits/osamodas_f.webp'
import osamodasMale from '@multifus/ankama/portraits/osamodas_m.webp'
import pandawaFemale from '@multifus/ankama/portraits/pandawa_f.webp'
import pandawaMale from '@multifus/ankama/portraits/pandawa_m.webp'
import sacrieurFemale from '@multifus/ankama/portraits/sacrieur_f.webp'
import sacrieurMale from '@multifus/ankama/portraits/sacrieur_m.webp'
import sadidaFemale from '@multifus/ankama/portraits/sadida_f.webp'
import sadidaMale from '@multifus/ankama/portraits/sadida_m.webp'
import sramFemale from '@multifus/ankama/portraits/sram_f.webp'
import sramMale from '@multifus/ankama/portraits/sram_m.webp'
import xelorFemale from '@multifus/ankama/portraits/xelor_f.webp'
import xelorMale from '@multifus/ankama/portraits/xelor_m.webp'
import type { Class, Gender } from '@/@types/roster'

export const CLASSES = [
  'feca',
  'osamodas',
  'enutrof',
  'sram',
  'xelor',
  'ecaflip',
  'eniripsa',
  'iop',
  'cra',
  'sadida',
  'sacrieur',
  'pandawa'
] as const satisfies readonly Class[]

export const CLASS_PORTRAITS = {
  feca: { female: fecaFemale, male: fecaMale },
  osamodas: { female: osamodasFemale, male: osamodasMale },
  enutrof: { female: enutrofFemale, male: enutrofMale },
  sram: { female: sramFemale, male: sramMale },
  xelor: { female: xelorFemale, male: xelorMale },
  ecaflip: { female: ecaflipFemale, male: ecaflipMale },
  eniripsa: { female: eniripsaFemale, male: eniripsaMale },
  iop: { female: iopFemale, male: iopMale },
  cra: { female: craFemale, male: craMale },
  sadida: { female: sadidaFemale, male: sadidaMale },
  sacrieur: { female: sacrieurFemale, male: sacrieurMale },
  pandawa: { female: pandawaFemale, male: pandawaMale }
} as const satisfies Record<Class, Record<Gender, string>>

export const PORTRAIT_UNKNOWN = '?'
