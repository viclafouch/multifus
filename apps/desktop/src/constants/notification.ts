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
import type { NotificationKind } from '@/@types/notification'

export const NOTIFICATION_ICONS = {
  combat: Swords,
  trade: ArrowLeftRight,
  group: Users,
  private_message: MessageSquare,
  challenge: Flag,
  craft: Hammer,
  perceptor: Coins
} as const satisfies Record<NotificationKind, LucideIcon>
