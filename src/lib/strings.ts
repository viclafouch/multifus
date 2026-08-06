/**
 * Every word multifus shows, in one file.
 *
 * The interface is in French, the code and the comments are in English, and this
 * is where the two meet. Nothing else in `src` holds a sentence for the user: the
 * journal crosses the bridge as structured events and is put into words here, by
 * {@link journalLine}.
 *
 * This is the file of the *window*. The system tray has words of its own, in
 * `app::tray` on the Rust side, because an `NSMenu` is not something React can
 * draw. That module is the only other place a French sentence lives.
 *
 * No nickname, no supposed number of accounts, no path to anybody's machine
 * appears here. multifus is a personal project written as though it were public,
 * and the empty states have to read right for somebody who has never opened it.
 */

import { IS_APPLE } from '@/lib/accelerator'
import type {
  Gender,
  JournalEntry,
  JournalEvent,
  NotificationKind,
  NotificationOutcome,
  RelayFailure,
  RosterChange,
  SettingChange,
  ShortcutAction,
  ShortcutBinding,
  ShortcutOutcome,
  Snapshot,
  Surface,
  TrayOutcome,
  UpdateStatus,
  Work
} from '@/lib/multifus'

export const strings = {
  app: {
    name: 'multifus'
  },

  nav: {
    characters: 'Personnages',
    shortcuts: 'Raccourcis',
    autoFocus: 'AutoFocus',
    relay: 'Relais',
    about: 'À propos'
  },

  status: {
    connected: (count: number) => {
      return count === 1
        ? '1 personnage connecté'
        : `${count} personnages connectés`
    },
    listening: 'À l’écoute des notifications',
    notListening: 'Écoute interrompue',
    denied: 'Autorisation manquante'
  },

  characters: {
    title: 'Personnages',
    subtitle:
      'L’ordre de cette liste est l’ordre du défilement. Faites glisser une ligne pour le changer.',
    inCycle: 'Dans le défilement',
    asleep: 'En veille',
    offline: 'Hors ligne',
    rankNone: '·',
    handle: (nickname: string) => {
      return `Déplacer ${nickname} dans le défilement`
    },
    // The switch is on when the character is in the cycle, so the label names
    // the cycle and not the veille. Calling it « Veille de X » while it reads
    // checked for someone who is awake said the opposite of the truth.
    cycleToggle: (nickname: string) => {
      return `Défilement de ${nickname}`
    },
    genderLabel: (nickname: string, gender: Gender) => {
      return gender === 'male'
        ? `Marquer ${nickname} comme homme`
        : `Marquer ${nickname} comme femme`
    },
    remove: (nickname: string) => {
      return `Retirer ${nickname} du roster`
    },
    groupedActions: 'Actions groupées',
    groupLabel: {
      male: 'Hommes',
      female: 'Femmes'
    },
    sleepGroup: 'Endormir',
    wakeGroup: 'Réveiller',
    sleepGroupLabel: {
      male: 'Endormir tous les hommes',
      female: 'Endormir toutes les femmes'
    },
    wakeGroupLabel: {
      male: 'Réveiller tous les hommes',
      female: 'Réveiller toutes les femmes'
    },
    noGenderYet:
      'Assignez un sexe à vos personnages pour activer les actions groupées.',
    emptyTitle: 'Le roster est vide',
    emptyBody:
      'Ouvrez un client Dofus. Le personnage apparaît ici dès que sa fenêtre porte son pseudo, et il y reste même une fois le client fermé.',
    emptyHint:
      'Un client resté sur l’écran de connexion n’a pas encore de pseudo : il ne peut donc pas être reconnu.',
    refresh: 'Chercher maintenant'
  },

  authorization: {
    title: 'Autorisation requise',
    body: IS_APPLE
      ? 'multifus a besoin de l’accès à l’Accessibilité pour lire le titre des fenêtres Dofus, les amener au premier plan et entendre les notifications du jeu.'
      : 'multifus a besoin de l’accès aux notifications pour entendre les événements du jeu et amener la bonne fenêtre au premier plan.',
    patience: IS_APPLE
      ? 'macOS n’accorde jamais cette autorisation dans la seconde. Cochez multifus dans Réglages Système, puis revenez : cet écran disparaîtra tout seul.'
      : 'Autorisez multifus dans les réglages du système, puis revenez : cet écran disparaîtra tout seul.',
    request: 'Demander l’autorisation',
    openSettings: IS_APPLE
      ? 'Ouvrir Réglages Système'
      : 'Ouvrir les réglages du système'
  },

  shortcuts: {
    title: 'Raccourcis',
    subtitle:
      'Ces combinaisons restent inertes tant qu’une fenêtre Dofus n’est pas au premier plan.',
    // A combination the system accepts is not a combination that fires: macOS
    // takes one another application already owns and then never delivers it.
    // This note is the only place the interface can warn about that, and the
    // journal is where it is confirmed.
    silent:
      'Le système accepte parfois une combinaison qu’une autre application intercepte déjà : elle est alors posée, mais n’arrive jamais jusqu’ici. En cas de doute, appuyez dessus depuis le jeu et regardez le journal.',
    capture: 'Appuyez sur une combinaison',
    captureHint: 'Échap pour annuler, Retour arrière pour effacer.',
    empty: 'Aucune',
    edit: (label: string) => {
      return `Modifier le raccourci ${label}`
    },
    status: {
      pending: 'Pas encore posé sur le système.',
      unbound: 'Aucune combinaison, cette action ne répond à rien.',
      registered: 'Posé sur le système.',
      invalid: 'Le système ne sait pas lire cette combinaison.',
      refused:
        'Le système a refusé cette combinaison, sans doute déjà prise ailleurs.',
      duplicate: (label: string) => {
        return `Déjà prise par « ${label} », le système ne peut pas tenir les deux.`
      }
    },
    rejected: {
      noModifier:
        'Il faut au moins un modificateur, sans quoi la touche serait avalée dans toutes les applications.',
      unsupportedKey: 'Cette touche ne peut pas servir de raccourci.'
    },
    actions: {
      next: {
        label: 'Suivant',
        description: 'Passe au personnage suivant, en sautant ceux en veille.'
      },
      previous: {
        label: 'Précédent',
        description: 'Passe au personnage précédent, en sautant ceux en veille.'
      },
      toggleAsleep: {
        label: 'Veille',
        description: 'Endort ou réveille le personnage au premier plan.'
      },
      swap: {
        label: 'Bascule',
        description: 'Endort un sexe et réveille l’autre, d’un seul coup.'
      }
    }
  },

  autoFocus: {
    title: 'AutoFocus',
    subtitle: 'Réglages valables pour tout le roster.',
    masterLabel: 'AutoFocus',
    masterDescription: 'Ramène la fenêtre qui reçoit une notification.',
    minimizedLabel: 'Fenêtres réduites',
    minimizedDescription: IS_APPLE
      ? 'Rouvre de force celles rangées dans le Dock.'
      : 'Rouvre de force celles rangées dans la barre des tâches.',
    kinds: {
      combat: {
        label: 'Combat',
        description: 'C’est au tour de ce personnage de jouer.'
      },
      trade: {
        label: 'Échange',
        description: 'Quelqu’un propose un échange.'
      },
      group: {
        label: 'Groupe',
        description: 'Invitation à rejoindre un groupe ou une guilde.'
      },
      private_message: {
        label: 'Message privé',
        description: 'Un message privé arrive.'
      },
      challenge: {
        label: 'Défi',
        description: 'Quelqu’un lance un défi en duel.'
      },
      craft: {
        label: 'Craft',
        description:
          'Appel à un artisan, invitation à un atelier, objets prêts.'
      },
      perceptor: {
        label: 'Percepteur',
        description: 'Un percepteur est attaqué.'
      }
    }
  },

  relay: {
    title: 'Relais',
    subtitle:
      'Vos messages privés arrivent sur votre téléphone pendant que vous êtes ailleurs.',
    // The whole setup happens in Telegram Web, on this machine, and that is what
    // makes it bearable: the token is a copy and paste rather than fifty
    // characters read off a telephone and typed back in by hand.
    // The title of a step says what to do, its line says why when the why
    // surprises: a robot cannot write first, BotFather answers in English.
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
    // One line each, since the five steps are on screen right above: a message
    // that names the step left to do beats one that repeats it.
    problem: {
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
    },
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
      'Ouvrez un client Dofus : le personnage apparaît ici, déjà coché.'
  },

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
    // one consequence worth knowing before clicking, and a modal for a button
    // one presses twice a year would cost more than it protects.
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
  },

  config: {
    unreadableTitle: 'Configuration illisible',
    unreadableBody:
      'Le fichier de configuration existe mais n’a pas pu être lu. multifus tourne sur ses réglages par défaut et n’a rien écrasé.',
    malformedTitle: 'Configuration mise de côté',
    malformedBody:
      'Le fichier de configuration n’était pas exploitable. Il a été renommé plutôt qu’écrasé, et multifus est reparti sur ses réglages par défaut.',
    notSavedTitle: 'Configuration non enregistrée',
    notSavedBody:
      'La dernière écriture a échoué. Ce qui est à l’écran est correct, ce qui est sur le disque ne l’est pas encore.',
    // The one problem of the four where doing nothing loses something.
    notSetAsideTitle: 'Configuration illisible et toujours en place',
    notSetAsideBody:
      'Le fichier de configuration n’était pas exploitable, et multifus n’a pas réussi à le déplacer. Le prochain enregistrement l’écrasera. Copiez-le ailleurs si son contenu compte.',
    reveal: 'Montrer le fichier',
    dismiss: 'J’ai compris'
  },

  journal: {
    title: 'Journal',
    empty: 'Rien à signaler pour l’instant.',
    show: 'Afficher le journal',
    hide: 'Masquer le journal',
    copy: 'Copier le journal',
    copied: 'Journal copié',
    // The drawer shows what is in memory. The file holds weeks, and saying so is
    // what stops somebody from scrolling up looking for last Tuesday.
    reveal: 'Montrer le fichier du journal',
    entries: (count: number) => {
      return count === 1 ? '1 entrée' : `${count} entrées`
    }
  }
} as const

