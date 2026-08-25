import type {
  JournalEvent,
  QuickReplyFailure,
  ShortcutOutcome,
  TrayOutcome
} from '@/@types/journal'
import type { NoticeCase, RelayStop } from '@/@types/relay'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Work } from '@/@types/system'

export type JournalTone = 'good' | 'neutral' | 'warning'

type PlainEventKind = Exclude<
  JournalEvent['kind'],
  | 'authorization'
  | 'authorizationRequested'
  | 'notification'
  | 'quickReplyFailed'
  | 'shortcut'
  | 'shortcutsBound'
  | 'trayFocus'
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
  clientMaximized: 'good',
  clientMaximizeFailed: 'warning',
  shortTitlesFailed: 'warning',
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

export const SHORTCUT_TONES = {
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
  relayPaired: 'Relais apparié à un robot Telegram.',
  relayUnpaired: 'Robot Telegram délié, jeton effacé du trousseau.',
  relayTestSent: 'Message d’essai envoyé sur le téléphone.',
  reset: 'Configuration remise à zéro.',
  quit: 'Multifus a été quitté depuis la barre système.'
} as const satisfies Record<WithoutPayload<JournalEvent>, string>

export const RELAY_STOP_LINES = {
  shortcut: 'Relais coupé : un raccourci a été frappé depuis le jeu.',
  tray: 'Relais coupé depuis la barre système.',
  window: 'Relais coupé depuis la fenêtre.',
  noRelayedCharacter:
    'Relais coupé : le dernier personnage relayé a été décoché.',
  noLongerPaired: 'Relais coupé : il n’y a plus de robot où écrire.'
} as const satisfies Record<RelayStop, string>

export const NOTICE_LINES = {
  enabled: 'Avis envoyé : le relais est activé.',
  disabled: 'Avis envoyé : le relais est désactivé.',
  disconnected: 'Avis envoyé : un personnage relayé s’est déconnecté.',
  both: 'Avis envoyé : une déconnexion, et plus personne de relayé connecté.'
} as const satisfies Record<NoticeCase, string>

export const WORK_LABELS = {
  scan: 'La lecture des fenêtres',
  shortcuts: 'La réponse à un raccourci',
  tray: 'La réponse à un clic dans la barre système'
} as const satisfies Record<Work, string>
