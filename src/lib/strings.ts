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
  ShortcutAction,
  ShortcutOutcome,
  TrayOutcome,
  UpdateStatus
} from '@/lib/multifus'

export const strings = {
  app: {
    name: 'multifus'
  },

  nav: {
    characters: 'Personnages',
    shortcuts: 'Raccourcis',
    autoFocus: 'AutoFocus',
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
    subtitle:
      'Une notification de jeu ramène la fenêtre du personnage concerné au premier plan. Ces réglages sont globaux : ils valent pour tout le roster.',
    masterLabel: 'AutoFocus',
    masterDescription:
      'Coupe tout d’un coup, sans oublier les types réglés ci-dessous. Le même interrupteur vit dans le menu de la barre système.',
    suspended:
      'L’AutoFocus est coupé : aucune notification ne ramène de fenêtre. Les réglages ci-dessous restent modifiables et reprendront tels quels.',
    stillApplies:
      'L’AutoFocus s’applique aussi aux personnages en veille, pour qu’un échange proposé à une mule la fasse remonter.',
    bannerWarning: IS_APPLE
      ? 'Sur macOS, multifus lit la bannière que le système affiche : sans elle il n’a rien à lire et l’AutoFocus s’arrête. Dans les réglages de notifications de Dofus, gardez « Bureau » coché et les aperçus sur « Par défaut ». Le reste est libre : coupez le son et laissez le style sur « Temporaire », la bannière s’efface alors toute seule.'
      : 'Sur Windows, l’écoute passe par une API du système : les bannières de Dofus peuvent rester coupées sans rien casser. Sur macOS, elles sont au contraire indispensables.',
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

/** How serious a journal entry is, which is what colours its dot. */
export type JournalTone = 'good' | 'neutral' | 'warning'

/** The events whose tone is decided by their kind alone. */
type PlainEventKind = Exclude<
  JournalEvent['kind'],
  'authorization' | 'notification' | 'shortcut' | 'trayFocus'
>

const TONES = {
  started: 'neutral',
  listening: 'good',
  listeningFailed: 'warning',
  characterOnline: 'neutral',
  characterOffline: 'neutral',
  scanFailed: 'warning',
  saveFailed: 'warning',
  openFailed: 'warning',
  shortcutRefused: 'warning',
  shortcutsFailed: 'warning',
  trayFailed: 'warning',
  windowFailed: 'warning',
  startAtLoginFailed: 'warning',
  updateAvailable: 'good',
  updateFailed: 'warning',
  reset: 'neutral'
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

  if (event.kind === 'notification') {
    return event.outcome.outcome === 'focused' ? 'good' : 'neutral'
  }

  if (event.kind === 'shortcut') {
    return SHORTCUT_TONES[event.outcome.outcome]
  }

  if (event.kind === 'trayFocus') {
    return TRAY_TONES[event.outcome.outcome]
  }

  return TONES[event.kind]
}

/**
 * The events whose whole line is a stock phrase and the reason the system gave.
 *
 * `shortcutRefused` carries a detail too and is not one of them: it has to name
 * the action and the combination first, so it stays a sentence of its own.
 */
type DetailedEventKind = Exclude<
  Extract<JournalEvent, { readonly detail: string }>['kind'],
  'shortcutRefused'
>

/**
 * What each of them says before the colon. A table for the same reason as
 * {@link TONES}: a new failure event on the Rust side fails to compile here
 * rather than reaching the journal as an empty line.
 */
const DETAILED_LINES = {
  listeningFailed: 'Écoute des notifications impossible',
  shortcutsFailed: 'Les raccourcis ne sont pas fiables',
  trayFailed: 'La barre système n’est pas fiable',
  windowFailed: 'La fenêtre de multifus n’est pas revenue',
  startAtLoginFailed: 'Démarrage avec la session impossible',
  scanFailed: 'Lecture des fenêtres impossible',
  saveFailed: 'Configuration non enregistrée',
  openFailed: 'Le système n’a pas pu ouvrir cet élément',
  updateFailed: 'Mise à jour impossible'
} as const satisfies Record<DetailedEventKind, string>

const isDetailed = (
  event: JournalEvent
): event is Extract<JournalEvent, { readonly kind: DetailedEventKind }> => {
  return event.kind in DETAILED_LINES
}

/** A journal event, put into words. */
export const journalLine = (event: JournalEvent) => {
  if (isDetailed(event)) {
    return `${DETAILED_LINES[event.kind]} : ${event.detail}`
  }

  switch (event.kind) {
    case 'started': {
      return 'multifus a démarré.'
    }
    case 'authorization': {
      return event.granted
        ? 'Autorisation accordée : les fenêtres sont lisibles.'
        : 'Autorisation refusée : les fenêtres ne peuvent pas être lues.'
    }
    case 'listening': {
      return 'Écoute des notifications démarrée.'
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
    case 'shortcut': {
      return shortcutLine(event)
    }
    case 'shortcutRefused': {
      const { label } = strings.shortcuts.actions[event.action]

      return `Raccourci ${label} refusé (${event.accelerator}) : ${event.detail}`
    }
    case 'trayFocus': {
      return trayLine(event)
    }
    case 'updateAvailable': {
      return `La version ${event.version} est disponible.`
    }
    case 'reset': {
      return 'Configuration remise à zéro.'
    }
    default: {
      return ''
    }
  }
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
 * The whole journal as plain text, one entry per line, oldest first.
 *
 * What leaves the window when the reader copies it. The time is kept in front of
 * every line: the journal is read to find out what happened just before nothing
 * came to the front, and an order without moments answers half the question.
 */
export const journalTranscript = (entries: readonly JournalEntry[]) => {
  return entries
    .map((entry) => {
      return `${journalTime(entry.at)}  ${journalLine(entry.event)}`
    })
    .join('\n')
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
    case 'focusFailed': {
      return `${subject} : le système a refusé le passage au premier plan (${outcome.detail}).`
    }
    default: {
      return subject
    }
  }
}