/**
 * How each key token is drawn on this keyboard. Rebuilt on every call would be
 * waste, so it lives at module scope, next to the only function that reads it.
 */
const KEY_LABELS = new Map<string, string>([
  ['Alt', IS_APPLE ? '⌥' : 'Alt'],
  ['ArrowDown', '↓'],
  ['ArrowLeft', '←'],
  ['ArrowRight', '→'],
  ['ArrowUp', '↑'],
  ['Backquote', '`'],
  ['Backslash', '\\'],
  ['Backspace', '⌫'],
  ['BracketLeft', '['],
  ['BracketRight', ']'],
  ['CapsLock', 'Verr. maj'],
  ['Comma', ','],
  ['Control', IS_APPLE ? '⌃' : 'Ctrl'],
  ['Delete', 'Suppr'],
  ['End', 'Fin'],
  ['Enter', '↵'],
  ['Equal', '='],
  ['Escape', 'Échap'],
  ['Home', 'Origine'],
  ['Insert', 'Inser'],
  ['Minus', '-'],
  ['NumLock', 'Verr. num'],
  ['NumpadAdd', 'Pavé +'],
  ['NumpadDecimal', 'Pavé ,'],
  ['NumpadDivide', 'Pavé /'],
  ['NumpadEnter', 'Pavé ↵'],
  ['NumpadEqual', 'Pavé ='],
  ['NumpadMultiply', 'Pavé ×'],
  ['NumpadSubtract', 'Pavé -'],
  ['PageDown', 'Page ↓'],
  ['PageUp', 'Page ↑'],
  ['Pause', 'Pause'],
  ['Period', '.'],
  ['PrintScreen', 'Impr. écran'],
  ['Quote', '’'],
  ['ScrollLock', 'Arrêt défil.'],
  ['Semicolon', ';'],
  ['Shift', IS_APPLE ? '⇧' : 'Maj'],
  ['Slash', '/'],
  ['Space', 'Espace'],
  ['Super', IS_APPLE ? '⌘' : 'Win'],
  ['Tab', '⇥']
])

