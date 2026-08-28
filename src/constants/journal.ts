import type {
  JournalEvent,
  QuickReplyFailure,
  ShortcutOutcome,
  TrayOutcome
} from '@/@types/journal'
import type { NoticeCase, RelayStop } from '@/@types/relay'
import type { Gender } from '@/@types/roster'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Work } from '@/@types/system'
import type { WalkFrom, WalkIdle } from '@/@types/walk'

export type JournalTone = 'good' | 'neutral' | 'warning'

type PlainEventKind = Exclude<
  JournalEvent['kind'],
  | 'authorization'
  | 'authorizationRequested'
  | 'characterShortcut'
  | 'notification'
  | 'quickReplyFailed'
  | 'shortcut'
  | 'shortcutsBound'
  | 'trayFocus'
  | 'walkIdle'
>

export const TONES = {
  started: 'neutral',
  listening: 'good',
  listeningFailed: 'warning',
  notificationUnreadable: 'warning',
  panicked: 'warning',
  characterOnline: 'neutral',
  characterOffline: 'neutral',
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
  walkEnabled: 'neutral',
  walkListeningResumed: 'good',
  walkListeningLost: 'warning',
  walkListeningRefused: 'warning',
  walkSwitchFailed: 'warning',
  bannerFailed: 'warning',
  clientMaximized: 'good',
  clientMaximizeFailed: 'warning',
  shortTitlesFailed: 'warning',
  windowIconFailed: 'warning',
  startAtLoginReconciled: 'neutral',
  startAtLoginFailed: 'warning',
  updateAvailable: 'good',
  updateUpToDate: 'neutral',
  updateFailed: 'warning',
  relayPaired: 'good',
  relayUnpaired: 'neutral',
  relayFailed: 'warning',
  relayEnabled: 'good',
  relayDisabled: 'neutral',
  relaySent: 'good',
  relayNoticeSent: 'good',
  relayTestSent: 'good',
  displayAwake: 'neutral',
  displayAwakeFailed: 'warning',
  quickReplyPasted: 'good',
  reset: 'neutral',
  quit: 'neutral'
} as const satisfies Record<PlainEventKind, JournalTone>

export const QUICK_REPLY_FAILURE_TONES = {
  outsideGame: 'neutral',
  gone: 'neutral',
  foregroundUnknown: 'warning',
  clipboardRefused: 'warning',
  pasteRefused: 'warning',
  clipboardNotGivenBack: 'warning'
} as const satisfies Record<QuickReplyFailure['reason'], JournalTone>

export const WALK_IDLE_TONES = {
  nobodyInCycle: 'neutral',
  tooSlow: 'warning'
} as const satisfies Record<WalkIdle, JournalTone>

export const WALK_IDLE_LINES = {
  nobodyInCycle:
    'Déplacement rapide : personne dans le défilement, le clic n’a nulle part où aller.',
  tooSlow:
    'Déplacement rapide : la fenêtre suivante a mis plus de temps que prévu à passer devant.'
} as const satisfies Record<WalkIdle, string>

export const GENDER_GROUP_LINES = {
  male: {
    excluded: 'Tous les hommes connectés sont exclus.',
    included: 'Tous les hommes connectés sont réintégrés.'
  },
  female: {
    excluded: 'Toutes les femmes connectées sont exclues.',
    included: 'Toutes les femmes connectées sont réintégrées.'
  }
} as const satisfies Record<Gender, Record<'excluded' | 'included', string>>

export const WALK_FROM_LABELS = {
  window: 'la fenêtre',
  tray: 'la barre système',
  shortcut: 'un raccourci',
  listeningLost: 'Multifus, qui n’écoutait plus les clics',
  noWindowLeft: 'Multifus, qui n’avait plus une fenêtre à parcourir'
} as const satisfies Record<WalkFrom, string>

export const SHORTCUT_TONES = {
  focused: 'good',
  excluded: 'good',
  included: 'good',
  walk: 'good',
  outsideGame: 'neutral',
  notInRoster: 'neutral',
  nobodyInCycle: 'neutral',
  noMain: 'neutral',
  alreadyThere: 'neutral',
  noWindow: 'neutral',
  focusFailed: 'warning',
  foregroundUnknown: 'warning'
} as const satisfies Record<ShortcutOutcome['outcome'], JournalTone>

export const DEAD_SHORTCUT_STATUSES = new Set<
  ShortcutBinding['status']['kind']
