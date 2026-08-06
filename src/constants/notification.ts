/** One glyph per recognised event, so the seven rows can be told apart at speed. */

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

/** An eighth kind on the Rust side fails to compile here, and not in the screen. */
export const NOTIFICATION_ICONS = {
  combat: Swords,
  trade: ArrowLeftRight,
  group: Users,
  private_message: MessageSquare,
  challenge: Flag,
  craft: Hammer,
  perceptor: Coins
} as const satisfies Record<NotificationKind, LucideIcon>