/** The label a key token gets on this keyboard. */
export const keyLabel = (token: string) => {
  const known = KEY_LABELS.get(token)

  if (known !== undefined) {
    return known
  }

  if (token.startsWith('Key')) {
    return token.slice(3)
  }

  if (token.startsWith('Digit')) {
    return token.slice(5)
  }

  if (token.startsWith('Numpad')) {
    return `Pavé ${token.slice(6)}`
  }

  return token
}

/** How a moment of the day is written in the journal. */
export const journalTime = (milliseconds: number) => {
  return new Date(milliseconds).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * The same moment with its date, for the head of a transcript.
 *
 * The lines below carry the time alone, which is right in a drawer somebody is
 * looking at. A transcript pasted elsewhere has to say which day it was.
 */
const journalMoment = (milliseconds: number) => {
  return new Date(milliseconds).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  })
}

/** How serious a journal entry is, which is what colours its dot. */
export type JournalTone = 'good' | 'neutral' | 'warning'

/** The events whose tone is decided by their kind alone. */
type PlainEventKind = Exclude<
  JournalEvent['kind'],
  | 'authorization'
  | 'authorizationRequested'
  | 'notification'
  | 'shortcut'
  | 'shortcutsBound'
  | 'trayFocus'
>

const TONES = {
  started: 'neutral',
  listening: 'good',
  listeningFailed: 'warning',
  notificationUnreadable: 'warning',
  panicked: 'warning',
  characterOnline: 'neutral',
  characterOffline: 'neutral',
  // What the user asked for, never a fault, whatever it does to the défilement.
  roster: 'neutral',
  setting: 'neutral',
  scanFailed: 'warning',
  saveFailed: 'warning',
  openFailed: 'warning',
  configLoadFailed: 'warning',
  configNotSetAside: 'warning',
  shortcutsFailed: 'warning',
  snapshotFailed: 'warning',
  trayFailed: 'warning',
  windowFailed: 'warning',
  startAtLoginReconciled: 'neutral',
  startAtLoginFailed: 'warning',
  updateAvailable: 'good',
  updateUpToDate: 'neutral',
  updateFailed: 'warning',
  relayPaired: 'good',
  relayUnpaired: 'neutral',
  relayFailed: 'warning',
  reset: 'neutral',
  quit: 'neutral'
} as const satisfies Record<PlainEventKind, JournalTone>

