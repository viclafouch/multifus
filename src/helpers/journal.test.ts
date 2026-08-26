import { describe, expect, it } from 'vitest'
import type {
  JournalEvent,
  NotificationOutcome,
  QuickReplyFailure,
  RosterChange,
  SettingChange,
  ShortcutOutcome,
  TrayOutcome
} from '@/@types/journal'
import type { NoticeCase, RelayFailure } from '@/@types/relay'
import type {
  BoundCombination,
  QuickReply,
  ShortcutBinding
} from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import {
  DETAILED_LINES,
  NOTICE_LINES,
  PLAIN_LINES,
  RELAY_STOP_LINES,
  WALK_IDLE_LINES,
  WORK_LABELS
} from '@/constants/journal'
import { strings } from '@/constants/strings'
import {
  journalLine,
  journalTime,
  journalTone,
  journalTranscript
} from '@/helpers/journal'

type EventOf<Kind extends JournalEvent['kind']> = Extract<
  JournalEvent,
  { readonly kind: Kind }
>

type Case<Kind extends JournalEvent['kind']> = {
  readonly event: EventOf<Kind>
  readonly line: string
}

type JournalCases = {
  readonly [Kind in JournalEvent['kind']]: readonly Case<Kind>[]
}

const DETAIL = 'le système n’a pas répondu'

const NICKNAME = 'Alpha'

const SHORTCUTS = [
  {
    action: 'next',
    accelerator: 'Control+Shift+ArrowRight',
    status: { kind: 'registered' },
    isDefault: true
  },
  {
    action: 'previous',
    accelerator: null,
    status: { kind: 'unbound' },
    isDefault: false
  },
  {
    action: 'toggleAsleep',
    accelerator: 'Control+Shift+KeyS',
    status: { kind: 'pending' },
    isDefault: false
  },
  {
    action: 'swap',
    accelerator: 'Control+Shift+KeyX',
    status: { kind: 'invalid', detail: 'touche inconnue' },
    isDefault: false
  }
] as const satisfies readonly ShortcutBinding[]

const QUICK_REPLIES = [
  {
    id: 1,
    text: 'prix libre',
    accelerator: 'Control+Shift+KeyP',
    status: { kind: 'registered' }
  }
] as const satisfies readonly QuickReply[]

const BINDINGS = [
  {
    binding: { kind: 'action', action: 'next' },
    accelerator: 'Control+Shift+ArrowRight',
    status: { kind: 'registered' }
  },
  {
    binding: { kind: 'action', action: 'previous' },
    accelerator: null,
    status: { kind: 'unbound' }
  },
  {
    binding: { kind: 'action', action: 'toggleAsleep' },
    accelerator: 'Control+Shift+KeyS',
    status: { kind: 'pending' }
  },
  {
    binding: { kind: 'action', action: 'swap' },
    accelerator: 'Control+Shift+KeyX',
    status: { kind: 'invalid', detail: 'touche inconnue' }
  },
  {
    binding: { kind: 'quickReply', id: 1 },
    accelerator: 'Control+Shift+KeyP',
    status: { kind: 'registered' }
  }
] as const satisfies readonly BoundCombination[]

const BINDINGS_LINE =
  'Raccourcis : Fenêtre suivante Control+Shift+ArrowRight · Fenêtre précédente non attribué · Mettre de côté pas encore posé · Inverser hommes et femmes Control+Shift+KeyX illisible (touche inconnue) · Réponse rapide 1 Control+Shift+KeyP.'

const ROSTER_CASES = {
  slept: [
    {
      event: { kind: 'roster', change: { kind: 'slept', nickname: NICKNAME } },
      line: 'Alpha mis de côté.'
    }
  ],
  woke: [
    {
      event: { kind: 'roster', change: { kind: 'woke', nickname: NICKNAME } },
      line: 'Alpha remis dans le défilement.'
    }
  ],
  genderAsleep: [
    {
      event: {
        kind: 'roster',
        change: { kind: 'genderAsleep', gender: 'male', asleep: true }
      },
      line: 'Tous les hommes connectés sont de côté.'
    },
    {
      event: {
        kind: 'roster',
        change: { kind: 'genderAsleep', gender: 'female', asleep: false }
      },
      line: 'Tous les femmes connectés sont dans le défilement.'
    }
  ],
  classAssigned: [
    {
      event: {
        kind: 'roster',
        change: { kind: 'classAssigned', nickname: NICKNAME, class: 'cra' }
      },
      line: 'Alpha est assigné comme Crâ.'
    },
    {
      event: {
        kind: 'roster',
        change: { kind: 'classAssigned', nickname: NICKNAME, class: null }
      },
      line: 'Classe retirée à Alpha.'
    }
  ],
  genderAssigned: [
    {
      event: {
        kind: 'roster',
        change: {
          kind: 'genderAssigned',
          nickname: NICKNAME,
          gender: 'female'
        }
      },
      line: 'Alpha est assigné comme femme.'
    },
    {
      event: {
        kind: 'roster',
        change: { kind: 'genderAssigned', nickname: NICKNAME, gender: null }
      },
      line: 'Sexe retiré à Alpha.'
    }
  ],
  reordered: [
    {
      event: {
        kind: 'roster',
        change: { kind: 'reordered', order: [NICKNAME, 'Beta'] }
      },
      line: 'Ordre du défilement : Alpha, Beta.'
    },
    {
      event: { kind: 'roster', change: { kind: 'reordered', order: [] } },
      line: 'Ordre du défilement modifié, roster vide.'
    }
  ],
  removed: [
    {
      event: {
        kind: 'roster',
        change: { kind: 'removed', nickname: NICKNAME }
      },
      line: 'Alpha retiré du roster.'
    }
  ],
  relayed: [
    {
      event: {
        kind: 'roster',
        change: { kind: 'relayed', nickname: NICKNAME, relayed: true }
      },
      line: 'Alpha est relayé.'
    },
    {
      event: {
        kind: 'roster',
        change: { kind: 'relayed', nickname: NICKNAME, relayed: false }
      },
      line: 'Alpha n’est plus relayé.'
    }
  ]
} as const satisfies Record<RosterChange['kind'], readonly Case<'roster'>[]>

