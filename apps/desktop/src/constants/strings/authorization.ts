import { IS_APPLE } from '@/constants/keyboard'

export const AUTHORIZATION_STRINGS = {
  authorization: {
    title: 'Multifus attend votre feu vert',
    body: IS_APPLE
      ? 'Sans l’autorisation Accessibilité, Multifus ne peut pas lire le pseudo dans le titre de vos fenêtres Dofus Retro, les mettre devant vous, ni entendre le jeu vous appeler.'
      : 'Sans l’accès aux notifications, Multifus ne peut pas entendre le jeu vous appeler, ni mettre la bonne fenêtre Dofus Retro devant vous.',
    patience: IS_APPLE
      ? 'macOS n’accorde jamais cette autorisation dans la seconde. Cochez Multifus dans Réglages Système, puis revenez : cet écran disparaîtra tout seul.'
      : 'Autorisez Multifus dans les réglages du système, puis revenez : cet écran disparaîtra tout seul.',
    request: 'Demander l’autorisation',
    openSettings: IS_APPLE
      ? 'Ouvrir Réglages Système'
      : 'Ouvrir les réglages du système'
  }
} as const
