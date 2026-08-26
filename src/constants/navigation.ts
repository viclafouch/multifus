import type { LucideIcon } from 'lucide-react'
import {
  Footprints,
  Info,
  Keyboard,
  Send,
  SlidersHorizontal,
  Users,
  Zap
} from 'lucide-react'
import type { ScreenName } from '@/@types/snapshot'
import { strings } from '@/constants/strings'

export type NavItem = {
  readonly name: ScreenName
  readonly label: string
  readonly Icon: LucideIcon
}

export const NAV_ITEMS = [
  { name: 'characters', label: strings.nav.characters, Icon: Users },
  { name: 'shortcuts', label: strings.nav.shortcuts, Icon: Keyboard },
  { name: 'autoFocus', label: strings.nav.autoFocus, Icon: Zap },
  { name: 'walk', label: strings.nav.walk, Icon: Footprints },
  { name: 'relay', label: strings.nav.relay, Icon: Send },
  { name: 'settings', label: strings.nav.settings, Icon: SlidersHorizontal },
  { name: 'about', label: strings.nav.about, Icon: Info }
] as const satisfies readonly NavItem[]
