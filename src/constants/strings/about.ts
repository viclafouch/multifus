export const ABOUT_STRINGS = {
  about: {
    title: 'À propos',
    version: 'Version',
    configPath: 'Vos réglages',
    updateTitle: 'Mise à jour',
    updateChecking: 'Vérification en cours…',
    updateUpToDate: 'Vous avez la dernière version.',
    updateAvailable: (version: string) => {
      return `La version ${version} est disponible. Multifus se relancera une fois installée, sans toucher à vos clients Dofus Retro.`
    },
    updateInstalling: 'Téléchargement, puis Multifus se relancera.',
    updateFailed: (detail: string) => {
      return `La mise à jour n’a pas abouti : ${detail}`
    },
    check: 'Vérifier',
    install: 'Installer',
    legalTitle: 'Mentions légales',
    legalBody:
      'Multifus est un projet personnel indépendant, sans aucun lien avec Ankama. Dofus et Dofus Retro sont des marques déposées d’Ankama.',
    legalScope:
      'Multifus ne touche pas au jeu : il ne lit pas sa mémoire, ne joue jamais à votre place et ne modifie aucun de ses fichiers. Il déplace des fenêtres, et il écoute les notifications du système.',
    resetTitle: 'Tout remettre à neuf',
    resetBody:
      'Roster vidé, sexes oubliés, raccourcis et AutoFocus d’origine. Vos personnages Dofus Retro, eux, ne risquent rien.',
    reset: 'Tout réinitialiser',
    resetConfirmTitle: 'Tout remettre à neuf ?',
    resetConfirmBody:
      'Votre roster et vos sexes seront perdus. Vos personnages connectés réapparaîtront dans la seconde, sans leur sexe et dans le désordre.',
    resetConfirm: 'Réinitialiser',
    cancel: 'Annuler'
  }
} as const
