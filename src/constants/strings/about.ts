/** The words of the À propos screen: identity, update, legal notice, reset. */

import { IS_APPLE } from '@/lib/accelerator'

export const ABOUT_STRINGS = {
  about: {
    title: 'À propos',
    version: 'Version',
    configPath: 'Configuration',
    startupLabel: 'Démarrer avec la session',
    startupDescription:
      'multifus s’ouvre en même temps que votre session, pour n’avoir à y penser qu’une fois.',
    // The one behaviour of step 8 the user has to be told about, since nothing
    // on screen would otherwise explain where the application went.
    startupNote: IS_APPLE
      ? 'Fermer la fenêtre ne quitte plus multifus : il continue dans la barre système, en haut à droite de l’écran, et c’est de là qu’on le quitte.'
      : 'Fermer la fenêtre ne quitte plus multifus : il continue dans la barre système, à côté de l’horloge, et c’est de là qu’on le quitte.',
    updateTitle: 'Mise à jour',
    updateChecking: 'Vérification en cours…',
    updateUpToDate: 'Cette version est la dernière publiée.',
    // The restart is said here rather than in a confirmation dialog: it is the
    // one consequence worth knowing before clicking.
    updateAvailable: (version: string) => {
      return `La version ${version} est disponible. multifus se relancera une fois installée, sans toucher aux clients Dofus.`
    },
    updateInstalling: 'Téléchargement, puis multifus se relancera.',
    updateFailed: (detail: string) => {
      return `La mise à jour n’a pas abouti : ${detail}`
    },
    check: 'Vérifier',
    install: 'Installer',
    legalTitle: 'Mentions légales',
    legalBody:
      'multifus est un projet personnel indépendant, sans aucun lien avec Ankama. Dofus et Dofus Retro sont des marques déposées d’Ankama.',
    legalScope:
      'multifus ne lit pas la mémoire du client, ne simule aucune action de jeu et ne modifie aucun fichier. Il ne fait que gérer des fenêtres et lire des notifications du système.',
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