/**
 * The tone of each outcome a shortcut can have, a table for the same reason as
 * {@link TONES}: a new outcome on the Rust side has to fail to compile here
 * rather than quietly take the neutral colour.
 *
 * Ochre is spent on the four that did what the key was pressed for. The ones
 * that did nothing on purpose stay grey, since being outside the game is the
 * ordinary state of these four combinations and not a fault.
 */
const SHORTCUT_TONES = {
  focused: 'good',
  slept: 'good',
  woke: 'good',
  swapped: 'good',
  outsideGame: 'neutral',
  notInRoster: 'neutral',
  nobodyInCycle: 'neutral',
  noGender: 'neutral',
  noWindow: 'neutral',
  focusFailed: 'warning',
  foregroundUnknown: 'warning'
} as const satisfies Record<ShortcutOutcome['outcome'], JournalTone>

/**
 * The statuses that mean a combination is not on the desktop.
 *
 * A duplicate belongs here even though the system never turned it down: multifus
 * turned it down itself, and the action answers to nothing either way.
 */
const DEAD_SHORTCUT_STATUSES = new Set<ShortcutBinding['status']['kind']>([
  'duplicate',
  'invalid',
  'refused'
])

/** The tone of each outcome a click in the system tray can have. */
const TRAY_TONES = {
  focused: 'good',
  noWindow: 'neutral',
  focusFailed: 'warning'
} as const satisfies Record<TrayOutcome['outcome'], JournalTone>

/**
 * A table rather than a switch, so a new event on the Rust side fails to compile
 * here instead of quietly taking the neutral colour. Only the four events whose
 * tone depends on their payload are read by hand, and two of them read a table
 * of their own.
 */
export const journalTone = (event: JournalEvent): JournalTone => {
  if (event.kind === 'authorization') {
    return event.granted ? 'good' : 'warning'
  }

  // Being refused a second after asking is what macOS always answers, so it is
  // the ordinary state and not a fault. Only a system that would not answer at
  // all is one.
  if (event.kind === 'authorizationRequested') {
    if (event.failure !== null) {
      return 'warning'
    }

    return event.granted ? 'good' : 'neutral'
  }

  if (event.kind === 'notification') {
    return event.outcome.outcome === 'focused' ? 'good' : 'neutral'
  }

  if (event.kind === 'shortcut') {
    return SHORTCUT_TONES[event.outcome.outcome]
  }

  if (event.kind === 'shortcutsBound') {
    const isDead = event.bindings.some((binding) => {
      return DEAD_SHORTCUT_STATUSES.has(binding.status.kind)
    })

    return isDead ? 'warning' : 'neutral'
  }

  if (event.kind === 'trayFocus') {
    return TRAY_TONES[event.outcome.outcome]
  }

  return TONES[event.kind]
}

/**
 * The events whose whole line is a stock phrase and the reason the system gave.
 *
 * `configLoadFailed` carries a detail too and is not one of them: it has to name
 * where the file went, so it stays a sentence of its own.
 */
type DetailedEventKind = Exclude<
  Extract<JournalEvent, { readonly detail: string }>['kind'],
  'configLoadFailed'
>

/**
 * What each of them says before the colon. A table for the same reason as
 * {@link TONES}: a new failure event on the Rust side fails to compile here
 * rather than reaching the journal as an empty line.
 */
const DETAILED_LINES = {
  listeningFailed: 'Écoute des notifications impossible',
  notificationUnreadable: 'Notification impossible à lire',
  shortcutsFailed: 'Les raccourcis ne sont pas fiables',
  trayFailed: 'La barre système n’est pas fiable',
  windowFailed: 'La fenêtre de multifus n’a pas suivi',
  snapshotFailed: 'La fenêtre n’a pas reçu le tableau de bord',
  startAtLoginFailed: 'Démarrage avec la session impossible',
  scanFailed: 'Lecture des fenêtres impossible',
  saveFailed: 'Configuration non enregistrée',
  configNotSetAside:
    'Configuration illisible et impossible à déplacer, le prochain enregistrement l’écrasera',
  openFailed: 'Le système n’a pas pu ouvrir cet élément',
  updateFailed: 'Mise à jour impossible'
} as const satisfies Record<DetailedEventKind, string>

const isDetailed = (
  event: JournalEvent
): event is Extract<JournalEvent, { readonly kind: DetailedEventKind }> => {
  return event.kind in DETAILED_LINES
}

/**
 * The kinds of an event union that carry nothing but their own name.
 *
 * Derived rather than listed, so that a payload-free event added on the Rust side
 * has to appear in {@link PLAIN_LINES} instead of falling through to an empty
 * line.
 */