const SETTING_CASES = {
  autoFocusEnabled: [
    {
      event: {
        kind: 'setting',
        change: { kind: 'autoFocusEnabled', enabled: true, from: 'tray' }
      },
      line: 'AutoFocus activé depuis la barre système.'
    },
    {
      event: {
        kind: 'setting',
        change: { kind: 'autoFocusEnabled', enabled: false, from: 'window' }
      },
      line: 'AutoFocus désactivé depuis la fenêtre.'
    }
  ],
  autoFocusKind: [
    {
      event: {
        kind: 'setting',
        change: {
          kind: 'autoFocusKind',
          notificationKind: 'private_message',
          enabled: true
        }
      },
      line: 'AutoFocus, type Message privé activé.'
    }
  ],
  wakesMinimized: [
    {
      event: {
        kind: 'setting',
        change: { kind: 'wakesMinimized', wakes: false, from: 'tray' }
      },
      line: 'Réveil des fenêtres réduites désactivé depuis la barre système.'
    }
  ],
  maximizeOnLaunch: [
    {
      event: {
        kind: 'setting',
        change: { kind: 'maximizeOnLaunch', maximize: true }
      },
      line: 'Agrandissement des fenêtres au lancement activé.'
    },
    {
      event: {
        kind: 'setting',
        change: { kind: 'maximizeOnLaunch', maximize: false }
      },
      line: 'Agrandissement des fenêtres au lancement désactivé.'
    }
  ],
  ungroupTaskbar: [
    {
      event: {
        kind: 'setting',
        change: { kind: 'ungroupTaskbar', ungroup: true }
      },
      line: 'Un bouton par personnage dans la barre des tâches activé.'
    },
    {
      event: {
        kind: 'setting',
        change: { kind: 'ungroupTaskbar', ungroup: false }
      },
      line: 'Un bouton par personnage dans la barre des tâches désactivé.'
    }
  ],
  shortTitles: [
    {
      event: {
        kind: 'setting',
        change: { kind: 'shortTitles', short: true }
      },
      line: 'Pseudo seul dans le titre des fenêtres activé.'
    },
    {
      event: {
        kind: 'setting',
        change: { kind: 'shortTitles', short: false }
      },
      line: 'Pseudo seul dans le titre des fenêtres désactivé.'
    }
  ],
  relayBody: [
    {
      event: {
        kind: 'setting',
        change: { kind: 'relayBody', sendBody: true }
      },
      line: 'Envoi du texte des messages privés activé.'
    }
  ]
} as const satisfies Record<SettingChange['kind'], readonly Case<'setting'>[]>

