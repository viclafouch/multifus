export const WALK_STRINGS = {
  walk: {
    title: 'Déplacement',
    subtitle:
      'Vous cliquez pour déplacer votre principal, la fenêtre de la mule prend sa place. Vous cliquez encore, et les deux ont bougé sans toucher au clavier.',
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
    measures: {
      title: 'Dernières bascules',
      legend: (count: number) => {
        return count === 1 ? '1 mesure' : `${count} mesures`
      },
      last: 'Dernière',
      worst: 'La pire',
      budget: 'budget',
      unit: 'ms',
      empty:
        'Rien de mesuré. Allumez le Déplacement, cliquez dans une fenêtre du jeu, et le temps de la bascule s’écrit ici.',
      lost: 'La fenêtre visée n’est jamais passée devant.',
      reading:
        'Du relâchement du bouton à la fenêtre suivante au premier plan. Sous le budget, un joueur qui enchaîne deux clics ne perd pas le second.'
    }
  }
} as const
