import type { Language } from '@/@types/language'

export const LANGUAGES = ['fr', 'en'] as const satisfies readonly Language[]

export const LANGUAGE_LABELS = {
  fr: 'Français',
  en: 'English'
} as const satisfies Record<Language, string>
