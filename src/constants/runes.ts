export type RuneFamilyName =
  | 'damage'
  | 'heavy'
  | 'primary'
  | 'resistance'
  | 'secondary'

export type RuneRow = {
  readonly stat: string
  readonly simple: number
  readonly pa: number | null
  readonly ra: number | null
  readonly unit: number
}

export type RuneFamily = {
  readonly name: RuneFamilyName
  readonly rows: readonly RuneRow[]
}

export const PLATE_DRAWN_WIDTH = 320

export const RUNE_FAMILIES = [
  {
    name: 'heavy',
    rows: [
      { stat: 'PA', simple: 100, pa: null, ra: null, unit: 100 },
      { stat: 'PM', simple: 90, pa: null, ra: null, unit: 90 },
      { stat: 'PO', simple: 51, pa: null, ra: null, unit: 51 },
      { stat: 'Invocation', simple: 30, pa: null, ra: null, unit: 30 },
      { stat: 'Critique', simple: 30, pa: null, ra: null, unit: 30 },
      { stat: 'Soin', simple: 20, pa: null, ra: null, unit: 20 }
    ]
  },
  {
    name: 'damage',
    rows: [
      { stat: 'Renvoi de dommages', simple: 30, pa: null, ra: null, unit: 30 },
      { stat: 'Dommages', simple: 20, pa: null, ra: null, unit: 20 },
      { stat: 'Dommages piège', simple: 15, pa: 45, ra: null, unit: 15 },
      { stat: '% piège', simple: 2, pa: 6, ra: null, unit: 2 },
      { stat: '% dommages', simple: 2, pa: 6, ra: 20, unit: 2 }
    ]
  },
  {
    name: 'resistance',
    rows: [
      { stat: '% résistance', simple: 4, pa: null, ra: null, unit: 4 },
      { stat: 'Résistance fixe', simple: 5, pa: null, ra: null, unit: 5 }
    ]
  },
  {
    name: 'secondary',
    rows: [
      { stat: 'Sagesse', simple: 3, pa: 9, ra: 30, unit: 3 },
      { stat: 'Prospection', simple: 3, pa: 9, ra: null, unit: 3 },
      { stat: 'Chasse', simple: 5, pa: null, ra: null, unit: 5 }
    ]
  },
  {
    name: 'primary',
    rows: [
      { stat: 'Ine / Fo / Age / Cha', simple: 1, pa: 3, ra: 10, unit: 1 },
      { stat: 'Initiative', simple: 1, pa: 3, ra: 10, unit: 0.1 },
      { stat: 'Vitalité', simple: 1, pa: 3, ra: 8, unit: 0.25 },
      { stat: 'Pods', simple: 3, pa: 8, ra: 25, unit: 0.25 }
    ]
  }
] as const satisfies readonly RuneFamily[]