const SHORTCUT_CASES = {
  focused: [
    {
      event: {
        kind: 'shortcut',
        action: 'next',
        outcome: { outcome: 'focused', nickname: NICKNAME }
      },
      line: 'Fenêtre suivante : Alpha au premier plan.'
    }
  ],
  slept: [
    {
      event: {
        kind: 'shortcut',
        action: 'toggleAsleep',
        outcome: { outcome: 'slept', nickname: NICKNAME }
      },
      line: 'Mettre de côté : Alpha mis de côté.'
    }
  ],
  woke: [
    {
      event: {
        kind: 'shortcut',
        action: 'toggleAsleep',
        outcome: { outcome: 'woke', nickname: NICKNAME }
      },
      line: 'Mettre de côté : Alpha remis dans le défilement.'
    }
  ],
  swapped: [
    {
      event: {
        kind: 'shortcut',
        action: 'swap',
        outcome: { outcome: 'swapped', awake: 'male' }
      },
      line: 'Inverser hommes et femmes : les hommes sont dans le défilement, les femmes de côté.'
    },
    {
      event: {
        kind: 'shortcut',
        action: 'swap',
        outcome: { outcome: 'swapped', awake: 'female' }
      },
      line: 'Inverser hommes et femmes : les femmes sont dans le défilement, les hommes de côté.'
    }
  ],
  outsideGame: [
    {
      event: {
        kind: 'shortcut',
        action: 'next',
        outcome: { outcome: 'outsideGame' }
      },
      line: 'Fenêtre suivante : ignoré, aucune fenêtre Dofus au premier plan.'
    }
  ],
  notInRoster: [
    {
      event: {
        kind: 'shortcut',
        action: 'previous',
        outcome: { outcome: 'notInRoster', nickname: NICKNAME }
      },
      line: 'Fenêtre précédente : Alpha n’est pas encore dans le roster.'
    }
  ],
  nobodyInCycle: [
    {
      event: {
        kind: 'shortcut',
        action: 'next',
        outcome: { outcome: 'nobodyInCycle' }
      },
      line: 'Fenêtre suivante : personne dans le défilement.'
    }
  ],
  noGender: [
    {
      event: {
        kind: 'shortcut',
        action: 'swap',
        outcome: { outcome: 'noGender' }
      },
      line: 'Inverser hommes et femmes : aucun personnage connecté n’a de sexe assigné.'
    }
  ],
  noWindow: [
    {
      event: {
        kind: 'shortcut',
        action: 'next',
        outcome: { outcome: 'noWindow', nickname: NICKNAME }
      },
      line: 'Fenêtre suivante : la fenêtre de Alpha a disparu.'
    }
  ],
  focusFailed: [
    {
      event: {
        kind: 'shortcut',
        action: 'next',
        outcome: { outcome: 'focusFailed', nickname: NICKNAME, detail: DETAIL }
      },
      line: `Fenêtre suivante : le système a refusé de ramener Alpha au premier plan (${DETAIL}).`
    }
  ],
  foregroundUnknown: [
    {
      event: {
        kind: 'shortcut',
        action: 'previous',
        outcome: { outcome: 'foregroundUnknown', detail: DETAIL }
      },
      line: `Fenêtre précédente : impossible de savoir quelle fenêtre est au premier plan (${DETAIL}).`
    }
  ],
  walk: [
    {
      event: {
        kind: 'shortcut',
        action: 'walk',
        outcome: { outcome: 'walk', enabled: true }
      },
      line: 'Déplacement : allumé.'
    },
    {
      event: {
        kind: 'shortcut',
        action: 'walk',
        outcome: { outcome: 'walk', enabled: false }
      },
      line: 'Déplacement : éteint.'
    }
  ]
} as const satisfies Record<
  ShortcutOutcome['outcome'],
  readonly Case<'shortcut'>[]
>

const QUICK_REPLY_CASES = {
  outsideGame: [
    {
      event: { kind: 'quickReplyFailed', reason: { reason: 'outsideGame' } },
      line: 'Réponse rapide ignorée : aucune fenêtre Dofus au premier plan.'
    }
  ],
  foregroundUnknown: [
    {
      event: {
        kind: 'quickReplyFailed',
        reason: { reason: 'foregroundUnknown', detail: DETAIL }
      },
      line: `Réponse rapide ignorée : impossible de savoir quelle fenêtre est au premier plan (${DETAIL}).`
    }
  ],
  gone: [
    {
      event: { kind: 'quickReplyFailed', reason: { reason: 'gone' } },
      line: 'Réponse rapide introuvable : elle a été retirée entre l’appui et le collage.'
    }
  ],
  clipboardRefused: [
    {
      event: {
        kind: 'quickReplyFailed',
        reason: { reason: 'clipboardRefused', detail: DETAIL }
      },
      line: `Réponse rapide non collée : le presse-papiers a refusé le texte (${DETAIL}).`
    }
  ],
  pasteRefused: [
    {
      event: {
        kind: 'quickReplyFailed',
        reason: { reason: 'pasteRefused', detail: DETAIL }
      },
      line: `Réponse rapide non collée : le système a refusé la combinaison de collage (${DETAIL}).`
    }
  ],
  clipboardNotGivenBack: [
    {
      event: {
        kind: 'quickReplyFailed',
        reason: { reason: 'clipboardNotGivenBack', detail: DETAIL }
      },
      line: `Réponse rapide collée, mais le presse-papiers d’avant n’a pas pu être rendu (${DETAIL}).`
    }
  ]
} as const satisfies Record<
  QuickReplyFailure['reason'],
  readonly Case<'quickReplyFailed'>[]
>

const TRAY_CASES = {
  focused: [
    {
      event: {
        kind: 'trayFocus',
        nickname: NICKNAME,
        outcome: { outcome: 'focused' }
      },
      line: 'Barre système : Alpha au premier plan.'
    }
  ],
  noWindow: [
    {
      event: {
        kind: 'trayFocus',
        nickname: NICKNAME,
        outcome: { outcome: 'noWindow' }
      },
      line: 'Barre système : la fenêtre de Alpha a disparu.'
    }
  ],
  focusFailed: [
    {
      event: {
        kind: 'trayFocus',
        nickname: NICKNAME,
        outcome: { outcome: 'focusFailed', detail: DETAIL }
      },
      line: `Barre système : le système a refusé de ramener Alpha au premier plan (${DETAIL}).`
    }
  ]
} as const satisfies Record<
  TrayOutcome['outcome'],
  readonly Case<'trayFocus'>[]
>

