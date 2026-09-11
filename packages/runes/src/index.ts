export type RuneFamilyId =
  | 'damage'
  | 'heavy'
  | 'primary'
  | 'resistance'
  | 'secondary'

export type RuneStatId =
  | 'actionPoint'
  | 'critical'
  | 'damage'
  | 'damagePercent'
  | 'damageReturn'
  | 'elements'
  | 'heal'
  | 'hunt'
  | 'initiative'
  | 'movePoint'
  | 'pods'
  | 'prospecting'
  | 'range'
  | 'resistFlat'
  | 'resistPercent'
  | 'summon'
  | 'trapDamage'
  | 'trapPercent'
  | 'vitality'
  | 'wisdom'

export type RuneWeights = Readonly<{
  simple: number
  pa: number | null
  ra: number | null
  unit: number
}>

export const RUNE_FAMILY_IDS = [
  'heavy',
  'damage',
  'resistance',
  'secondary',
  'primary'
] as const satisfies readonly RuneFamilyId[]

export const RUNE_FAMILY_STATS = {
  heavy: ['actionPoint', 'movePoint', 'range', 'summon', 'critical', 'heal'],
  damage: [
    'damageReturn',
    'damage',
    'trapDamage',
    'trapPercent',
    'damagePercent'
  ],
  resistance: ['resistPercent', 'resistFlat'],
  secondary: ['wisdom', 'prospecting', 'hunt'],
  primary: ['elements', 'initiative', 'vitality', 'pods']
} as const satisfies Record<RuneFamilyId, readonly RuneStatId[]>

export const RUNE_WEIGHTS = {
  actionPoint: { simple: 100, pa: null, ra: null, unit: 100 },
  movePoint: { simple: 90, pa: null, ra: null, unit: 90 },
  range: { simple: 51, pa: null, ra: null, unit: 51 },
  summon: { simple: 30, pa: null, ra: null, unit: 30 },
  critical: { simple: 30, pa: null, ra: null, unit: 30 },
  heal: { simple: 20, pa: null, ra: null, unit: 20 },
  damageReturn: { simple: 30, pa: null, ra: null, unit: 30 },
  damage: { simple: 20, pa: null, ra: null, unit: 20 },
  trapDamage: { simple: 15, pa: 45, ra: null, unit: 15 },
  trapPercent: { simple: 2, pa: 6, ra: null, unit: 2 },
  damagePercent: { simple: 2, pa: 6, ra: 20, unit: 2 },
  resistPercent: { simple: 4, pa: null, ra: null, unit: 4 },
  resistFlat: { simple: 5, pa: null, ra: null, unit: 5 },
  wisdom: { simple: 3, pa: 9, ra: 30, unit: 3 },
  prospecting: { simple: 3, pa: 9, ra: null, unit: 3 },
  hunt: { simple: 5, pa: null, ra: null, unit: 5 },
  elements: { simple: 1, pa: 3, ra: 10, unit: 1 },
  initiative: { simple: 1, pa: 3, ra: 10, unit: 0.1 },
  vitality: { simple: 1, pa: 3, ra: 8, unit: 0.25 },
  pods: { simple: 3, pa: 8, ra: 25, unit: 0.25 }
} as const satisfies Record<RuneStatId, RuneWeights>

export const RUNE_STAT_IDS = RUNE_FAMILY_IDS.flatMap((family) => {
  return RUNE_FAMILY_STATS[family]
})

const WEIGHT_DECIMALS = 2

type FormatWeightParams = Readonly<{
  weight: number
  locale: string
}>

export const formatWeight = ({ weight, locale }: FormatWeightParams) => {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: WEIGHT_DECIMALS
  }).format(weight)
}
