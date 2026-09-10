export const MOVES = [
  'autoFocus',
  'maximizeRow',
  'onboarding',
  'questions',
  'shortcuts'
] as const satisfies readonly string[]

export type Move = (typeof MOVES)[number]

export const MAXIMIZE_ANCHOR = 'agrandir-a-l-ouverture'
