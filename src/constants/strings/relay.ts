import type {
  PairingProblem,
  RelayFailure,
  RelayLiveState
} from '@/@types/relay'

const networkLine = (detail: string) => {
  return `Telegram n’a pas répondu, vérifiez votre connexion (${detail}).`
}

const STATE_LINES = {
  active: {
    badge: 'En marche',
    title: 'Le relais transporte vos messages privés',
    body: 'Ils arrivent sur votre téléphone. Un raccourci de défilement le coupe aussi, dès que vous revenez au clavier.'
  },
  ready: {
    badge: 'À l’arrêt',
    title: 'Le relais ne transporte rien',
    body: 'Tout est prêt. Activez-le avant de quitter votre bureau, ici ou depuis la barre système.'
  },
  incomplete: {
    badge: 'Incomplet',
    title: 'Le relais ne peut pas démarrer',
    body: 'Il n’a personne à écouter. Cochez un personnage plus bas, ou ouvrez un client Dofus pour en faire apparaître un.'
  }
} as const satisfies Record<
  RelayLiveState,
  { badge: string; title: string; body: string }
>

const FAILURE_LINES = {
  keychain: (detail: string) => {
    return `Multifus n’a pas pu lire le jeton dans le trousseau du système (${detail}).`
  },
  telegram: (detail: string) => {
    return `Telegram a refusé la requête (${detail}).`
  },
  network: networkLine
} as const satisfies Record<RelayFailure['reason'], (detail: string) => string>

const PROBLEM_LINES = {
  tokenBlank: 'Collez d’abord le jeton que BotFather vous a envoyé.',
  tokenRefused: (detail: string) => {
    return `Telegram ne reconnaît pas ce jeton, recopiez-le en entier (${detail}).`
  },
  noChat:
    'Le jeton est bon : il ne manque que l’étape 4, votre message au robot.',
  keychain: (detail: string) => {
    return `Le trousseau n’a pas gardé le jeton, rien n’est enregistré (${detail}).`
  },
  network: (detail: string) => {
    return `Telegram n’a pas répondu, vérifiez votre connexion (${detail}).`
  }
} as const satisfies Record<
  PairingProblem['kind'],
  string | ((detail: string) => string)
>

export const RELAY_STRINGS = {
  relay: {
    title: 'Relais',
    subtitle:
      'Vos messages privés arrivent sur votre téléphone pendant que vous êtes ailleurs.',
    guideTitle: 'Mettre le relais en place',
    guideIntro:
      'Une seule fois, ici même. Les messages, eux, arriveront sur votre téléphone.',
    steps: {
      web: {
        title: 'Ouvrez Telegram dans votre navigateur',
        body: 'Connectez-vous en scannant le code affiché avec votre téléphone.',
        action: 'Ouvrir Telegram Web'
      },
      create: {
        title: 'Demandez un robot à BotFather',
        body: 'Écrivez-lui /newbot et suivez ses questions. Il répond en anglais.',
        action: 'Ouvrir BotFather'
      },
      paste: {
        title: 'Copiez son jeton, collez-le ci-dessous',
        body: 'Un clic sur le jeton dans Telegram suffit à le copier.'
      },
      write: {
        title: 'Écrivez « salut » à votre robot',
        body: 'Un robot ne peut pas écrire le premier : sans ça, il ne peut pas vous joindre.'
      },
      connect: {
        title: 'Cliquez sur Connecter',
        body: 'Multifus écrit à votre robot pour confirmer que la liaison tient.'
      }
    },
    help: 'Les robots Telegram, expliqués',
    tokenLabel: 'Jeton du robot',
    tokenPlaceholder: 'Collez ici le jeton donné par BotFather',
    connect: 'Connecter',
    connecting: 'Connexion…',
    botTitle: 'Robot Telegram relié',
    botBody:
      'Le jeton est rangé dans le trousseau du système, Multifus ne l’affiche nulle part. Un robot relié ne met pas le relais en marche, l’interrupteur du dessus s’en charge.',
    switchLabel: 'Activer le relais',
    unpair: 'Délier le robot',
    unpairing: 'Déliement…',
    state: STATE_LINES,
    testTitle: 'Message d’essai',
    testBody:
      'Un message part sur votre téléphone par le vrai chemin d’envoi, que le relais soit en marche ou à l’arrêt.',
    testAction: 'Envoyer un essai',
    testing: 'Envoi…',
    testSent: 'Message d’essai parti. Regardez votre téléphone.',
    testTooSoon:
      'Un essai vient de partir. Attendez une trentaine de secondes avant le suivant.',
    failure: FAILURE_LINES,
    problem: PROBLEM_LINES,
    bodyLabel: 'Envoyer le texte du message',
    bodyDescription:
      'Décoché, vous recevez le pseudo et le type, jamais ce qui a été écrit.',
    bodyNote:
      'Coché, le texte passe par Telegram, dont les conversations ne sont pas chiffrées de bout en bout.',
    charactersTitle: 'Personnages relayés',
    charactersBody:
      'On relaie son principal, pas ses mules. La veille n’y change rien.',
    characterToggle: (nickname: string) => {
      return `Relayer ${nickname}`
    },
    emptyBody:
      'Ouvrez un client Dofus : le personnage apparaît ici, déjà coché.',
    screenSaverTitle: 'Votre économiseur d’écran peut rendre le relais muet',
    screenSaverBody: (delay: string) => {
      return `Multifus garde l’écran allumé, mais l’économiseur démarre après ${delay} et verrouille la session, ce qui coupe la lecture des notifications. Réglez-le sur Jamais dans les réglages du système.`
    }
  }
} as const
