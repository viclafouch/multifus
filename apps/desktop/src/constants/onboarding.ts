import { msg } from '@lingui/core/macro'
import type { Page, SystemPage } from '@/@types/onboarding'
import arena from '@/assets/ankama/arena.webp'
import camp from '@/assets/ankama/camp.webp'
import forest from '@/assets/ankama/forest.webp'
import harbour from '@/assets/ankama/harbour.webp'
import pen from '@/assets/ankama/pen.webp'
import village from '@/assets/ankama/village.webp'
import optionsGeneral from '@/assets/dofus-options-general.png'
import type { Phrase } from '@/lib/i18n'

export const WELCOME_PAGE = 'welcome' satisfies Page

export const ONBOARDING_ANCHOR = 'prise-en-main'

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

export type Shot = {
  readonly full: string
  readonly alt: Phrase
}

export const PAGE_SHOTS = {
  welcome: null,
  authorization: null,
  notifications: null,
  focus: null,
  gameSetting: {
    full: optionsGeneral,
    alt: msg`Les options de Dofus, avec la case Notifications en arrière-plan cochée`
  },
  proof: null
} as const satisfies Record<Page, Shot | null>
