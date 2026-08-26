import type { BannerCorner, WalkLiveState } from '@/@types/walk'

type StateLines = {
  readonly badge: string
  readonly body: string
}

const STATE_LINES = {
  on: {
    badge: 'Allumé',
    body: 'Cliquez pour déplacer, la fenêtre suivante arrive toute seule.'
  },
  off: {
    badge: 'Éteint',
    body: 'Vos clics vont au jeu, et à rien d’autre.'
  }
} as const satisfies Record<WalkLiveState, StateLines>

const CORNER_LABELS = {
  topLeft: 'En haut à gauche',
  topRight: 'En haut à droite',
  bottomLeft: 'En bas à gauche',
  bottomRight: 'En bas à droite'
} as const satisfies Record<BannerCorner, string>

const BANNER_STRINGS = {
  title: 'La bannière',
  description:
    'Elle s’affiche tant que le Déplacement rapide est allumé, et dit sur quel personnage vous venez d’arriver.',
  waiting: 'Déplacement rapide',
  previewing: 'Aperçu',
  cornerLegend: 'Le coin',
  screenLegend: 'L’écran',
  screenName: (rank: number) => {
    return `Écran ${rank}`
  },
  screenSize: (width: number, height: number) => {
    return `${width} × ${height}`
  },
  screenPrimary: 'principal',
  corners: CORNER_LABELS
} as const

export const WALK_STRINGS = {
  walk: {
    title: 'Déplacement rapide',
    subtitle:
      'Un clic déplace le personnage que vous avez devant vous, et la fenêtre du suivant prend sa place. Vous recliquez au même endroit, et toute la team change de map sans toucher au clavier.',
    switchLabel: 'Déplacement rapide',
    shortcutLabel: 'Raccourci',
    shortcutDescription: 'Allumez et éteignez sans quitter le jeu.',
    shortcutEmpty: 'Aucune',
    state: STATE_LINES,
    banner: BANNER_STRINGS
  }
} as const
