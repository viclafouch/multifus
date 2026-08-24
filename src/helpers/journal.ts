/**
 * The journal put into words, which is the only place its events become French.
 * Pure: it reads the tables of `constants/journal.ts` and never the bridge.
 */

import type {
  JournalEntry,
  JournalEvent,
  NotificationOutcome,
  QuickReplyFailure,
  RosterChange,
  SettingChange,
  ShortcutOutcome,
  TrayOutcome
} from '@/@types/journal'
import type { NotificationKind } from '@/@types/notification'
import type { RelayFailure } from '@/@types/relay'
import type { Gender } from '@/@types/roster'
import type {
  Binding,
  BoundCombination,
  ShortcutAction
} from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { Surface } from '@/@types/system'
import type { JournalTone } from '@/constants/journal'
import {
  DEAD_SHORTCUT_STATUSES,
  DETAILED_LINES,
  NOTICE_LINES,
  QUICK_REPLY_FAILURE_TONES,
  PLAIN_LINES,
  RELAY_STOP_LINES,
  SHORTCUT_TONES,
  TONES,
  TRAY_TONES,
  WORK_LABELS
} from '@/constants/journal'
import { strings } from '@/constants/strings'
import { updateLine } from '@/helpers/wording'

/** How a moment of the day is written in the journal. */
export const journalTime = (milliseconds: number) => {
  return new Date(milliseconds).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * The same moment with its date, for the head of a transcript. A transcript
 * pasted elsewhere has to say which day it was.
 */
const journalMoment = (milliseconds: number) => {
  return new Date(milliseconds).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  })
}

/**
 * Only the four events whose tone depends on their payload are read by hand,
 * and two of them read a table of their own.
 */
export const journalTone = (event: JournalEvent): JournalTone => {
  if (event.kind === 'authorization') {
    return event.granted ? 'good' : 'warning'
  }

  // Being refused a second after asking is what macOS always answers, so it is
  // the ordinary state and not a fault.
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

  if (event.kind === 'quickReplyFailed') {
    return QUICK_REPLY_FAILURE_TONES[event.reason.reason]
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

/** The kinds each of the two tables of stock phrases answers for. */
type DetailedEventKind = keyof typeof DETAILED_LINES
type PlainEventKind = keyof typeof PLAIN_LINES

const isDetailed = (
  event: JournalEvent
): event is Extract<JournalEvent, { readonly kind: DetailedEventKind }> => {
  return event.kind in DETAILED_LINES
}

const isPlain = (
  event: JournalEvent
): event is Extract<JournalEvent, { readonly kind: PlainEventKind }> => {
  return event.kind in PLAIN_LINES
}

/**
 * The first line of every run, and the one that makes the rest readable: a
 * transcript is read against a release, a system, and a way of starting.
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
 * What the relay could not do, put into words. Each line names the place it is
 * repaired in, and they are three different places.
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
 * Why a quick reply did not reach the chat, put into words. Each line names the place
 * it is repaired in, and they are six different places.
 */
const quickReplyFailedLine = (reason: QuickReplyFailure) => {
  switch (reason.reason) {
    case 'outsideGame': {
      return 'Réponse rapide ignorée : aucune fenêtre Dofus au premier plan.'
    }
    case 'foregroundUnknown': {
      return `Réponse rapide ignorée : impossible de savoir quelle fenêtre est au premier plan (${reason.detail}).`
    }
    case 'gone': {
      return 'Réponse rapide introuvable : elle a été retirée entre l’appui et le collage.'
    }
    case 'clipboardRefused': {
      return `Réponse rapide non collée : le presse-papiers a refusé le texte (${reason.detail}).`
    }
    case 'pasteRefused': {
      return `Réponse rapide non collée : le système a refusé la combinaison de collage (${reason.detail}).`
    }
    case 'clipboardNotGivenBack': {
      return `Réponse rapide collée, mais le presse-papiers d’avant n’a pas pu être rendu (${reason.detail}).`
    }
    default: {
      return 'Réponse rapide non collée.'
    }
  }
}

/** Where the user acted, for the settings and the switch that have two doors. */
const surfaceLabel = (surface: Surface) => {
  return surface === 'tray' ? 'la barre système' : 'la fenêtre'
}

/** How a sex is named when a whole one of them is meant. */
const genderPluralLabel = (gender: Gender) => {
  return gender === 'male' ? 'les hommes' : 'les femmes'
}

/**
 * What the user did to the roster, put into words. These lines exist so that the
 * journal reads on its own: a `Suivant` finding nobody is explained by them.
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
 * Every combination as the system left it, on one line, the quick replies after the
 * four actions. Written as they are stored, next to a configuration file.
 */
const shortcutsBoundLine = (bindings: readonly BoundCombination[]) => {
  const parts = bindings.map((bound) => {
    return `${journalBindingLabel(bound.binding)} ${boundCombinationLabel(bound)}`
  })

  return `Raccourcis : ${parts.join(' · ')}.`
}

/**
 * What a combination fires, named for a reader of the file. Never the
 * `bindingLabel` of `wording.ts`, which quotes a quick reply: this file holds no text.
 */
const journalBindingLabel = (binding: Binding) => {
  return binding.kind === 'action'
    ? strings.shortcuts.actions[binding.action].label
    : `Réponse rapide ${binding.id}`
}

const boundCombinationLabel = ({ accelerator, status }: BoundCombination) => {
  // `null` is a combination the user cleared, which the status reports as
  // `unbound`. Naming it here as well keeps every branch readable on its own.
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
      return `${combination} en doublon avec ${journalBindingLabel(status.binding)}, donc inerte`
    }
    case 'refused': {
      return `${combination} refusé (${status.detail})`
    }
    default: {
      return combination
    }
  }
}