const NOTIFICATION_CASES = {
  focused: [
    {
      event: {
        kind: 'notification',
        nickname: NICKNAME,
        notificationKind: 'private_message',
        outcome: { outcome: 'focused' }
      },
      line: 'Message privé pour Alpha : fenêtre ramenée au premier plan.'
    },
    {
      event: {
        kind: 'notification',
        nickname: NICKNAME,
        notificationKind: null,
        outcome: { outcome: 'focused' }
      },
      line: 'Notification pour Alpha : fenêtre ramenée au premier plan.'
    }
  ],
  kindDisabled: [
    {
      event: {
        kind: 'notification',
        nickname: NICKNAME,
        notificationKind: 'combat',
        outcome: { outcome: 'kindDisabled' }
      },
      line: 'Combat pour Alpha : ce type est désactivé, rien n’a été fait.'
    }
  ],
  kindUnknown: [
    {
      event: {
        kind: 'notification',
        nickname: NICKNAME,
        notificationKind: null,
        outcome: { outcome: 'kindUnknown' }
      },
      line: 'Notification pour Alpha : type non reconnu, rien n’a été fait.'
    }
  ],
  noWindow: [
    {
      event: {
        kind: 'notification',
        nickname: NICKNAME,
        notificationKind: 'trade',
        outcome: { outcome: 'noWindow' }
      },
      line: 'Échange pour Alpha : aucune fenêtre à ramener.'
    }
  ],
  leftMinimized: [
    {
      event: {
        kind: 'notification',
        nickname: NICKNAME,
        notificationKind: 'challenge',
        outcome: { outcome: 'leftMinimized' }
      },
      line: 'Défi pour Alpha : fenêtre réduite, laissée où elle est.'
    }
  ],
  bodyUnread: [
    {
      event: {
        kind: 'notification',
        nickname: NICKNAME,
        notificationKind: 'group',
        outcome: { outcome: 'bodyUnread' }
      },
      line: 'Groupe pour Alpha : corps de la notification illisible, rien n’a été fait.'
    }
  ],
  focusFailed: [
    {
      event: {
        kind: 'notification',
        nickname: NICKNAME,
        notificationKind: 'perceptor',
        outcome: { outcome: 'focusFailed', detail: DETAIL }
      },
      line: `Percepteur pour Alpha : le système a refusé le passage au premier plan (${DETAIL}).`
    }
  ]
} as const satisfies Record<
  NotificationOutcome['outcome'],
  readonly Case<'notification'>[]
>

const RELAY_FAILURE_CASES = {
  keychain: [
    {
      event: {
        kind: 'relayFailed',
        reason: { reason: 'keychain', detail: DETAIL }
      },
      line: `Messages privés : le trousseau du système a refusé le code du robot (${DETAIL}).`
    }
  ],
  telegram: [
    {
      event: {
        kind: 'relayFailed',
        reason: { reason: 'telegram', detail: DETAIL }
      },
      line: `Messages privés : Telegram a refusé la requête (${DETAIL}).`
    }
  ],
  network: [
    {
      event: {
        kind: 'relayFailed',
        reason: { reason: 'network', detail: DETAIL }
      },
      line: `Messages privés : Telegram n’a pas répondu (${DETAIL}).`
    }
  ]
} as const satisfies Record<
  RelayFailure['reason'],
  readonly Case<'relayFailed'>[]
>

const NOTICE_CASES = {
  enabled: [
    {
      event: { kind: 'relayNoticeSent', case: 'enabled' },
      line: NOTICE_LINES.enabled
    }
  ],
  disabled: [
    {
      event: { kind: 'relayNoticeSent', case: 'disabled' },
      line: NOTICE_LINES.disabled
    }
  ],
  disconnected: [
    {
      event: { kind: 'relayNoticeSent', case: 'disconnected' },
      line: NOTICE_LINES.disconnected
    }
  ],
  both: [
    {
      event: { kind: 'relayNoticeSent', case: 'both' },
      line: NOTICE_LINES.both
    }
  ]
} as const satisfies Record<NoticeCase, readonly Case<'relayNoticeSent'>[]>

