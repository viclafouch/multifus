import type { MessageDescriptor, Messages } from '@lingui/core'
import { i18n } from '@lingui/core'
import type { Language } from '@/@types/language'

export type Phrase = Readonly<Omit<MessageDescriptor, 'values'>>

export const SOURCE_LANGUAGE = 'fr' as const satisfies Language

const CATALOGS = {
  fr: async () => {
    return import('@/locales/fr/messages.po')
  },
  en: async () => {
    return import('@/locales/en/messages.po')
  },
  es: async () => {
    return import('@/locales/es/messages.po')
  }
} as const satisfies Record<Language, () => Promise<{ messages: Messages }>>

export const speak = async (language: Language) => {
  const { messages } = await CATALOGS[language]()

  i18n.loadAndActivate({ locale: language, messages })

  document.documentElement.lang = language
}
