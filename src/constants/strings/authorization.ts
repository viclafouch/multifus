/** The words of the screen shown while the system says no. */

import { IS_APPLE } from '@/constants/keyboard'

export const AUTHORIZATION_STRINGS = {
  authorization: {
    title: 'Autorisation requise',
    body: IS_APPLE
      ? 'Multifus a besoin de l’accès à l’Accessibilité pour lire le titre des fenêtres Dofus, les amener au premier plan et entendre les notifications du jeu.'
      : 'Multifus a besoin de l’accès aux notifications pour entendre les événements du jeu et amener la bonne fenêtre au premier plan.',
    patience: IS_APPLE
      ? 'macOS n’accorde jamais cette autorisation dans la seconde. Cochez Multifus dans Réglages Système, puis revenez : cet écran disparaîtra tout seul.'
      : 'Autorisez Multifus dans les réglages du système, puis revenez : cet écran disparaîtra tout seul.',
    request: 'Demander l’autorisation',
    openSettings: IS_APPLE
      ? 'Ouvrir Réglages Système'
      : 'Ouvrir les réglages du système'
  }
} as const
