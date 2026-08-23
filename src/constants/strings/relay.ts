/** The words of the Relais screen, tutorial included. */

import type {
  PairingProblem,
  RelayFailure,
  RelayLiveState
} from '@/@types/relay'

/** Telegram never answered, the one failure the two tables below share. */
const networkLine = (detail: string) => {
  return `Telegram n’a pas répondu, vérifiez votre connexion (${detail}).`
}

/**
 * A badge, a title and a line each. The badge is the word read from the doorway,
 * the title says what that means, and the line says what to do about it.
 */
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
    // Both halves, since the list below is empty until a client is open, and
    // « cochez un personnage » alone then points at nothing.
    body: 'Il n’a personne à écouter. Cochez un personnage plus bas, ou ouvrez un client Dofus pour en faire apparaître un.'
  }
} as const satisfies Record<
  RelayLiveState,
  { badge: string; title: string; body: string }
>

/**
 * Why the test did not go out. The three places of the journal, in the register
 * of a screen: no « Relais : » prefix, since we are on it.
 */
const FAILURE_LINES = {
  // Never « le trousseau a refusé »: the commonest case by far is the user
  // clicking Refuser on the dialog, which is a choice and not a fault.
  keychain: (detail: string) => {
    return `multifus n’a pas pu lire le jeton dans le trousseau du système (${detail}).`
  },
  telegram: (detail: string) => {
    return `Telegram a refusé la requête (${detail}).`
  },
  network: networkLine
} as const satisfies Record<RelayFailure['reason'], (detail: string) => string>

/**
 * One line each, since the five steps are on screen right above: a message that
 * names the step left to do beats one that repeats it.
 */
const PROBLEM_LINES = {
  tokenBlank: 'Collez d’abord le jeton que BotFather vous a envoyé.',
  tokenRefused: (detail: string) => {
    return `Telegram ne reconnaît pas ce jeton, recopiez-le en entier (${detail}).`
  },
  // Not a failure but the half of the pairing only the user can do, so it is
  // worded as one step left and never as « échec ».
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
    // The whole setup happens in Telegram Web, on this machine, which is what
    // makes the token a copy and paste. Each step says why when the why surprises.
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
        body: 'multifus écrit à votre robot pour confirmer que la liaison tient.'
      }
    },
    help: 'Les robots Telegram, expliqués',
    tokenLabel: 'Jeton du robot',
    tokenPlaceholder: 'Collez ici le jeton donné par BotFather',
    connect: 'Connecter',
    connecting: 'Connexion…',
    // « Connecté » read as « le relais marche », which is the one thing this
    // screen must not let anybody believe. The line says so outright.
    botTitle: 'Robot Telegram relié',
    botBody:
      'Le jeton est rangé dans le trousseau du système, multifus ne l’affiche nulle part. Un robot relié ne met pas le relais en marche, l’interrupteur du dessus s’en charge.',
    switchLabel: 'Activer le relais',
    unpair: 'Délier le robot',
    unpairing: 'Déliement…',
    state: STATE_LINES,
    // The one thing this screen can prove rather than claim. The line says it
    // goes out either way, since that is the first question the button raises.
    testTitle: 'Message d’essai',
    testBody:
      'Un message part sur votre téléphone par le vrai chemin d’envoi, que le relais soit en marche ou à l’arrêt.',
    testAction: 'Envoyer un essai',
    testing: 'Envoi…',
    testSent: 'Message d’essai parti. Regardez votre téléphone.',
    // No countdown in the sentence: a snapshot only goes out when something
    // moved, so a number written here would freeze and lie.
    testTooSoon:
      'Un essai vient de partir. Attendez une trentaine de secondes avant le suivant.',
    // Shared with the switch: a start and a test fail in the same three places.
    failure: FAILURE_LINES,
    problem: PROBLEM_LINES,
    bodyLabel: 'Envoyer le texte du message',
    bodyDescription:
      'Décoché, vous recevez le pseudo et le type, jamais ce qui a été écrit.',
    // The one place a notification body leaves the machine, so the screen says
    // where it goes rather than leaving it to be guessed. See ADR 0008.
    bodyNote:
      'Coché, le texte passe par Telegram, dont les conversations ne sont pas chiffrées de bout en bout.',
    charactersTitle: 'Personnages relayés',
    // The veille is said here rather than in a note under the panels, the same
    // way the AutoFocus screen puts every caveat on the row it belongs to.
    charactersBody:
      'On relaie son principal, pas ses mules. La veille n’y change rien.',
    characterToggle: (nickname: string) => {
      return `Relayer ${nickname}`
    },
    emptyBody:
      'Ouvrez un client Dofus : le personnage apparaît ici, déjà coché.',
    // Shown on a measured delay and never on an unknown one, which would promise
    // a fault nobody has seen. See `docs/macos.md`.
    screenSaverTitle: 'Votre économiseur d’écran peut rendre le relais muet',
    screenSaverBody: (delay: string) => {
      return `multifus garde l’écran allumé, mais l’économiseur démarre après ${delay} et verrouille la session, ce qui coupe la lecture des notifications. Réglez-le sur Jamais dans les réglages du système.`
    }
  }
} as const
