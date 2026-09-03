import { msg } from '@lingui/core/macro'
import type {
  JournalEvent,
  MaximizeAllOutcome,
  QuickReplyFailure,
  ShortcutOutcome,
  TrayOutcome,
  WheelOutcome
} from '@/@types/journal'
import type { NoticeCase, RelayStop } from '@/@types/relay'
import type { Gender } from '@/@types/roster'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { Surface, Work } from '@/@types/system'
import type { WalkFrom, WalkIdle } from '@/@types/walk'
import type { Phrase } from '@/lib/i18n'

export type JournalTone = 'good' | 'neutral' | 'warning'

type PlainEventKind = Exclude<
  JournalEvent['kind'],
  | 'authorization'
  | 'authorizationRequested'
  | 'characterShortcut'
  | 'maximizeAll'
  | 'notification'
  | 'quickReplyFailed'
  | 'shortcut'
  | 'shortcutsBound'
  | 'trayFocus'
  | 'walkIdle'
  | 'wheelPicked'
>

export const TONES = {
  started: 'neutral',
  launchedAgain: 'neutral',
  listening: 'good',
  listeningFailed: 'warning',
  listeningLost: 'warning',
  notificationUnreadable: 'warning',
  panicked: 'warning',
  characterOnline: 'neutral',
  characterOffline: 'neutral',
  roster: 'neutral',
  setting: 'neutral',
  scanFailed: 'warning',
  wakesFailed: 'warning',
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
  wheelFailed: 'warning',
  runeTableFailed: 'warning',
  clientMaximized: 'good',
  clientMaximizeFailed: 'warning',
  clientsCountFailed: 'warning',
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
  nobodyInCycle: msg`Déplacement rapide : personne dans le défilement, le clic n’a nulle part où aller.`,
  tooSlow: msg`Déplacement rapide : la fenêtre suivante a mis plus de temps que prévu à passer devant.`
} as const satisfies Record<WalkIdle, Phrase>

export const GENDER_GROUP_LINES = {
  male: {
    excluded: msg`Tous les hommes connectés sont exclus.`,
    included: msg`Tous les hommes connectés sont réintégrés.`
  },
  female: {
    excluded: msg`Toutes les femmes connectées sont exclues.`,
    included: msg`Toutes les femmes connectées sont réintégrées.`
  }
} as const satisfies Record<Gender, Record<'excluded' | 'included', Phrase>>

export const SURFACE_LABELS = {
  window: msg`la fenêtre`,
  tray: msg`la barre système`,
  shortcut: msg`un raccourci`
} as const satisfies Record<Surface, Phrase>

export const WALK_FROM_LABELS = {
  ...SURFACE_LABELS,
  listeningLost: msg`Multifus, qui n’écoutait plus les clics`,
  noWindowLeft: msg`Multifus, qui n’avait plus une fenêtre à parcourir`
} as const satisfies Record<WalkFrom, Phrase>

export const SHORTCUT_TONES = {
  focused: 'good',
  excluded: 'good',
  included: 'good',
  outsideGame: 'neutral',
  notInRoster: 'neutral',
  nobodyInCycle: 'neutral',
  noMain: 'neutral',
  alreadyThere: 'neutral',
  noWindow: 'neutral',
  focusFailed: 'warning',
  foregroundUnknown: 'warning'
} as const satisfies Record<ShortcutOutcome['outcome'], JournalTone>

export const WHEEL_TONES = {
  focused: 'good',
  noWindow: 'neutral',
  focusFailed: 'warning'
} as const satisfies Record<WheelOutcome['outcome'], JournalTone>

