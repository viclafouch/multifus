import type { LucideIcon } from 'lucide-react'
import { Bell, Ear, Gamepad2, Moon, Sparkles, Unlock } from 'lucide-react'
import { msg } from '@lingui/core/macro'
import type { Page, SystemPage } from '@/@types/onboarding'
import backgroundNotifications from '@/assets/dofus-background-notifications.png'
import optionsGeneral from '@/assets/dofus-options-general.png'
import type { Phrase } from '@/lib/i18n'

export const WELCOME_PAGE = 'welcome' satisfies Page

export const PAGE_ICONS = {
  welcome: Sparkles,
  authorization: Unlock,
  notifications: Bell,
  focus: Moon,
  gameSetting: Gamepad2,
  proof: Ear
} as const satisfies Record<Page, LucideIcon>

export const SYSTEM_PAGES = {
  welcome: null,
  authorization: 'authorization',
  notifications: 'notifications',
  focus: 'focus',
  gameSetting: null,
  proof: null
} as const satisfies Record<Page, SystemPage | null>

type Shot = {
  readonly crop: string
  readonly full: string
  readonly alt: Phrase
}

export const PAGE_SHOTS = {
  welcome: null,
  authorization: null,
  notifications: null,
  focus: null,
  gameSetting: {
    crop: backgroundNotifications,
    full: optionsGeneral,
    alt: msg`Les options de Dofus, avec la case Notifications en arrière-plan cochée`
  },
  proof: null
} as const satisfies Record<Page, Shot | null>
