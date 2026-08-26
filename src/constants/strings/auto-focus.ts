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
      'Vous jouez plusieurs personnages à la fois. Multifus affiche celui dont c’est le tour, vous n’avez rien à cliquer.',
    masterLabel: 'Activer l’AutoFocus',
    masterDescription: 'Le bon personnage s’affiche tout seul.',
    minimizedLabel: 'Aller chercher les fenêtres réduites',
    minimizedDescription: IS_APPLE
      ? 'Même un personnage rangé dans le Dock revient devant vous.'
      : 'Même un personnage rangé dans la barre des tâches revient devant vous.',
    kindsTitle: 'Quand Multifus change de fenêtre',
    kindsDescription:
      'À ces moments, le personnage concerné passe devant. Cela vaut pour tous vos personnages.',
    kinds: KIND_LABELS
  }
} as const
