/**
 * What each journal event is worth, in tables. A table and never a switch, so an
 * event added on the Rust side fails to compile here instead of going silent.
 */

import type {
  JournalEvent,
  QuickReplyFailure,
  ShortcutOutcome,
  TrayOutcome
} from '@/@types/journal'
import type { NoticeCase, RelayStop } from '@/@types/relay'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Work } from '@/@types/system'

/** How serious a journal entry is, which is what colours its dot. */
export type JournalTone = 'good' | 'neutral' | 'warning'

/** The events whose tone is decided by their kind alone. */
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
  clientMaximized: 'good',
  clientMaximizeFailed: 'warning',
  startAtLoginReconciled: 'neutral',
  startAtLoginFailed: 'warning',
  updateAvailable: 'good',
  updateUpToDate: 'neutral',
  updateFailed: 'warning',
  relayPaired: 'good',
  relayUnpaired: 'neutral',
  relayFailed: 'warning',
  relayEnabled: 'good',
  // What the user asked for, whichever of the five gestures it was.
  relayDisabled: 'neutral',
  relaySent: 'good',
  // The event ADR 0010 exists for, and it is not a fault: Multifus saying it has
  // stopped hearing is the whole reason the relay can be trusted.
  relayNoticeSent: 'good',
  relayTestSent: 'good',
  displayAwake: 'neutral',
  displayAwakeFailed: 'warning',
  // The key was pressed and the line went into the chat, which is the whole of
  // what a quick reply is for.
  quickReplyPasted: 'good',
  reset: 'neutral',
  quit: 'neutral'
} as const satisfies Record<PlainEventKind, JournalTone>

/**
 * The tone of each way a quick reply can be turned down. Being outside the game is
 * the guard of perimetre.md doing its job, and a quick reply removed under the key
 * press is nobody's fault either.
 */
export const QUICK_REPLY_FAILURE_TONES = {
  outsideGame: 'neutral',
  gone: 'neutral',
  foregroundUnknown: 'warning',
  clipboardRefused: 'warning',
  pasteRefused: 'warning',
  clipboardNotGivenBack: 'warning'
} as const satisfies Record<QuickReplyFailure['reason'], JournalTone>

/**
 * The tone of each outcome a shortcut can have. Ochre is spent on the four that
 * did what the key was pressed for; being outside the game is not a fault.
 */
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

/**
 * The statuses that mean a combination is not on the desktop. A duplicate
 * belongs here even though Multifus, and not the system, turned it down.
 */
export const DEAD_SHORTCUT_STATUSES = new Set<
  ShortcutBinding['status']['kind']
>(['duplicate', 'invalid', 'refused'])

/** The tone of each outcome a click in the system tray can have. */
export const TRAY_TONES = {
  focused: 'good',
  noWindow: 'neutral',
  focusFailed: 'warning'
} as const satisfies Record<TrayOutcome['outcome'], JournalTone>

/**
 * The events whose whole line is a stock phrase and the reason the system gave.
 * `configLoadFailed` is not one of them: it has to name where the file went.
 */
type DetailedEventKind = Exclude<
  Extract<JournalEvent, { readonly detail: string }>['kind'],
  'configLoadFailed'
>

/** What each of them says before the colon. */
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
  saveFailed: 'Configuration non enregistrée',
  configNotSetAside:
    'Configuration illisible et impossible à déplacer, le prochain enregistrement l’écrasera',
  openFailed: 'Le système n’a pas pu ouvrir cet élément',
  updateFailed: 'Mise à jour impossible',
  // Not a relay failure: the relay carries messages right up until the session
  // locks, and only then does it go silent.
  displayAwakeFailed:
    'Écran impossible à tenir éveillé, la session peut se verrouiller'
} as const satisfies Record<DetailedEventKind, string>

/**
 * The kinds of an event union that carry nothing but their own name. Derived
 * rather than listed, so a payload-free event has to appear in the table below.
 */
type WithoutPayload<Event> = Event extends { readonly kind: string }
  ? keyof Event extends 'kind'
    ? Event['kind']
    : never
  : never

/** Each of them is one fact with nothing to add about it. */
export const PLAIN_LINES = {
  listening: 'Écoute des notifications démarrée.',
  clientMaximized:
    'Un client Dofus vient d’ouvrir : sa fenêtre a été agrandie à l’écran.',
  updateUpToDate: 'Aucune version plus récente.',
  // Neither line names the salon. It is not a notification body, so the rule of
  // l'ADR 0006 does not reach it, but this journal is a file one hands over.
  relayPaired: 'Relais apparié à un robot Telegram.',
  relayUnpaired: 'Robot Telegram délié, jeton effacé du trousseau.',
  relayTestSent: 'Message d’essai envoyé sur le téléphone.',
  reset: 'Configuration remise à zéro.',
  quit: 'Multifus a été quitté depuis la barre système.'
} as const satisfies Record<WithoutPayload<JournalEvent>, string>

/**
 * What stopped the relay, put into words. Five gestures, and a transcript of an
 * absence is unreadable if two of them look alike.
 */
export const RELAY_STOP_LINES = {
  shortcut: 'Relais coupé : un raccourci a été frappé depuis le jeu.',
  tray: 'Relais coupé depuis la barre système.',
  window: 'Relais coupé depuis la fenêtre.',
  noRelayedCharacter:
    'Relais coupé : le dernier personnage relayé a été décoché.',
  noLongerPaired: 'Relais coupé : il n’y a plus de robot où écrire.'
} as const satisfies Record<RelayStop, string>

/**
 * What an avis said, put into words. Never the phrases themselves, which are
 * built on the Rust side: Telegram is a surface this window cannot draw.
 */
export const NOTICE_LINES = {
  enabled: 'Avis envoyé : le relais est activé.',
  disabled: 'Avis envoyé : le relais est désactivé.',
  disconnected: 'Avis envoyé : un personnage relayé s’est déconnecté.',
  both: 'Avis envoyé : une déconnexion, et plus personne de relayé connecté.'
} as const satisfies Record<NoticeCase, string>

/**
 * What each thread of Multifus is called when it has to be named. A table
 * because the Rust side sends an enum and not a sentence.
 */
export const WORK_LABELS = {
  scan: 'La lecture des fenêtres',
  shortcuts: 'La réponse à un raccourci',
  tray: 'La réponse à un clic dans la barre système'
} as const satisfies Record<Work, string>
