export const WALK_STRINGS = {
  walk: {
    title: 'Déplacement',
    subtitle:
      'Vous cliquez pour déplacer un personnage, la fenêtre du suivant prend sa place. Vous cliquez encore, et les deux ont bougé sans toucher au clavier.',
    switchLabel: 'Activer le Déplacement',
    switchDescription:
      'Chaque clic gauche dans une fenêtre Dofus Retro amène le personnage suivant du défilement devant vous.',
    shortcutLabel: 'Raccourci',
    shortcutDescription:
      'Il allume et éteint le Déplacement, où que vous soyez : dans le jeu comme dans Multifus.',
    shortcutEmpty: 'Aucune',
    startsOff:
      'Multifus démarre toujours Déplacement éteint. Un mode qui change le sens de chaque clic ne se rallume pas tout seul.',
    privacy:
      'Tant que le Déplacement est allumé, Multifus voit passer tous vos clics gauche pour savoir lesquels tombent sur une fenêtre du jeu. Rien n’en sort, rien ne s’écrit.',
    unavailable:
      'Le Déplacement n’existe que sur Windows pour l’instant. Sur macOS, l’interrupteur ne fait rien.',
    banner: {
      title: 'La bannière',
      description:
        'Au-dessus du jeu, elle rappelle sur qui vous êtes. Ailleurs — le bureau, un navigateur — elle s’efface. Déplacement éteint, elle n’existe pas : ni fenêtre, ni mémoire prise au jeu.',
      waiting: 'Déplacement',
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
      hint: 'Désignez un coin : la bannière va s’y poser pour de vrai, deux secondes et demie.',
      corners: {
        topLeft: 'En haut à gauche',
        topRight: 'En haut à droite',
        bottomLeft: 'En bas à gauche',
        bottomRight: 'En bas à droite'
      }
    }
  }
} as const
