import type {
  PairingProblem,
  RelayFailure,
  RelayLiveState
} from '@/@types/relay'

const networkLine = (detail: string) => {
  return `Telegram n’a pas répondu. Vérifiez votre connexion (${detail}).`
}

const STATE_LINES = {
  active: {
    badge: 'En marche',
    body: 'Vous ne raterez rien tant que Dofus Retro vous garde connecté. Un raccourci qui vous ramène sur une fenêtre coupe l’envoi, puisque vous voilà revenu.'
  },
  ready: {
    badge: 'À l’arrêt',
    body: 'Tout est prêt. Mettez l’interrupteur en marche avant de vous lever, ici ou depuis l’icône de Multifus.'
  },
  incomplete: {
    badge: 'Aucun personnage connecté',
    body: 'Multifus n’a personne à écouter. Cochez un personnage plus bas, ou connectez-en un dans Dofus Retro.'
  }
} as const satisfies Record<RelayLiveState, { badge: string; body: string }>

const FAILURE_LINES = {
  keychain: (detail: string) => {
    return `Multifus n’a pas retrouvé le code de votre robot (${detail}).`
  },
  telegram: (detail: string) => {
    return `Telegram a refusé la demande (${detail}).`
  },
  network: networkLine
} as const satisfies Record<RelayFailure['reason'], (detail: string) => string>

const PROBLEM_LINES = {
  tokenBlank: 'Collez d’abord le code que BotFather vous a envoyé.',
  tokenRefused: (detail: string) => {
    return `Telegram ne reconnaît pas ce code. Recopiez-le en entier (${detail}).`
  },
  noChat:
    'Le code est bon. Il ne manque que l’étape 4, votre « salut » au robot.',
  keychain: (detail: string) => {
    return `Le code n’a pas pu être enregistré, rien n’est gardé (${detail}).`
  },
  network: networkLine
} as const satisfies Record<
  PairingProblem['kind'],
  string | ((detail: string) => string)
>

export const RELAY_STRINGS = {
  relay: {
    title: 'Messages privés',
    subtitle:
      'Un joueur vous écrit pendant que vous êtes ailleurs ? Son message arrive sur votre téléphone, dans Telegram. Telegram, parce que c’est gratuit et que c’est la seule messagerie qu’un logiciel peut faire parler aussi simplement.',
    guideTitle: 'Relier votre téléphone',
    guideIntro:
      'Installez Telegram sur votre téléphone, puis suivez ces cinq étapes ici. Après, on n’y revient plus.',
    steps: {
      web: {
        title: 'Ouvrez Telegram sur cet ordinateur',
        body: 'Scannez le code affiché avec Telegram, sur votre téléphone.',
        action: 'Ouvrir Telegram Web'
      },
      create: {
        title: 'Demandez un robot à BotFather',
        body: 'Écrivez-lui /newbot et répondez à ses questions, il parle anglais. Ce robot sera le contact qui vous écrira.',
        action: 'Ouvrir BotFather'
      },
      paste: {
        title: 'Copiez le code du robot, collez-le ci-dessous',
        body: 'BotFather finit par une longue suite de chiffres et de lettres. Un clic dessus la copie.'
      },
      write: {
        title: 'Écrivez « salut » à votre robot',
        body: 'Un robot ne parle jamais le premier. Sans ce message, il n’a pas le droit de vous écrire.'
      },
      connect: {
        title: 'Cliquez sur Connecter',
        body: 'Multifus écrit à votre robot. Si le message arrive sur votre téléphone, c’est gagné.'
      }
    },
    help: 'À quoi sert un robot Telegram ?',
    tokenLabel: 'Code du robot',
    tokenPlaceholder: 'Collez ici le code donné par BotFather',
    connect: 'Connecter',
    connecting: 'Connexion…',
    botTitle: 'Robot Telegram relié',
    botBody:
      'C’est lui qui vous écrit dans Telegram. Le retirer coupe tout, et il faudra refaire les cinq étapes.',
    switchLabel: 'Recevoir mes messages privés sur mon téléphone',
    unpair: 'Retirer ce robot',
    unpairing: 'Retrait…',
    state: STATE_LINES,
    testTitle: 'Message d’essai',
    testBody:
      'Envoyez-vous un message maintenant, pour voir ce que ça donne dans Telegram.',
    testAction: 'Envoyer un essai',
    testing: 'Envoi…',
    testSent: 'C’est parti. Regardez votre téléphone.',
    testTooSoon:
      'Un essai vient de partir. Attendez une trentaine de secondes avant le suivant.',
    failure: FAILURE_LINES,
    problem: PROBLEM_LINES,
    bodyLabel: 'Recevoir ce que le joueur a écrit',
    bodyDescription:
      'Coché, vous lisez son message dans Telegram. Décoché, vous savez seulement lequel de vos personnages a reçu un message privé.',
    charactersTitle: 'Personnages relayés',
    charactersBody:
      'Cochez ceux dont vous voulez les messages privés, en général celui avec qui vous jouez vraiment. Un personnage déconnecté reste coché, et Multifus le reprend dès qu’il se reconnecte.',
    characterToggle: (nickname: string) => {
      return `Relayer ${nickname}`
    },
    emptyBody:
      'Connectez un personnage dans Dofus Retro : il arrive ici, déjà coché.',
    screenSaverTitle: 'Votre écran de veille peut tout arrêter',
    screenSaverBody: (delay: string) => {
      return `Multifus garde l’écran allumé, mais votre écran de veille démarre après ${delay} et verrouille l’ordinateur. Multifus n’entend plus le jeu, et vous ne recevez plus rien. Réglez-le sur Jamais.`
    }
  }
} as const