const JOURNAL_CASES = {
  started: [
    {
      event: {
        kind: 'started',
        version: '0.1.0',
        system: 'macOS 26.0 (arm64)',
        launch: 'session'
      },
      line: 'Multifus 0.1.0 a démarré sur macOS 26.0 (arm64), au démarrage de la session.'
    },
    {
      event: {
        kind: 'started',
        version: '0.1.0',
        system: 'macOS 26.0 (arm64)',
        launch: 'byHand'
      },
      line: 'Multifus 0.1.0 a démarré sur macOS 26.0 (arm64), lancé à la main.'
    }
  ],
  listening: [{ event: { kind: 'listening' }, line: PLAIN_LINES.listening }],
  listeningFailed: [
    {
      event: { kind: 'listeningFailed', detail: DETAIL },
      line: `${DETAILED_LINES.listeningFailed} : ${DETAIL}`
    }
  ],
  notificationUnreadable: [
    {
      event: { kind: 'notificationUnreadable', detail: DETAIL },
      line: `${DETAILED_LINES.notificationUnreadable} : ${DETAIL}`
    }
  ],
  authorization: [
    {
      event: { kind: 'authorization', granted: true },
      line: 'Autorisation accordée : les fenêtres sont lisibles.'
    },
    {
      event: { kind: 'authorization', granted: false },
      line: 'Autorisation refusée : les fenêtres ne peuvent pas être lues.'
    }
  ],
  authorizationRequested: [
    {
      event: {
        kind: 'authorizationRequested',
        granted: false,
        failure: DETAIL
      },
      line: `Autorisation demandée : le système n’a pas pu répondre (${DETAIL}).`
    },
    {
      event: { kind: 'authorizationRequested', granted: true, failure: null },
      line: 'Autorisation demandée : accordée.'
    },
    {
      event: { kind: 'authorizationRequested', granted: false, failure: null },
      line: 'Autorisation demandée : pas encore accordée, ce qui est normal dans la seconde qui suit.'
    }
  ],
  characterOnline: [
    {
      event: { kind: 'characterOnline', nickname: NICKNAME },
      line: 'Alpha est connecté.'
    }
  ],
  characterOffline: [
    {
      event: { kind: 'characterOffline', nickname: NICKNAME },
      line: 'Alpha n’est plus connecté.'
    }
  ],
  notification: Object.values(NOTIFICATION_CASES).flat(),
  roster: Object.values(ROSTER_CASES).flat(),
  setting: Object.values(SETTING_CASES).flat(),
  shortcut: Object.values(SHORTCUT_CASES).flat(),
  quickReplyFailed: Object.values(QUICK_REPLY_CASES).flat(),
  quickReplyPasted: [
    {
      event: { kind: 'quickReplyPasted', excerpt: 'prix libre' },
      line: 'Réponse rapide collée dans le jeu : « prix libre »'
    }
  ],
  trayFocus: Object.values(TRAY_CASES).flat(),
  shortcutsBound: [
    {
      event: { kind: 'shortcutsBound', bindings: BINDINGS },
      line: BINDINGS_LINE
    },
    {
      event: {
        kind: 'shortcutsBound',
        bindings: [
          {
            binding: { kind: 'action', action: 'next' },
            accelerator: 'Control+Shift+ArrowRight',
            status: {
              kind: 'duplicate',
              binding: { kind: 'action', action: 'previous' }
            }
          },
          {
            binding: { kind: 'action', action: 'swap' },
            accelerator: null,
            status: { kind: 'refused', detail: 'déjà prise' }
          }
        ]
      },
      line: 'Raccourcis : Fenêtre suivante Control+Shift+ArrowRight en doublon avec Fenêtre précédente, donc inerte · Inverser hommes et femmes aucune combinaison refusé (déjà prise).'
    },
    {
      event: {
        kind: 'shortcutsBound',
        bindings: [
          {
            binding: { kind: 'quickReply', id: 2 },
            accelerator: 'Control+Shift+KeyP',
            status: {
              kind: 'duplicate',
              binding: { kind: 'action', action: 'next' }
            }
          }
        ]
      },
      line: 'Raccourcis : Réponse rapide 2 Control+Shift+KeyP en doublon avec Fenêtre suivante, donc inerte.'
    }
  ],
  shortcutsFailed: [
    {
      event: { kind: 'shortcutsFailed', detail: DETAIL },
      line: `${DETAILED_LINES.shortcutsFailed} : ${DETAIL}`
    }
  ],
  scanFailed: [
    {
      event: { kind: 'scanFailed', detail: DETAIL },
      line: `${DETAILED_LINES.scanFailed} : ${DETAIL}`
    }
  ],
  saveFailed: [
    {
      event: { kind: 'saveFailed', detail: DETAIL },
      line: `${DETAILED_LINES.saveFailed} : ${DETAIL}`
    }
  ],
  openFailed: [
    {
      event: { kind: 'openFailed', detail: DETAIL },
      line: `${DETAILED_LINES.openFailed} : ${DETAIL}`
    }
  ],
  snapshotFailed: [
    {
      event: { kind: 'snapshotFailed', detail: DETAIL },
      line: `${DETAILED_LINES.snapshotFailed} : ${DETAIL}`
    }
  ],
  trayFailed: [
    {
      event: { kind: 'trayFailed', detail: DETAIL },
      line: `${DETAILED_LINES.trayFailed} : ${DETAIL}`
    }
  ],
  windowFailed: [
    {
      event: { kind: 'windowFailed', detail: DETAIL },
      line: `${DETAILED_LINES.windowFailed} : ${DETAIL}`
    }
  ],
  clientMaximized: [
    {
      event: { kind: 'clientMaximized' },
      line: PLAIN_LINES.clientMaximized
    }
  ],
  shortTitlesFailed: [
    {
      event: { kind: 'shortTitlesFailed', detail: DETAIL },
      line: `${DETAILED_LINES.shortTitlesFailed} : ${DETAIL}`
    }
  ],
  windowIconFailed: [
    {
      event: { kind: 'windowIconFailed', detail: DETAIL },
      line: `${DETAILED_LINES.windowIconFailed} : ${DETAIL}`
    }
  ],
  clientMaximizeFailed: [
    {
      event: { kind: 'clientMaximizeFailed', detail: DETAIL },
      line: `${DETAILED_LINES.clientMaximizeFailed} : ${DETAIL}`
    }
  ],
  configLoadFailed: [
    {
      event: {
        kind: 'configLoadFailed',
        detail: DETAIL,
        quarantined: '/tmp/multifus/config.json.bak'
      },
      line: `Configuration non chargée, Multifus est reparti sur ses réglages par défaut (${DETAIL}). Fichier mis de côté : /tmp/multifus/config.json.bak`
    },
    {
      event: { kind: 'configLoadFailed', detail: DETAIL, quarantined: null },
      line: `Configuration non chargée, Multifus est reparti sur ses réglages par défaut (${DETAIL}). Rien n’a été déplacé.`
    }
  ],
  configNotSetAside: [
    {
      event: { kind: 'configNotSetAside', detail: DETAIL },
      line: `${DETAILED_LINES.configNotSetAside} : ${DETAIL}`
    }
  ],
  startAtLoginReconciled: [
    {
      event: { kind: 'startAtLoginReconciled', enabled: true },
      line: 'Démarrage avec la session actif, enregistrement réécrit.'
    },
    {
      event: { kind: 'startAtLoginReconciled', enabled: false },
      line: 'Démarrage avec la session inactif, aucun enregistrement.'
    }
  ],
  startAtLoginFailed: [
    {
      event: { kind: 'startAtLoginFailed', detail: DETAIL },
      line: `${DETAILED_LINES.startAtLoginFailed} : ${DETAIL}`
    }
  ],
  panicked: [
    {
      event: { kind: 'panicked', work: 'scan' },
      line: `${WORK_LABELS.scan} a échoué brutalement, et a repris.`
    },
    {
      event: { kind: 'panicked', work: 'shortcuts' },
      line: `${WORK_LABELS.shortcuts} a échoué brutalement, et a repris.`
    },
    {
      event: { kind: 'panicked', work: 'tray' },
      line: `${WORK_LABELS.tray} a échoué brutalement, et a repris.`
    }
  ],
  updateAvailable: [
    {
      event: { kind: 'updateAvailable', version: '1.4.0' },
      line: 'La version 1.4.0 est disponible.'
    }
  ],
  updateUpToDate: [
    { event: { kind: 'updateUpToDate' }, line: PLAIN_LINES.updateUpToDate }
  ],
  updateFailed: [
    {
      event: { kind: 'updateFailed', detail: DETAIL },
      line: `${DETAILED_LINES.updateFailed} : ${DETAIL}`
    }
  ],
  relayPaired: [
    { event: { kind: 'relayPaired' }, line: PLAIN_LINES.relayPaired }
  ],
  relayUnpaired: [
    { event: { kind: 'relayUnpaired' }, line: PLAIN_LINES.relayUnpaired }
  ],
  relayEnabled: [
    {
      event: { kind: 'relayEnabled', surface: 'tray' },
      line: 'Envoi des messages privés activé depuis la barre système.'
    },
    {
      event: { kind: 'relayEnabled', surface: 'window' },
      line: 'Envoi des messages privés activé depuis la fenêtre.'
    }
  ],
  relayTestSent: [
    { event: { kind: 'relayTestSent' }, line: PLAIN_LINES.relayTestSent }
  ],
  relayDisabled: [
    {
      event: { kind: 'relayDisabled', reason: 'shortcut' },
      line: RELAY_STOP_LINES.shortcut
    },
    {
      event: { kind: 'relayDisabled', reason: 'tray' },
      line: RELAY_STOP_LINES.tray
    },
    {
      event: { kind: 'relayDisabled', reason: 'window' },
      line: RELAY_STOP_LINES.window
    },
    {
      event: { kind: 'relayDisabled', reason: 'noRelayedCharacter' },
      line: RELAY_STOP_LINES.noRelayedCharacter
    },
    {
      event: { kind: 'relayDisabled', reason: 'noLongerPaired' },
      line: RELAY_STOP_LINES.noLongerPaired
    }
  ],
  relayFailed: Object.values(RELAY_FAILURE_CASES).flat(),
  relaySent: [
    {
      event: { kind: 'relaySent', nickname: NICKNAME },
      line: 'Alpha : message privé relayé sur le téléphone.'
    }
  ],
  relayNoticeSent: Object.values(NOTICE_CASES).flat(),
  displayAwake: [
    {
      event: { kind: 'displayAwake', held: true },
      line: 'Écran tenu éveillé : il y a des messages privés à écouter.'
    },
    {
      event: { kind: 'displayAwake', held: false },
      line: 'Écran relâché : plus aucun personnage relayé n’est connecté.'
    }
  ],
  displayAwakeFailed: [
    {
      event: { kind: 'displayAwakeFailed', detail: DETAIL },
      line: `${DETAILED_LINES.displayAwakeFailed} : ${DETAIL}`
    }
  ],
  walkEnabled: [
    {
      event: { kind: 'walkEnabled', enabled: true, from: 'shortcut' },
      line: 'Déplacement allumé depuis un raccourci.'
    },
    {
      event: { kind: 'walkEnabled', enabled: false, from: 'tray' },
      line: 'Déplacement éteint depuis la barre système.'
    },
    {
      event: { kind: 'walkEnabled', enabled: false, from: 'listeningLost' },
      line: 'Déplacement éteint depuis Multifus, qui n’écoutait plus les clics.'
    }
  ],
  walkIdle: [
    {
      event: { kind: 'walkIdle', reason: 'nobodyInCycle' },
      line: WALK_IDLE_LINES.nobodyInCycle
    },
    {
      event: { kind: 'walkIdle', reason: 'tooSlow' },
      line: WALK_IDLE_LINES.tooSlow
    }
  ],
  walkListeningLost: [
    {
      event: { kind: 'walkListeningLost' },
      line: PLAIN_LINES.walkListeningLost
    }
  ],
  walkListeningRefused: [
    {
      event: { kind: 'walkListeningRefused', detail: DETAIL },
      line: `${DETAILED_LINES.walkListeningRefused} : ${DETAIL}`
    }
  ],
  walkSwitchFailed: [
    {
      event: { kind: 'walkSwitchFailed', detail: DETAIL },
      line: `${DETAILED_LINES.walkSwitchFailed} : ${DETAIL}`
    }
  ],
  reset: [{ event: { kind: 'reset' }, line: PLAIN_LINES.reset }],
  quit: [{ event: { kind: 'quit' }, line: PLAIN_LINES.quit }]
} as const satisfies JournalCases

