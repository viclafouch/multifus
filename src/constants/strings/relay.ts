/** The words of the Relais screen, tutorial included. */

import type { PairingProblem } from '@/@types/relay'

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
        body: 'multifus envoie un message d’essai sur votre téléphone.'
      }
    },
    help: 'Les robots Telegram, expliqués',
    tokenLabel: 'Jeton du robot',
    tokenPlaceholder: 'Collez ici le jeton donné par BotFather',
    connect: 'Connecter',
    connecting: 'Connexion…',
    // The token lives in the system keychain and never comes back out, which is
    // why this screen shows a state and not the value.
    pairedTitle: 'Votre robot est connecté',
    pairedBody:
      'Le jeton est rangé dans le trousseau du système, multifus ne l’affiche nulle part.',
    unpair: 'Délier le robot',
    unpairing: 'Déliement…',
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
    // a fault nobody has seen. See l'étape 11 du plan.
    screenSaverTitle: 'Votre économiseur d’écran peut rendre le relais muet',
    screenSaverBody: (delay: string) => {
      return `multifus garde l’écran allumé, mais l’économiseur démarre après ${delay} et verrouille la session, ce qui coupe la lecture des notifications. Réglez-le sur Jamais dans les réglages du système.`
    }
  }
} as const