type WithoutPayload<Event> = Event extends { readonly kind: string }
  ? keyof Event extends 'kind'
    ? Event['kind']
    : never
  : never

/** Each of them is one fact with nothing to add about it. */
const PLAIN_LINES = {
  listening: 'Écoute des notifications démarrée.',
  updateUpToDate: 'Aucune version plus récente.',
  // Neither line names the salon. It is not a notification body, so the rule of
  // l'ADR 0006 does not reach it, but it names a real conversation and this
  // journal is a file one hands over.
  relayPaired: 'Relais apparié à un robot Telegram.',
  relayUnpaired: 'Robot Telegram délié, jeton effacé du trousseau.',
  reset: 'Configuration remise à zéro.',
  quit: 'multifus a été quitté depuis la barre système.'
} as const satisfies Record<WithoutPayload<JournalEvent>, string>

const isPlain = (
  event: JournalEvent
): event is Extract<
  JournalEvent,
  { readonly kind: WithoutPayload<JournalEvent> }
> => {
  return event.kind in PLAIN_LINES
}

/**
 * The first line of every run, and the one that makes the rest readable.
 *
 * Version, system and launch in one sentence, because a transcript is read
 * against a release, on an operating system whose version decides how the
 * notifications are read, started in one of two ways that do not show the same
 * thing.
 */
const startedLine = (event: Extract<JournalEvent, { kind: 'started' }>) => {
  const how =
    event.launch === 'session'
      ? 'au démarrage de la session'
      : 'lancé à la main'

  return `multifus ${event.version} a démarré sur ${event.system}, ${how}.`
}

const configLoadFailedLine = (
  event: Extract<JournalEvent, { kind: 'configLoadFailed' }>
) => {
  const whereItWent =
    event.quarantined === null
      ? 'Rien n’a été déplacé.'
      : `Fichier mis de côté : ${event.quarantined}`

  return `Configuration non chargée, multifus est reparti sur ses réglages par défaut (${event.detail}). ${whereItWent}`
}

const authorizationRequestedLine = (
  event: Extract<JournalEvent, { kind: 'authorizationRequested' }>
) => {
  if (event.failure !== null) {
    return `Autorisation demandée : le système n’a pas pu répondre (${event.failure}).`
  }

  return event.granted
    ? 'Autorisation demandée : accordée.'
    : 'Autorisation demandée : pas encore accordée, ce qui est normal dans la seconde qui suit.'
}

/**
 * What the relay could not do, put into words.
 *
 * Each line names the place it is repaired in, and they are three different
 * places. « Le relais a échoué » would send the reader to the network two times
 * out of three, when the answer is a keychain or a token.
 */
const relayFailedLine = (reason: RelayFailure) => {
  switch (reason.reason) {
    case 'keychain': {
      return `Relais : le trousseau du système a refusé le jeton (${reason.detail}).`
    }
    case 'telegram': {
      return `Relais : Telegram a refusé la requête (${reason.detail}).`
    }
    case 'network': {
      return `Relais : Telegram n’a pas répondu (${reason.detail}).`
    }
    default: {
      return 'Relais : échec.'
    }
  }
}

/**
 * What each thread of multifus is called when it has to be named.
 *
 * A table because the Rust side sends an enum and not a sentence: there is
 * nothing to quote from the system when a panic is caught, so the event names the
 * work and the words live here, like every other word of this window.
 */
const WORK_LABELS = {
  scan: 'La lecture des fenêtres',
  shortcuts: 'La réponse à un raccourci',
  tray: 'La réponse à un clic dans la barre système'
} as const satisfies Record<Work, string>

/** Where the user acted, for the two settings that have two doors. */
const surfaceLabel = (surface: Surface) => {
  return surface === 'tray' ? 'la barre système' : 'la fenêtre'
}

/** How a sex is named when a whole one of them is meant. */
const genderPluralLabel = (gender: Gender) => {
  return gender === 'male' ? 'les hommes' : 'les femmes'
}

/**
 * What the user did to the roster, put into words.
 *
 * These lines exist so that the journal reads on its own. A `Suivant` reporting
 * « personne dans le défilement » is only ever explained by the rows somebody put
 * to sleep a minute earlier.
 */