const NOTIFIED = {
  kind: 'notification',
  nickname: NICKNAME,
  notificationKind: 'private_message'
} as const satisfies Omit<EventOf<'notification'>, 'outcome'>

const FIRED = {
  kind: 'shortcut',
  action: 'next'
} as const satisfies Omit<EventOf<'shortcut'>, 'outcome'>

const CLICKED = {
  kind: 'trayFocus',
  nickname: NICKNAME
} as const satisfies Omit<EventOf<'trayFocus'>, 'outcome'>

const MORNING = Date.UTC(2026, 0, 15, 9, 5, 3)
const NOON = Date.UTC(2026, 0, 15, 12, 30, 0)

const SNAPSHOT = {
  version: '0.1.0',
  system: 'macOS 26.0 (arm64)',
  characters: [],
  shortcuts: SHORTCUTS,
  quickReplies: QUICK_REPLIES,
  autoFocus: [],
  autoFocusEnabled: true,
  wakesMinimized: true,
  startAtLogin: false,
  maximizeOnLaunch: false,
  shortTitles: false,
  ungroupTaskbar: false,
  taskbarCombines: true,
  authorization: { granted: true, listening: true },
  config: { path: '/tmp/multifus/config.json', problem: null },
  update: { kind: 'upToDate' },
  relay: {
    paired: false,
    sendBody: false,
    active: false,
    ready: false,
    screenSaver: { kind: 'never' },
    pairing: { kind: 'idle' },
    switch: { kind: 'idle' },
    test: { kind: 'idle' }
  },
  walk: {
    enabled: false,
    supported: true,
    budget: 60,
    ceiling: 250,
    measures: [
      { milliseconds: 41, landed: true },
      { milliseconds: 250, landed: false }
    ]
  },
  journal: [
    { id: 1, at: MORNING, event: { kind: 'listening' } },
    { id: 2, at: NOON, event: { kind: 'characterOnline', nickname: NICKNAME } }
  ]
} as const satisfies Snapshot

