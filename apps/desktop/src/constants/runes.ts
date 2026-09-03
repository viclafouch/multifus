import { msg } from '@lingui/core/macro'
import type { Phrase } from '@/lib/i18n'

export type RuneFamilyName =
  | 'damage'
  | 'heavy'
  | 'primary'
  | 'resistance'
  | 'secondary'

export type RuneRow = {
  readonly stat: Phrase
  readonly simple: number
  readonly pa: number | null
  readonly ra: number | null
  readonly unit: number
}

export type RuneFamily = {
  readonly name: RuneFamilyName
  readonly label: Phrase
  readonly rows: readonly RuneRow[]
}

export const TABLE_DRAWN_WIDTH = 320

export const RUNE_FAMILIES = [
  {
    name: 'heavy',
    label: msg`Les lourdes`,
    rows: [
      { stat: msg`PA`, simple: 100, pa: null, ra: null, unit: 100 },
      { stat: msg`PM`, simple: 90, pa: null, ra: null, unit: 90 },
      { stat: msg`PO`, simple: 51, pa: null, ra: null, unit: 51 },
      { stat: msg`Invocation`, simple: 30, pa: null, ra: null, unit: 30 },
      { stat: msg`Critique`, simple: 30, pa: null, ra: null, unit: 30 },
      { stat: msg`Soin`, simple: 20, pa: null, ra: null, unit: 20 }
    ]
  },
  {
    name: 'damage',
    label: msg`Dommages`,
    rows: [
      {
        stat: msg`Renvoi de dommages`,
        simple: 30,
        pa: null,
        ra: null,
        unit: 30
      },
      { stat: msg`Dommages`, simple: 20, pa: null, ra: null, unit: 20 },
      { stat: msg`Dommages piège`, simple: 15, pa: 45, ra: null, unit: 15 },
      { stat: msg`% piège`, simple: 2, pa: 6, ra: null, unit: 2 },
      { stat: msg`% dommages`, simple: 2, pa: 6, ra: 20, unit: 2 }
    ]
  },
  {
    name: 'resistance',
    label: msg`Résistances`,
    rows: [
      { stat: msg`% résistance`, simple: 4, pa: null, ra: null, unit: 4 },
      { stat: msg`Résistance fixe`, simple: 5, pa: null, ra: null, unit: 5 }
    ]
  },
  {
    name: 'secondary',
    label: msg`Secondaires`,
    rows: [
      { stat: msg`Sagesse`, simple: 3, pa: 9, ra: 30, unit: 3 },
      { stat: msg`Prospection`, simple: 3, pa: 9, ra: null, unit: 3 },
      { stat: msg`Chasse`, simple: 5, pa: null, ra: null, unit: 5 }
    ]
  },
  {
    name: 'primary',
    label: msg`Les légères`,
    rows: [
      { stat: msg`Ine / Fo / Age / Cha`, simple: 1, pa: 3, ra: 10, unit: 1 },
      { stat: msg`Initiative`, simple: 1, pa: 3, ra: 10, unit: 0.1 },
      { stat: msg`Vitalité`, simple: 1, pa: 3, ra: 8, unit: 0.25 },
      { stat: msg`Pods`, simple: 3, pa: 8, ra: 25, unit: 0.25 }
    ]
  }
] as const satisfies readonly RuneFamily[]