const rosterLine = (change: RosterChange) => {
  switch (change.kind) {
    case 'slept': {
      return `${change.nickname} mis en veille.`
    }
    case 'woke': {
      return `${change.nickname} remis dans le défilement.`
    }
    case 'genderAsleep': {
      const what = change.asleep ? 'en veille' : 'réveillés'

      return `Tous ${genderPluralLabel(change.gender)} connectés sont ${what}.`
    }
    case 'genderAssigned': {
      if (change.gender === null) {
        return `Sexe retiré à ${change.nickname}.`
      }

      const sex = change.gender === 'male' ? 'homme' : 'femme'

      return `${change.nickname} est assigné comme ${sex}.`
    }
    case 'reordered': {
      return change.order.length === 0
        ? 'Ordre du défilement modifié, roster vide.'
        : `Ordre du défilement : ${change.order.join(', ')}.`
    }
    case 'removed': {
      return `${change.nickname} retiré du roster.`
    }
    case 'relayed': {
      return change.relayed
        ? `${change.nickname} est relayé.`
        : `${change.nickname} n’est plus relayé.`
    }
    default: {
      return ''
    }
  }
}

/** A setting the user moved, put into words. */
const settingLine = (change: SettingChange) => {
  switch (change.kind) {
    case 'autoFocusEnabled': {
      const what = change.enabled ? 'activé' : 'désactivé'

      return `AutoFocus ${what} depuis ${surfaceLabel(change.from)}.`
    }
    case 'autoFocusKind': {
      const { label } = strings.autoFocus.kinds[change.notificationKind]
      const what = change.enabled ? 'activé' : 'désactivé'

      return `AutoFocus, type ${label} ${what}.`
    }
    case 'wakesMinimized': {
      const what = change.wakes ? 'activé' : 'désactivé'

      return `Réveil des fenêtres réduites ${what} depuis ${surfaceLabel(change.from)}.`
    }
    case 'relayBody': {
      const what = change.sendBody ? 'activé' : 'désactivé'

      return `Envoi du texte des messages privés ${what}.`
    }
    default: {
      return ''
    }
  }
}

/**
 * The four combinations as the system left them, on one line.
 *
 * The accelerator is written as it is stored and not as the keyboard draws it: a
 * transcript ends up in a bug report next to a configuration file, and
 * `Control+Shift+Right` is what both of them hold.
 */
const shortcutsBoundLine = (bindings: readonly ShortcutBinding[]) => {
  const parts = bindings.map((binding) => {
    const { label } = strings.shortcuts.actions[binding.action]

    return `${label} ${shortcutBindingLabel(binding)}`
  })

  return `Raccourcis : ${parts.join(' · ')}.`
}

const shortcutBindingLabel = ({ accelerator, status }: ShortcutBinding) => {
  // `null` is a combination the user cleared, which the status reports as
  // `unbound`. Naming it here as well keeps every branch readable on its own
  // rather than resting on the two agreeing.
  const combination = accelerator ?? 'aucune combinaison'

  switch (status.kind) {
    case 'registered': {
      return combination
    }
    case 'unbound': {
      return 'non attribué'
    }
    case 'pending': {
      return 'pas encore posé'
    }
    case 'invalid': {
      return `${combination} illisible (${status.detail})`
    }
    case 'duplicate': {
      const { label } = strings.shortcuts.actions[status.action]

      return `${combination} en doublon avec ${label}, donc inerte`
    }
    case 'refused': {
      return `${combination} refusé (${status.detail})`
    }
    default: {
      return combination
    }
  }
}

/**
 * The stretch of time the entries in memory cover.
 *
 * With the date, unlike the lines: a transcript read elsewhere has to say which
 * day it was, and how far back these lines reach before the file has to be
 * opened.
 */
const journalPeriod = (entries: readonly JournalEntry[]) => {
  if (entries.length === 0) {
    return 'aucune entrée'
  }

  // The index goes through a variable on purpose: the formatter rewrites
  // `entries[entries.length - 1]` into `entries.at(-1)`, which the `lib` of this
  // project does not have.
  const lastIndex = entries.length - 1

  return `${journalMoment(entries[0].at)} → ${journalMoment(entries[lastIndex].at)}`
}

/**
 * Where the update got to, put into words.
 *
 * A sentence and not a badge: every other state of this window is said in
 * French, and « à jour » next to a coloured dot would be the only thing here
 * that asks to be decoded.
 */
export const updateLine = (update: UpdateStatus) => {
  switch (update.kind) {
    case 'checking': {
      return strings.about.updateChecking
    }
    case 'upToDate': {
      return strings.about.updateUpToDate
    }
    case 'available': {
      return strings.about.updateAvailable(update.version)
    }
    case 'installing': {
      return strings.about.updateInstalling
    }
    case 'failed': {
      return strings.about.updateFailed(update.detail)
    }
    default: {
      return ''
    }
  }
}

/**
 * The journal as plain text, a header and then one entry per line, oldest first.
 *
 * What leaves the window when the reader copies it. The time is kept in front of
 * every line: the journal is read to find out what happened just before nothing
 * came to the front, and an order without moments answers half the question.
 *
 * **The header is not decoration.** Everything in it is already in the snapshot
 * and used to reach nobody: a transcript went out with no version, no system, no
 * state of the authorization and no combinations, so reading it started with a
 * round of questions. The `started` event carries most of the same facts, and it
 * is the first line to be pushed out of a journal that has been running a while,
 * which is exactly when somebody copies it.
 */
