import type { I18n, Messages } from '@lingui/core'
import { setupI18n } from '@lingui/core'
import type { Language } from '@/@types/language'
import { messages as en } from '@/locales/en/messages.po'
import { messages as es } from '@/locales/es/messages.po'
import { messages as fr } from '@/locales/fr/messages.po'

const CATALOGS = { fr, en, es } as const satisfies Record<Language, Messages>

export const SPEAKERS = {
  fr: setupI18n({ locale: 'fr', messages: { fr: CATALOGS.fr } }),
  en: setupI18n({ locale: 'en', messages: { en: CATALOGS.en } }),
  es: setupI18n({ locale: 'es', messages: { es: CATALOGS.es } })
} as const satisfies Record<Language, I18n>
