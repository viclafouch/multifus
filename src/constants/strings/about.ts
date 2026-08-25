export const ABOUT_STRINGS = {
  about: {
    title: 'À propos',
    version: 'Version',
    configPath: 'Configuration',
    updateTitle: 'Mise à jour',
    updateChecking: 'Vérification en cours…',
    updateUpToDate: 'Cette version est la dernière publiée.',
    updateAvailable: (version: string) => {
      return `La version ${version} est disponible. Multifus se relancera une fois installée, sans toucher aux clients Dofus.`
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
      'Multifus ne lit pas la mémoire du client, ne simule aucune action de jeu et ne modifie aucun fichier. Il ne fait que gérer des fenêtres et lire des notifications du système.',
    resetTitle: 'Réinitialisation',
    resetBody:
      'Remet la configuration à son état d’origine : roster vidé, sexes oubliés, raccourcis et AutoFocus par défaut.',
    reset: 'Tout réinitialiser',
    resetConfirmTitle: 'Tout réinitialiser ?',
    resetConfirmBody:
      'Le roster sera vidé et les sexes assignés seront perdus. Les personnages actuellement connectés réapparaîtront dans la seconde, mais sans leur sexe et dans l’ordre où le système les rend.',
    resetConfirm: 'Réinitialiser',
    cancel: 'Annuler'
  }
} as const