export const journalTranscript = (snapshot: Snapshot) => {
  const { journal } = snapshot

  const lines = journal.map((entry) => {
    return `${journalTime(entry.at)}  ${journalLine(entry.event)}`
  })

  return [
    `multifus ${snapshot.version} sur ${snapshot.system}`,
    `Autorisation : ${snapshot.authorization.granted ? 'accordée' : 'refusée'}, écoute ${snapshot.authorization.listening ? 'active' : 'arrêtée'}`,
    `AutoFocus : ${snapshot.autoFocusEnabled ? 'actif' : 'suspendu'}, réveil des réduites ${snapshot.wakesMinimized ? 'actif' : 'inactif'}`,
    shortcutsBoundLine(snapshot.shortcuts),
    `Configuration : ${snapshot.config.path}`,
    `Mise à jour : ${updateLine(snapshot.update)}`,
    `Entrées en mémoire : ${journal.length}, ${journalPeriod(journal)}`,
    // The drawer holds a window, the file holds the weeks. Without this line
    // somebody hands over ten minutes and believes they handed over the month.
    'Le fichier du journal sur le disque va plus loin en arrière que ces lignes.',
    '',
    ...lines
  ].join('\n')
}

type ShortcutLineParams = {
  readonly action: ShortcutAction
  readonly outcome: ShortcutOutcome
}

/**
 * A shortcut that fired, put into words.
 *
 * Every line names the action first, because the question being asked of this
 * journal is always about one combination: it was pressed, and then what.
 */
const shortcutLine = ({ action, outcome }: ShortcutLineParams) => {
  const { label } = strings.shortcuts.actions[action]

  switch (outcome.outcome) {
    case 'focused': {
      return `${label} : ${outcome.nickname} au premier plan.`
    }
    case 'slept': {
      return `${label} : ${outcome.nickname} mis en veille.`
    }
    case 'woke': {
      return `${label} : ${outcome.nickname} remis dans le défilement.`
    }
    case 'swapped': {
      return outcome.awake === 'male'
        ? `${label} : les hommes sont réveillés, les femmes en veille.`
        : `${label} : les femmes sont réveillées, les hommes en veille.`
    }
    case 'outsideGame': {
      return `${label} : ignoré, aucune fenêtre Dofus au premier plan.`
    }
    case 'notInRoster': {
      return `${label} : ${outcome.nickname} n’est pas encore dans le roster.`
    }
    case 'nobodyInCycle': {
      return `${label} : personne dans le défilement.`
    }
    case 'noGender': {
      return `${label} : aucun personnage connecté n’a de sexe assigné.`
    }
    case 'noWindow': {
      return `${label} : la fenêtre de ${outcome.nickname} a disparu.`
    }
    case 'focusFailed': {
      return `${label} : le système a refusé de ramener ${outcome.nickname} au premier plan (${outcome.detail}).`
    }
    case 'foregroundUnknown': {
      return `${label} : impossible de savoir quelle fenêtre est au premier plan (${outcome.detail}).`
    }
    default: {
      return label
    }
  }
}

type TrayLineParams = {
  readonly nickname: string
  readonly outcome: TrayOutcome
}

/**
 * A character clicked in the system tray, put into words.
 *
 * Named after where the click came from, so that the journal tells a menu click
 * apart from the shortcut that asks the system for exactly the same thing.
 */
const trayLine = ({ nickname, outcome }: TrayLineParams) => {
  switch (outcome.outcome) {
    case 'focused': {
      return `Barre système : ${nickname} au premier plan.`
    }
    case 'noWindow': {
      return `Barre système : la fenêtre de ${nickname} a disparu.`
    }
    case 'focusFailed': {
      return `Barre système : le système a refusé de ramener ${nickname} au premier plan (${outcome.detail}).`
    }
    default: {
      return nickname
    }
  }
}

type NotificationLineParams = {
  readonly nickname: string
  readonly notificationKind: NotificationKind | null
  readonly outcome: NotificationOutcome
}

const notificationLine = ({
  nickname,
  notificationKind,
  outcome
}: NotificationLineParams) => {
  const subject =
    notificationKind === null
      ? `Notification pour ${nickname}`
      : `${strings.autoFocus.kinds[notificationKind].label} pour ${nickname}`

  switch (outcome.outcome) {
    case 'focused': {
      return `${subject} : fenêtre ramenée au premier plan.`
    }
    case 'kindDisabled': {
      return `${subject} : ce type est désactivé, rien n’a été fait.`
    }
    case 'kindUnknown': {
      return `${subject} : type non reconnu, rien n’a été fait.`
    }
    case 'noWindow': {
      return `${subject} : aucune fenêtre à ramener.`
    }
    case 'leftMinimized': {
      return `${subject} : fenêtre réduite, laissée où elle est.`
    }
    // Told apart from `kindUnknown` on purpose: an unknown wording is repaired by
    // adding a pattern, a body nobody read is repaired in the reading itself.
    case 'bodyUnread': {
      return `${subject} : corps de la notification illisible, rien n’a été fait.`
    }
    case 'focusFailed': {
      return `${subject} : le système a refusé le passage au premier plan (${outcome.detail}).`
    }
    default: {
      return subject
    }
  }
}

