type LegalParagraph = {
  readonly lead: string
  readonly body: string
}

const LEGAL_PARAGRAPHS = [
  {
    lead: 'Multifus n’a rien à voir avec Ankama.',
    body: 'Dofus, Dofus Retro et les têtes de classe appartiennent à Ankama.'
  },
  {
    lead: 'Multifus ne touche pas au jeu.',
    body: 'Ni sa mémoire, ni ses fichiers, ni ses paquets : il range vos fenêtres, lit les notifications et prend vos clics.'
  },
  {
    lead: 'Rien ne quitte votre ordinateur sans vous.',
    body: 'Multifus cherche ses mises à jour, et relaie vos messages privés seulement si vous reliez Telegram.'
  }
] as const satisfies readonly LegalParagraph[]

export const ABOUT_STRINGS = {
  about: {
    title: 'À propos',
    tagline:
      'Le multicompte confortable sur Dofus Retro : Multifus range vos fenêtres, vous jouez.',
    version: 'Version',
    system: 'Système',
    configPath: 'Vos réglages',
    configCopy: 'Copier le chemin',
    configCopied: 'Chemin copié',
    configReveal: 'Montrer le fichier des réglages',
    projectTitle: 'Le projet',
    projectDescription: 'Gratuit, sans compte et sans publicité.',
    updateTitle: 'Mise à jour',
    updateChecking: 'Vérification en cours…',
    updateUpToDate: 'Vous êtes à jour.',
    updateAvailable: (version: string) => {
      return `La version ${version} est prête. Multifus se relancera tout seul, sans toucher à vos clients.`
    },
    updateInstalling: 'Téléchargement en cours…',
    updateFailed: (detail: string) => {
      return `La mise à jour a échoué : ${detail}`
    },
    check: 'Vérifier',
    install: 'Installer',
    sourceLabel: 'Comment Multifus est développé',
    sourceDescription: 'Le code est public, rien n’est caché.',
    sourceOpen: 'Aller voir',
    issuesLabel: 'Signaler un problème',
    issuesDescription: 'Un bug, une idée : c’est ici que ça se raconte.',
    issuesOpen: 'Aller le dire',
    legalTitle: 'Mentions légales',
    legal: LEGAL_PARAGRAPHS,
    resetTitle: 'Tout remettre à neuf',
    resetBody:
      'Multifus repart comme au premier lancement. Vos personnages Dofus Retro ne risquent rien.',
    reset: 'Tout réinitialiser',
    resetConfirmTitle: 'Tout remettre à neuf ?',
    resetConfirmBody:
      'Réglages, roster et raccourcis repartent d’origine. Vos personnages connectés reviendront dans la seconde, sans sexe ni classe.',
    resetConfirm: 'Réinitialiser',
    cancel: 'Annuler'
  }
} as const
