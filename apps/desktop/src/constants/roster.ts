import { msg } from '@lingui/core/macro'
import type { Class, Color, Gender } from '@/@types/roster'
import type { Phrase } from '@/lib/i18n'

export const GENDERS = ['male', 'female'] as const satisfies readonly Gender[]

export const CLASS_LABELS = {
  feca: msg`Féca`,
  osamodas: msg`Osamodas`,
  enutrof: msg`Enutrof`,
  sram: msg`Sram`,
  xelor: msg`Xélor`,
  ecaflip: msg`Ecaflip`,
  eniripsa: msg`Eniripsa`,
  iop: msg`Iop`,
  cra: msg`Crâ`,
  sadida: msg`Sadida`,
  sacrieur: msg`Sacrieur`,
  pandawa: msg`Pandawa`
} as const satisfies Record<Class, Phrase>

export const COLOR_LABELS = {
  red: msg`Rouge`,
  orange: msg`Orange`,
  earth: msg`Terre`,
  yellow: msg`Jaune`,
  green: msg`Vert`,
  pine: msg`Sapin`,
  turquoise: msg`Turquoise`,
  sky: msg`Ciel`,
  blue: msg`Bleu`,
  lavender: msg`Lavande`,
  violet: msg`Violet`,
  pink: msg`Rose`
} as const satisfies Record<Color, Phrase>

export const GENDER_LABELS = {
  male: msg`Homme`,
  female: msg`Femme`
} as const satisfies Record<Gender, Phrase>
