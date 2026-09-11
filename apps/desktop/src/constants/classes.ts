import craFemale from '@multifus/ankama/portraits/cra_f.png'
import craMale from '@multifus/ankama/portraits/cra_m.png'
import ecaflipFemale from '@multifus/ankama/portraits/ecaflip_f.png'
import ecaflipMale from '@multifus/ankama/portraits/ecaflip_m.png'
import eniripsaFemale from '@multifus/ankama/portraits/eniripsa_f.png'
import eniripsaMale from '@multifus/ankama/portraits/eniripsa_m.png'
import enutrofFemale from '@multifus/ankama/portraits/enutrof_f.png'
import enutrofMale from '@multifus/ankama/portraits/enutrof_m.png'
import fecaFemale from '@multifus/ankama/portraits/feca_f.png'
import fecaMale from '@multifus/ankama/portraits/feca_m.png'
import iopFemale from '@multifus/ankama/portraits/iop_f.png'
import iopMale from '@multifus/ankama/portraits/iop_m.png'
import osamodasFemale from '@multifus/ankama/portraits/osamodas_f.png'
import osamodasMale from '@multifus/ankama/portraits/osamodas_m.png'
import pandawaFemale from '@multifus/ankama/portraits/pandawa_f.png'
import pandawaMale from '@multifus/ankama/portraits/pandawa_m.png'
import sacrieurFemale from '@multifus/ankama/portraits/sacrieur_f.png'
import sacrieurMale from '@multifus/ankama/portraits/sacrieur_m.png'
import sadidaFemale from '@multifus/ankama/portraits/sadida_f.png'
import sadidaMale from '@multifus/ankama/portraits/sadida_m.png'
import sramFemale from '@multifus/ankama/portraits/sram_f.png'
import sramMale from '@multifus/ankama/portraits/sram_m.png'
import xelorFemale from '@multifus/ankama/portraits/xelor_f.png'
import xelorMale from '@multifus/ankama/portraits/xelor_m.png'
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
