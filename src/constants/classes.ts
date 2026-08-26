import type { Class, Gender } from '@/@types/roster'
import craFemale from '@/assets/portraits/cra_f.png'
import craMale from '@/assets/portraits/cra_m.png'
import ecaflipFemale from '@/assets/portraits/ecaflip_f.png'
import ecaflipMale from '@/assets/portraits/ecaflip_m.png'
import eniripsaFemale from '@/assets/portraits/eniripsa_f.png'
import eniripsaMale from '@/assets/portraits/eniripsa_m.png'
import enutrofFemale from '@/assets/portraits/enutrof_f.png'
import enutrofMale from '@/assets/portraits/enutrof_m.png'
import fecaFemale from '@/assets/portraits/feca_f.png'
import fecaMale from '@/assets/portraits/feca_m.png'
import iopFemale from '@/assets/portraits/iop_f.png'
import iopMale from '@/assets/portraits/iop_m.png'
import osamodasFemale from '@/assets/portraits/osamodas_f.png'
import osamodasMale from '@/assets/portraits/osamodas_m.png'
import pandawaFemale from '@/assets/portraits/pandawa_f.png'
import pandawaMale from '@/assets/portraits/pandawa_m.png'
import sacrieurFemale from '@/assets/portraits/sacrieur_f.png'
import sacrieurMale from '@/assets/portraits/sacrieur_m.png'
import sadidaFemale from '@/assets/portraits/sadida_f.png'
import sadidaMale from '@/assets/portraits/sadida_m.png'
import sramFemale from '@/assets/portraits/sram_f.png'
import sramMale from '@/assets/portraits/sram_m.png'
import xelorFemale from '@/assets/portraits/xelor_f.png'
import xelorMale from '@/assets/portraits/xelor_m.png'

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