/** Everything laid on the system, in the order the Rust side lays it down. */
const boundCombinations = (snapshot: Snapshot): readonly BoundCombination[] => {
  const actions = snapshot.shortcuts.map(({ action, accelerator, status }) => {
    return { binding: { kind: 'action', action }, accelerator, status } as const
  })

  const quickReplies = snapshot.quickReplies.map(
    ({ id, accelerator, status }) => {
      return {
        binding: { kind: 'quickReply', id },
        accelerator,
        status
      } as const
    }
  )

  return [...actions, ...quickReplies]
}

/**
 * The stretch of time the entries in memory cover, with the date: it says how
 * far back these lines reach before the file has to be opened.
 */
const journalPeriod = (entries: readonly JournalEntry[]) => {
  if (entries.length === 0) {
    return 'aucune entrée'
  }

  // Through a variable on purpose: the formatter rewrites the index in place
  // into `entries.at(-1)`, which the `lib` of this project does not have.
  const lastIndex = entries.length - 1

  return `${journalMoment(entries[0].at)} → ${journalMoment(entries[lastIndex].at)}`
}

/**
 * The journal as plain text, a header and then one entry per line, oldest first.
 * The header is not decoration, see `docs/macos.md`, « Le journal ».
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
    shortcutsBoundLine(boundCombinations(snapshot)),
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
 * A shortcut that fired, put into words. Every line names the action first,
 * since the question asked here is always about one combination.
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
 * A character clicked in the system tray, put into words. Named after where the
 * click came from, since a shortcut asks the system for the same thing.
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
 * The kinds the two tables of stock phrases did not take: the ones whose line is
 * built from a payload rather than looked up.
 */
type ComposedEventKind = Exclude<
  JournalEvent['kind'],
  DetailedEventKind | PlainEventKind
>

/**
 * Of those, the ones multifus reports about itself. Listed by hand, its other
 * half derived below, so an event forgotten here fails to compile there.
 */
type RunEventKind =
  | 'authorization'
  | 'characterOffline'
  | 'characterOnline'
  | 'configLoadFailed'
  | 'displayAwake'
  | 'notification'
  | 'panicked'
  | 'relayFailed'
  | 'relayNoticeSent'
  | 'relaySent'
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
  'displayAwake',
  'notification',
  'panicked',
  'relayFailed',
  'relayNoticeSent',
  'relaySent',
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
 * What multifus observed on its own, put into words. Two functions and not one
 * because the Rust side keeps adding events, see `docs/macos.md`.
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
    case 'relaySent': {
      return `${event.nickname} : message privé relayé sur le téléphone.`
    }
    case 'relayNoticeSent': {
      return NOTICE_LINES[event.case]
    }
    case 'displayAwake': {
      return displayAwakeLine(event.held)
    }
    default: {
      return ''
    }
  }
}

/**
 * Whether the machine is being kept awake for the relay. The hold falling is
 * normally the quart d'heure and not somebody switching off, see CONTEXT.md.
 */
const displayAwakeLine = (held: boolean) => {
  return held
    ? 'Écran tenu éveillé : le relais a quelque chose à écouter.'
    : 'Écran relâché : plus aucun personnage relayé n’est connecté.'
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
    case 'quickReplyPasted': {
      return `Réponse rapide collée dans le jeu : « ${event.excerpt} »`
    }
    case 'quickReplyFailed': {
      return quickReplyFailedLine(event.reason)
    }
    case 'trayFocus': {
      return trayLine(event)
    }
    case 'relayEnabled': {
      return `Relais activé depuis ${surfaceLabel(event.surface)}.`
    }
    case 'relayDisabled': {
      return RELAY_STOP_LINES[event.reason]
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
