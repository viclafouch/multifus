import type { NotificationKind } from '@/@types/notification'
import { IS_APPLE } from '@/constants/keyboard'

const KIND_LABELS = {
  combat: {
    label: 'Combat',
    description: 'C’est au tour de ce personnage de jouer.'
  },
  trade: {
    label: 'Échange',
    description: 'Quelqu’un propose un échange.'
  },
  group: {
    label: 'Groupe',
    description: 'Invitation à rejoindre un groupe ou une guilde.'
  },
  private_message: {
    label: 'Message privé',
    description: 'Un message privé arrive.'
  },
  challenge: {
    label: 'Défi',
    description: 'Quelqu’un lance un défi en duel.'
  },
  craft: {
    label: 'Craft',
    description: 'Appel à un artisan, invitation à un atelier, objets prêts.'
  },
  perceptor: {
    label: 'Percepteur',
    description: 'Un percepteur est attaqué.'
  }
} as const satisfies Record<
  NotificationKind,
  { readonly label: string; readonly description: string }
>

export const AUTO_FOCUS_STRINGS = {
  autoFocus: {
    title: 'AutoFocus',
    subtitle: 'Réglages valables pour tout le roster.',
    masterLabel: 'AutoFocus',
    masterDescription: 'Ramène la fenêtre qui reçoit une notification.',
    minimizedLabel: 'Fenêtres réduites',
    minimizedDescription: IS_APPLE
      ? 'Rouvre de force celles rangées dans le Dock.'
      : 'Rouvre de force celles rangées dans la barre des tâches.',
    kinds: KIND_LABELS
  }
} as const
