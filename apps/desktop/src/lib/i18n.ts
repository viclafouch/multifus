import type { MessageDescriptor, Messages } from '@lingui/core'
import { i18n } from '@lingui/core'
import type { Language } from '@/@types/language'
import { messages as en } from '@/locales/en/messages.po'
import { messages as fr } from '@/locales/fr/messages.po'

export type Phrase = Readonly<Omit<MessageDescriptor, 'values'>>

export const SOURCE_LANGUAGE = 'fr' as const satisfies Language

const CATALOGS = {
  fr,
  en
} as const satisfies Record<Language, Messages>

export const speak = (language: Language) => {
  i18n.loadAndActivate({ locale: language, messages: CATALOGS[language] })

  document.documentElement.lang = language
}
