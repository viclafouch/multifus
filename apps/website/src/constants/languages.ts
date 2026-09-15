import type { Language } from '../@types/language.ts'

export const SOURCE_LANGUAGE = 'fr' satisfies Language

export const LANGUAGES = [
  'fr',
  'en',
  'es'
] as const satisfies readonly Language[]

export const OPEN_GRAPH_LOCALES = {
  fr: 'fr_FR',
  en: 'en_US',
  es: 'es_ES'
} as const satisfies Record<Language, string>

export const LANGUAGE_NAMES = {
  fr: 'Français',
  en: 'English',
  es: 'Español'
} as const satisfies Record<Language, string>
