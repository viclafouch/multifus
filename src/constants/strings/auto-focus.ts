import type { NotificationKind } from '@/@types/notification'
import { IS_APPLE } from '@/constants/keyboard'

const KIND_LABELS = {
  combat: {
    label: 'Combat',
    description: 'C’est à votre tour de jouer.'
  },
  trade: {
    label: 'Échange',
    description: 'Quelqu’un vous propose un échange.'
  },
  group: {
    label: 'Groupe',
    description: 'On vous invite dans un groupe ou une guilde.'
  },
  private_message: {
    label: 'Message privé',
    description: 'Quelqu’un vous écrit en privé.'
  },
  challenge: {
    label: 'Défi',
    description: 'Quelqu’un vous lance un défi en duel.'
  },
  craft: {
    label: 'Craft',
    description: 'On vous appelle pour un craft, ou vos objets sont prêts.'
  },
  perceptor: {
    label: 'Percepteur',
    description: 'Votre percepteur est attaqué.'
  }
} as const satisfies Record<
  NotificationKind,
  { readonly label: string; readonly description: string }
>

export const AUTO_FOCUS_STRINGS = {
  autoFocus: {
    title: 'AutoFocus',
    subtitle:
      'Six personnages en combat, et vous passez votre temps à chercher qui doit jouer. Multifus met la bonne fenêtre devant vous dès que le jeu l’appelle.',
    masterLabel: 'Activer l’AutoFocus',
    masterDescription: 'La fenêtre appelée passe devant, sans y toucher.',
    minimizedLabel: 'Aller chercher les fenêtres réduites',
    minimizedDescription: IS_APPLE
      ? 'Une fenêtre rangée dans le Dock revient devant vous elle aussi.'
      : 'Une fenêtre rangée dans la barre des tâches revient devant vous elle aussi.',
    kinds: KIND_LABELS
  }
} as const