/** One event of the union, picked by its kind. */
type EventOf<Kind extends JournalEvent['kind']> = Extract<
  JournalEvent,
  { readonly kind: Kind }
>

/**
 * The kinds the two tables above did not take: the ones whose line is built from
 * a payload rather than looked up.
 */
type ComposedEventKind = Exclude<
  JournalEvent['kind'],
  DetailedEventKind | WithoutPayload<JournalEvent>
>

/**
 * Of those, the ones multifus reports about itself and about the system.
 *
 * Listed by hand, and its other half is derived from it below. So an event added
 * on the Rust side and forgotten here lands in {@link ActionEventKind}, whose
 * switch then fails to compile. The safety net of {@link TONES}, kept across a
 * pair of functions.
 */
type RunEventKind =
  | 'authorization'
  | 'characterOffline'
  | 'characterOnline'
  | 'configLoadFailed'
  | 'notification'
  | 'panicked'
  | 'relayFailed'
  | 'shortcutsBound'
  | 'startAtLoginReconciled'
  | 'started'
  | 'updateAvailable'

/** And the ones the user caused, which is everything left. */
type ActionEventKind = Exclude<ComposedEventKind, RunEventKind>

/** The kinds {@link runLine} answers for, at runtime this time. */
const RUN_KINDS = new Set<ComposedEventKind>([
  'authorization',
  'characterOffline',
  'characterOnline',
  'configLoadFailed',
  'notification',
  'panicked',
  'relayFailed',
  'shortcutsBound',
  'startAtLoginReconciled',
  'started',
  'updateAvailable'
] as const satisfies readonly RunEventKind[])

const isRunEvent = (
  event: EventOf<ComposedEventKind>
): event is EventOf<RunEventKind> => {
  return RUN_KINDS.has(event.kind)
}

/**
 * What multifus observed on its own, put into words.
 *
 * Half of the events that carry a payload, and the seam is real: these are facts
 * multifus reports about itself, {@link actionLine} holds what the user did. Two
 * functions and not one because the Rust side keeps adding events, and one
 * branch each grows past what anybody reads in one go.
 */
const runLine = (event: EventOf<RunEventKind>) => {
  switch (event.kind) {
    case 'started': {
      return startedLine(event)
    }
    case 'configLoadFailed': {
      return configLoadFailedLine(event)
    }
    case 'authorization': {
      return event.granted
        ? 'Autorisation accordée : les fenêtres sont lisibles.'
        : 'Autorisation refusée : les fenêtres ne peuvent pas être lues.'
    }
    case 'characterOnline': {
      return `${event.nickname} est connecté.`
    }
    case 'characterOffline': {
      return `${event.nickname} n’est plus connecté.`
    }
    case 'notification': {
      return notificationLine(event)
    }
    case 'shortcutsBound': {
      return shortcutsBoundLine(event.bindings)
    }
    case 'startAtLoginReconciled': {
      return event.enabled
        ? 'Démarrage avec la session actif, enregistrement réécrit.'
        : 'Démarrage avec la session inactif, aucun enregistrement.'
    }
    case 'updateAvailable': {
      return `La version ${event.version} est disponible.`
    }
    case 'panicked': {
      return `${WORK_LABELS[event.work]} a échoué brutalement, et a repris.`
    }
    case 'relayFailed': {
      return relayFailedLine(event.reason)
    }
    default: {
      return ''
    }
  }
}

/** What the user did, put into words. The other half of {@link runLine}. */
const actionLine = (event: EventOf<ActionEventKind>) => {
  switch (event.kind) {
    case 'authorizationRequested': {
      return authorizationRequestedLine(event)
    }
    case 'roster': {
      return rosterLine(event.change)
    }
    case 'setting': {
      return settingLine(event.change)
    }
    case 'shortcut': {
      return shortcutLine(event)
    }
    case 'trayFocus': {
      return trayLine(event)
    }
    default: {
      return ''
    }
  }
}

/** A journal event, put into words. */
export const journalLine = (event: JournalEvent) => {
  if (isDetailed(event)) {
    return `${DETAILED_LINES[event.kind]} : ${event.detail}`
  }

  if (isPlain(event)) {
    return PLAIN_LINES[event.kind]
  }

  return isRunEvent(event) ? runLine(event) : actionLine(event)
}