describe('journalLine', () => {
  it.each(Object.values(JOURNAL_CASES).flat())(
    '$event.kind se lit « $line »',
    ({ event, line }) => {
      const written = journalLine(event)

      expect(written).toBe(line)
    }
  )
})

describe('journalTone', () => {
  it('salue une autorisation accordée', () => {
    const tone = journalTone({ kind: 'authorization', granted: true })

    expect(tone).toBe('good')
  })

  it('avertit sur une autorisation refusée', () => {
    const tone = journalTone({ kind: 'authorization', granted: false })

    expect(tone).toBe('warning')
  })

  it('salue une demande d’autorisation qui a abouti', () => {
    const event = {
      kind: 'authorizationRequested',
      granted: true,
      failure: null
    } as const

    const tone = journalTone(event)

    expect(tone).toBe('good')
  })

  it('ne compte pas comme une faute un refus dans la seconde qui suit', () => {
    const event = {
      kind: 'authorizationRequested',
      granted: false,
      failure: null
    } as const

    const tone = journalTone(event)

    expect(tone).toBe('neutral')
  })

  it('avertit quand le système n’a pas pu répondre à la demande', () => {
    const event = {
      kind: 'authorizationRequested',
      granted: false,
      failure: DETAIL
    } as const

    const tone = journalTone(event)

    expect(tone).toBe('warning')
  })

  it('salue une notification qui a ramené une fenêtre', () => {
    const event = {
      ...NOTIFIED,
      outcome: { outcome: 'focused' }
    } as const

    const tone = journalTone(event)

    expect(tone).toBe('good')
  })

  it('reste neutre sur une notification qui n’a rien fait', () => {
    const event = {
      ...NOTIFIED,
      outcome: { outcome: 'kindDisabled' }
    } as const

    const tone = journalTone(event)

    expect(tone).toBe('neutral')
  })

  it('salue un raccourci qui a ramené une fenêtre', () => {
    const event = {
      ...FIRED,
      outcome: { outcome: 'focused', nickname: NICKNAME }
    } as const

    const tone = journalTone(event)

    expect(tone).toBe('good')
  })

  it('reste neutre sur un raccourci frappé hors du jeu', () => {
    const event = { ...FIRED, outcome: { outcome: 'outsideGame' } } as const

    const tone = journalTone(event)

    expect(tone).toBe('neutral')
  })

  it('avertit sur un raccourci dont le focus a été refusé', () => {
    const event = {
      ...FIRED,
      outcome: { outcome: 'focusFailed', nickname: NICKNAME, detail: DETAIL }
    } as const

    const tone = journalTone(event)

    expect(tone).toBe('warning')
  })

  it('salue un clic de la barre système qui a abouti', () => {
    const event = { ...CLICKED, outcome: { outcome: 'focused' } } as const

    const tone = journalTone(event)

    expect(tone).toBe('good')
  })

  it('avertit sur un clic de la barre système que le système a refusé', () => {
    const event = {
      ...CLICKED,
      outcome: { outcome: 'focusFailed', detail: DETAIL }
    } as const

    const tone = journalTone(event)

    expect(tone).toBe('warning')
  })

  it('avertit dès qu’une seule combinaison n’est pas sur le système', () => {
    const tone = journalTone({ kind: 'shortcutsBound', bindings: BINDINGS })

    expect(tone).toBe('warning')
  })

  it('reste neutre quand chaque combinaison est posée ou vide', () => {
    const bindings = BINDINGS.filter((binding) => {
      return binding.status.kind !== 'invalid'
    })

    const tone = journalTone({ kind: 'shortcutsBound', bindings })

    expect(tone).toBe('neutral')
  })

  it('lit dans la table le ton d’une écoute qui a démarré', () => {
    const tone = journalTone({ kind: 'listening' })

    expect(tone).toBe('good')
  })

  it('lit dans la table le ton d’une lecture des fenêtres impossible', () => {
    const tone = journalTone({ kind: 'scanFailed', detail: DETAIL })

    expect(tone).toBe('warning')
  })
})