export const MAXIMIZE_ALL_TONES = {
  asked: 'good',
  nothingMoved: 'warning',
  noClient: 'neutral',
  denied: 'warning',
  refused: 'warning'
} as const satisfies Record<MaximizeAllOutcome['outcome'], JournalTone>

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
  listeningFailed: msg`Écoute des notifications impossible`,
  listeningLost: msg`Écoute des notifications perdue, Multifus la reprend`,
  notificationUnreadable: msg`Notification impossible à lire`,
  shortcutsFailed: msg`Les raccourcis ne sont pas fiables`,
  trayFailed: msg`La barre système n’est pas fiable`,
  windowFailed: msg`La fenêtre de Multifus n’a pas suivi`,
  snapshotFailed: msg`La fenêtre n’a pas reçu le tableau de bord`,
  startAtLoginFailed: msg`Démarrage avec la session impossible`,
  scanFailed: msg`Lecture des fenêtres impossible`,
  wakesFailed: msg`Le tour ne sera pas prévenu par le système, il passera une fois par seconde`,
  clientMaximizeFailed: msg`Agrandissement de la fenêtre d’un client impossible`,
  clientsCountFailed: msg`Le compte des fenêtres du jeu n’est pas arrivé à l’écran`,
  shortTitlesFailed: msg`Titre d’une fenêtre impossible à changer`,
  windowIconFailed: msg`Icône d’une fenêtre impossible à poser`,
  walkListeningRefused: msg`Déplacement rapide impossible à allumer, Multifus n’écoute pas les clics`,
  walkSwitchFailed: msg`Déplacement rapide : la fenêtre suivante n’est pas passée devant`,
  bannerFailed: msg`La bannière du Déplacement rapide n’a pas suivi`,
  wheelFailed: msg`La roue n’a pas suivi`,
  runeTableFailed: msg`Le tableau des runes n’a pas suivi`,
  saveFailed: msg`Configuration non enregistrée`,
  configNotSetAside: msg`Configuration illisible et impossible à déplacer, le prochain enregistrement l’écrasera`,
  openFailed: msg`Le système n’a pas pu ouvrir cet élément`,
  updateFailed: msg`Mise à jour impossible`,
  displayAwakeFailed: msg`Écran impossible à tenir éveillé, la session peut se verrouiller`
} as const satisfies Record<DetailedEventKind, Phrase>

type WithoutPayload<Event> = Event extends { readonly kind: string }
  ? keyof Event extends 'kind'
    ? Event['kind']
    : never
  : never

export const PLAIN_LINES = {
  launchedAgain: msg`Multifus tournait déjà : le second lancement s’arrête là.`,
  listening: msg`Écoute des notifications démarrée.`,
  clientMaximized: msg`Un client Dofus vient d’ouvrir : sa fenêtre a été agrandie à l’écran.`,
  updateUpToDate: msg`Aucune version plus récente.`,
  relayPaired: msg`Robot Telegram relié.`,
  relayUnpaired: msg`Robot Telegram retiré, son code effacé du trousseau.`,
  relayTestSent: msg`Message d’essai envoyé sur le téléphone.`,
  walkListeningResumed: msg`Déplacement rapide : le système avait cessé de transmettre les clics, ils reviennent.`,
  walkListeningLost: msg`Déplacement rapide : le système a cessé de transmettre les clics, et n’a pas repris.`,
  reset: msg`Configuration remise à zéro.`,
  quit: msg`Multifus a été quitté depuis la barre système.`
} as const satisfies Record<WithoutPayload<JournalEvent>, Phrase>

export const RELAY_STOP_LINES = {
  shortcut: msg`Envoi sur le téléphone coupé : un raccourci a été frappé depuis le jeu.`,
  tray: msg`Envoi sur le téléphone coupé depuis la barre système.`,
  window: msg`Envoi sur le téléphone coupé depuis la fenêtre.`,
  noRelayedCharacter: msg`Envoi sur le téléphone coupé : le dernier personnage relayé a été décoché.`,
  noLongerPaired: msg`Envoi sur le téléphone coupé : il n’y a plus de robot où écrire.`
} as const satisfies Record<RelayStop, Phrase>

export const NOTICE_LINES = {
  enabled: msg`Avis envoyé : les messages privés partent sur le téléphone.`,
  disabled: msg`Avis envoyé : les messages privés ne partent plus.`,
  disconnected: msg`Avis envoyé : un personnage relayé s’est déconnecté.`,
  both: msg`Avis envoyé : une déconnexion, et plus personne de relayé connecté.`
} as const satisfies Record<NoticeCase, Phrase>

export const WORK_LABELS = {
  scan: msg`La lecture des fenêtres`,
  shortcuts: msg`La réponse à un raccourci`,
  tray: msg`La réponse à un clic dans la barre système`,
  walk: msg`La bascule du Déplacement rapide`,
  banner: msg`La bannière du Déplacement rapide`,
  wheel: msg`La roue`,
  runeTable: msg`Le tableau des runes`
} as const satisfies Record<Work, Phrase>
