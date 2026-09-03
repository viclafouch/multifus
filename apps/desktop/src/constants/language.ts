import type { Language } from '@/@types/language'

export const LANGUAGES = [
  'fr',
  'en',
  'es'
] as const satisfies readonly Language[]

export const LANGUAGE_LABELS = {
  fr: 'Français',
  en: 'English',
  es: 'Español'
} as const satisfies Record<Language, string>
