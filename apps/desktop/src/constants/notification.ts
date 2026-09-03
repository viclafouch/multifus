import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  Coins,
  Flag,
  Hammer,
  MessageSquare,
  Swords,
  Users
} from 'lucide-react'
import { msg } from '@lingui/core/macro'
import type { NotificationKind } from '@/@types/notification'
import type { Phrase } from '@/lib/i18n'

export const NOTIFICATION_ICONS = {
  combat: Swords,
  trade: ArrowLeftRight,
  group: Users,
  private_message: MessageSquare,
  challenge: Flag,
  craft: Hammer,
  perceptor: Coins
} as const satisfies Record<NotificationKind, LucideIcon>

type KindLabel = {
  readonly label: Phrase
  readonly description: Phrase
}

export const NOTIFICATION_LABELS = {
  combat: {
    label: msg`Combat`,
    description: msg`C’est à votre tour de jouer.`
  },
  trade: {
    label: msg`Échange`,
    description: msg`Quelqu’un vous propose un échange.`
  },
  group: {
    label: msg`Groupe`,
    description: msg`On vous invite dans un groupe ou une guilde.`
  },
  private_message: {
    label: msg`Message privé`,
    description: msg`Quelqu’un vous écrit en privé.`
  },
  challenge: {
    label: msg`Défi`,
    description: msg`Quelqu’un vous lance un défi en duel.`
  },
  craft: {
    label: msg`Craft`,
    description: msg`On vous appelle pour un craft, ou vos objets sont prêts.`
  },
  perceptor: {
    label: msg`Percepteur`,
    description: msg`Votre percepteur est attaqué.`
  }
} as const satisfies Record<NotificationKind, KindLabel>