describe('journalTime', () => {
  it('écrit l’heure, les minutes et les secondes sur deux chiffres', () => {
    const time = journalTime(MORNING)

    expect(time).toBe('09:05:03')
  })

  it('écrit minuit comme une heure ordinaire', () => {
    const time = journalTime(Date.UTC(2026, 0, 15))

    expect(time).toBe('00:00:00')
  })
})

describe('journalTranscript', () => {
  it('porte un en-tête qui se lit seul, puis une entrée par ligne', () => {
    const transcript = journalTranscript(SNAPSHOT)

    expect(transcript).toBe(
      [
        'Multifus 0.1.0 sur macOS 26.0 (arm64)',
        'Autorisation : accordée, écoute active',
        'AutoFocus : actif, réveil des réduites actif',
        'Déplacement : éteint, budget 60 ms, dernières bascules 41 250✗ ms',
        BINDINGS_LINE,
        'Configuration : /tmp/multifus/config.json',
        `Mise à jour : ${strings.about.updateUpToDate}`,
        'Entrées en mémoire : 2, 15/01/2026 09:05:03 → 15/01/2026 12:30:00',
        'Le fichier du journal sur le disque va plus loin en arrière que ces lignes.',
        '',
        `09:05:03  ${PLAIN_LINES.listening}`,
        '12:30:00  Alpha est connecté.'
      ].join('\n')
    )
  })

  it('dit l’autorisation refusée et l’écoute arrêtée', () => {
    const authorization = { granted: false, listening: false }

    const transcript = journalTranscript({ ...SNAPSHOT, authorization })

    expect(transcript).toContain('Autorisation : refusée, écoute arrêtée')
  })

  it('dit l’AutoFocus suspendu et le réveil des réduites inactif', () => {
    const transcript = journalTranscript({
      ...SNAPSHOT,
      autoFocusEnabled: false,
      wakesMinimized: false
    })

    expect(transcript).toContain(
      'AutoFocus : suspendu, réveil des réduites inactif'
    )
  })

  it('dit le Déplacement indisponible là où les clics ne sont pas lus', () => {
    const walk = { ...SNAPSHOT.walk, supported: false }

    const transcript = journalTranscript({ ...SNAPSHOT, walk })

    expect(transcript).toContain('Déplacement : indisponible sur ce système')
  })

  it('ne promet aucune bascule tant qu’aucune n’a été mesurée', () => {
    const walk = { ...SNAPSHOT.walk, enabled: true, measures: [] }

    const transcript = journalTranscript({ ...SNAPSHOT, walk })

    expect(transcript).toContain('Déplacement : allumé, aucune bascule mesurée')
  })

  it('ne promet aucune période quand rien n’est en mémoire', () => {
    const transcript = journalTranscript({ ...SNAPSHOT, journal: [] })

    expect(transcript).toContain('Entrées en mémoire : 0, aucune entrée')
  })
})