>(['duplicate', 'invalid', 'refused'])

export const TRAY_TONES = {
  focused: 'good',
  noWindow: 'neutral',
  focusFailed: 'warning'
} as const satisfies Record<TrayOutcome['outcome'], JournalTone>

type DetailedEventKind = Exclude<
  Extract<JournalEvent, { readonly detail: string }>['kind'],
  'configLoadFailed'
>

export const DETAILED_LINES = {
  listeningFailed: 'Écoute des notifications impossible',
  notificationUnreadable: 'Notification impossible à lire',
  shortcutsFailed: 'Les raccourcis ne sont pas fiables',
  trayFailed: 'La barre système n’est pas fiable',
  windowFailed: 'La fenêtre de Multifus n’a pas suivi',
  snapshotFailed: 'La fenêtre n’a pas reçu le tableau de bord',
  startAtLoginFailed: 'Démarrage avec la session impossible',
  scanFailed: 'Lecture des fenêtres impossible',
  clientMaximizeFailed: 'Agrandissement de la fenêtre d’un client impossible',
  shortTitlesFailed: 'Titre d’une fenêtre impossible à changer',
  windowIconFailed: 'Icône d’une fenêtre impossible à poser',
  walkListeningRefused:
    'Déplacement rapide impossible à allumer, Multifus n’écoute pas les clics',
  walkSwitchFailed:
    'Déplacement rapide : la fenêtre suivante n’est pas passée devant',
  bannerFailed: 'La bannière du Déplacement rapide n’a pas suivi',
  saveFailed: 'Configuration non enregistrée',
  configNotSetAside:
    'Configuration illisible et impossible à déplacer, le prochain enregistrement l’écrasera',
  openFailed: 'Le système n’a pas pu ouvrir cet élément',
  updateFailed: 'Mise à jour impossible',
  displayAwakeFailed:
    'Écran impossible à tenir éveillé, la session peut se verrouiller'
} as const satisfies Record<DetailedEventKind, string>

type WithoutPayload<Event> = Event extends { readonly kind: string }
  ? keyof Event extends 'kind'
    ? Event['kind']
    : never
  : never

export const PLAIN_LINES = {
  listening: 'Écoute des notifications démarrée.',
  clientMaximized:
    'Un client Dofus vient d’ouvrir : sa fenêtre a été agrandie à l’écran.',
  updateUpToDate: 'Aucune version plus récente.',
  relayPaired: 'Robot Telegram relié.',
  relayUnpaired: 'Robot Telegram retiré, son code effacé du trousseau.',
  relayTestSent: 'Message d’essai envoyé sur le téléphone.',
  walkListeningResumed:
    'Déplacement rapide : le système avait cessé de transmettre les clics, ils reviennent.',
  walkListeningLost:
    'Déplacement rapide : le système a cessé de transmettre les clics, et n’a pas repris.',
  reset: 'Configuration remise à zéro.',
  quit: 'Multifus a été quitté depuis la barre système.'
} as const satisfies Record<WithoutPayload<JournalEvent>, string>

export const RELAY_STOP_LINES = {
  shortcut:
    'Envoi sur le téléphone coupé : un raccourci a été frappé depuis le jeu.',
  tray: 'Envoi sur le téléphone coupé depuis la barre système.',
  window: 'Envoi sur le téléphone coupé depuis la fenêtre.',
  noRelayedCharacter:
    'Envoi sur le téléphone coupé : le dernier personnage relayé a été décoché.',
  noLongerPaired:
    'Envoi sur le téléphone coupé : il n’y a plus de robot où écrire.'
} as const satisfies Record<RelayStop, string>

export const NOTICE_LINES = {
  enabled: 'Avis envoyé : les messages privés partent sur le téléphone.',
  disabled: 'Avis envoyé : les messages privés ne partent plus.',
  disconnected: 'Avis envoyé : un personnage relayé s’est déconnecté.',
  both: 'Avis envoyé : une déconnexion, et plus personne de relayé connecté.'
} as const satisfies Record<NoticeCase, string>

export const WORK_LABELS = {
  scan: 'La lecture des fenêtres',
  shortcuts: 'La réponse à un raccourci',
  tray: 'La réponse à un clic dans la barre système',
  walk: 'La bascule du Déplacement rapide',
  banner: 'La bannière du Déplacement rapide'
} as const satisfies Record<Work, string>
