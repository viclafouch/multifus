import { msg } from '@lingui/core/macro'
import arena from '@multifus/ankama/images/arena.webp'
import camp from '@multifus/ankama/images/camp.webp'
import optionsGeneralEnglish from '@multifus/ankama/images/dofus-options-general.en.webp'
import optionsGeneralSpanish from '@multifus/ankama/images/dofus-options-general.es.webp'
import optionsGeneralFrench from '@multifus/ankama/images/dofus-options-general.fr.webp'
import forest from '@multifus/ankama/images/forest.webp'
import harbour from '@multifus/ankama/images/harbour.webp'
import pen from '@multifus/ankama/images/pen.webp'
import village from '@multifus/ankama/images/village.webp'
import type { Language } from '@/@types/language'
import type { Page, Step, SystemPage } from '@/@types/onboarding'
import type { Phrase } from '@/lib/i18n'

export const WELCOME_PAGE = 'welcome' satisfies Page

export const ONBOARDING_ANCHOR = 'onboarding'

export const SETTING_STEPS = [
  'authorization',
  'notifications',
  'focus',
  'gameSetting'
] as const satisfies readonly Step[]

export const PAGE_SCENES = {
  welcome: camp,
  authorization: village,
  notifications: harbour,
  focus: forest,
  gameSetting: pen,
  proof: arena
} as const satisfies Record<Page, string>

export const SYSTEM_PAGES = {
  welcome: null,
  authorization: 'authorization',
  notifications: 'notifications',
  focus: 'focus',
  gameSetting: null,
  proof: null
} as const satisfies Record<Page, SystemPage | null>

const OPTIONS_GENERAL = {
  fr: optionsGeneralFrench,
  en: optionsGeneralEnglish,
  es: optionsGeneralSpanish
} as const satisfies Record<Language, string>

export type Shot = {
  readonly full: Record<Language, string>
  readonly alt: Phrase
}

export const PAGE_SHOTS = {
  welcome: null,
  authorization: null,
  notifications: null,
  focus: null,
  gameSetting: {
    full: OPTIONS_GENERAL,
    alt: msg`Les options de Dofus, avec la case Notifications en arrière-plan cochée`
  },
  proof: null
} as const satisfies Record<Page, Shot | null>
