import { matchIsPlural } from '@/helpers/format'

export const WHEEL_STRINGS = {
  wheel: {
    title: 'La roue des personnages',
    subtitle:
      'Maintenez vos touches dans le jeu : la roue s’ouvre au milieu de l’écran. Visez une tête, lâchez ou cliquez, la fenêtre passe devant.',
    shortcutLabel: 'Raccourci',
    shortcutDescription: 'Depuis une fenêtre du jeu, et nulle part ailleurs.',
    unbound:
      'Sans touches, la roue n’existe pas. Posez-en dans l’écran Raccourcis.',
    previewTitle: 'L’aperçu',
    previewDescription:
      'De faux personnages ici comme à l’essai, les vôtres en jeu. Une jauge pour la taille, une pour le monde qu’il y a dessus.',
    sizeLabel: 'Taille',
    sizeValue: (diameter: number) => {
      return `${diameter} px`
    },
    crowdLabel: 'Personnages',
    crowdValue: (crowd: number) => {
      return matchIsPlural(crowd) ? `À ${crowd}` : 'Tout seul'
    },
    drawingLabel: 'La roue au milieu de votre écran',
    tryIt: 'Voir en vrai',
    nobody: 'Personne de connecté'
  }
} as const
