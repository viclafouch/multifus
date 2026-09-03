import type { LucideIcon } from 'lucide-react'
import {
  Footprints,
  Gem,
  Info,
  Keyboard,
  MessageSquareQuote,
  Send,
  SlidersHorizontal,
  Target,
  Users,
  Zap
} from 'lucide-react'
import { msg } from '@lingui/core/macro'
import type { ScreenName } from '@/@types/snapshot'
import type { Phrase } from '@/lib/i18n'

export type NavItem = {
  readonly name: ScreenName
  readonly label: Phrase
  readonly Icon: LucideIcon
}

export const NAV_ITEMS = [
  { name: 'characters', label: msg`Personnages`, Icon: Users },
  { name: 'shortcuts', label: msg`Raccourcis`, Icon: Keyboard },
  {
    name: 'quickReplies',
    label: msg`Réponses rapides`,
    Icon: MessageSquareQuote
  },
  { name: 'autoFocus', label: msg`AutoFocus`, Icon: Zap },
  { name: 'walk', label: msg`Déplacement rapide`, Icon: Footprints },
  { name: 'wheel', label: msg`Roue des personnages`, Icon: Target },
  { name: 'runeTable', label: msg`Tableau des runes`, Icon: Gem },
  { name: 'relay', label: msg`Messages privés`, Icon: Send },
  { name: 'settings', label: msg`Paramètres`, Icon: SlidersHorizontal },
  { name: 'about', label: msg`À propos`, Icon: Info }
] as const satisfies readonly NavItem[]
