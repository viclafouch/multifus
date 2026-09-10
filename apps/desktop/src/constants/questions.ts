import type { SystemPage } from '@/@types/onboarding'
import { IS_APPLE } from '@/constants/keyboard'
import type { Move } from '@/constants/moves'

export const QUESTIONS = [
  'banner',
  'silence',
  'maximize',
  'shortcuts',
  'gone'
] as const satisfies readonly string[]

export type Question = (typeof QUESTIONS)[number]

export const QUESTION_PAGES = {
  banner: IS_APPLE ? null : 'notifications',
  silence: null,
  maximize: null,
  shortcuts: null,
  gone: null
} as const satisfies Record<Question, SystemPage | null>

export const QUESTION_MOVES = {
  banner: null,
  silence: 'onboarding',
  maximize: 'maximizeRow',
  shortcuts: 'shortcuts',
  gone: null
} as const satisfies Record<Question, Move | null>
