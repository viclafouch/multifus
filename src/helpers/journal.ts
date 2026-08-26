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
  WALK_FROM_LABELS,
  WALK_IDLE_LINES,
  WALK_IDLE_TONES,
  RELAY_STOP_LINES,
  SHORTCUT_TONES,
  TONES,
  TRAY_TONES,
  WORK_LABELS
} from '@/constants/journal'
import { strings } from '@/constants/strings'
import { updateLine } from '@/helpers/wording'

export const journalTime = (milliseconds: number) => {
  return new Date(milliseconds).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const journalMoment = (milliseconds: number) => {
  return new Date(milliseconds).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  })
}

export const journalTone = (event: JournalEvent): JournalTone => {
  if (event.kind === 'authorization') {
    return event.granted ? 'good' : 'warning'
  }

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

  if (event.kind === 'walkIdle') {
    return WALK_IDLE_TONES[event.reason]
  }

  return TONES[event.kind]
}

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

const startedLine = (event: Extract<JournalEvent, { kind: 'started' }>) => {
  const how =
    event.launch === 'session'
      ? 'au démarrage de la session'
      : 'lancé à la main'

  return `Multifus ${event.version} a démarré sur ${event.system}, ${how}.`
}

const configLoadFailedLine = (
  event: Extract<JournalEvent, { kind: 'configLoadFailed' }>
) => {
  const whereItWent =
    event.quarantined === null
      ? 'Rien n’a été déplacé.'
      : `Fichier mis de côté : ${event.quarantined}`

  return `Configuration non chargée, Multifus est reparti sur ses réglages par défaut (${event.detail}). ${whereItWent}`
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

const relayFailedLine = (reason: RelayFailure) => {
  switch (reason.reason) {
    case 'keychain': {
      return `Messages privés : le trousseau du système a refusé le code du robot (${reason.detail}).`
    }
    case 'telegram': {
      return `Messages privés : Telegram a refusé la requête (${reason.detail}).`
    }
    case 'network': {
      return `Messages privés : Telegram n’a pas répondu (${reason.detail}).`
    }
    default: {
      return 'Messages privés : échec.'
    }
  }
}

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

const surfaceLabel = (surface: Surface) => {
  return surface === 'tray' ? 'la barre système' : 'la fenêtre'
}

const genderPluralLabel = (gender: Gender) => {
  return gender === 'male' ? 'les hommes' : 'les femmes'
}

const rosterLine = (change: RosterChange) => {
  switch (change.kind) {
    case 'slept': {
      return `${change.nickname} mis de côté.`
    }
    case 'woke': {
      return `${change.nickname} remis dans le défilement.`
    }
    case 'genderAsleep': {
      const what = change.asleep ? 'de côté' : 'dans le défilement'

      return `Tous ${genderPluralLabel(change.gender)} connectés sont ${what}.`
    }
    case 'genderAssigned': {
      if (change.gender === null) {
        return `Sexe retiré à ${change.nickname}.`
      }

      const sex = change.gender === 'male' ? 'homme' : 'femme'

      return `${change.nickname} est assigné comme ${sex}.`
    }
    case 'classAssigned': {
      if (change.class === null) {
        return `Classe retirée à ${change.nickname}.`
      }

      return `${change.nickname} est assigné comme ${strings.characters.classes[change.class]}.`
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
    case 'maximizeOnLaunch': {
      const what = change.maximize ? 'activé' : 'désactivé'

      return `Agrandissement des fenêtres au lancement ${what}.`
    }
    case 'shortTitles': {
      const what = change.short ? 'activé' : 'désactivé'

      return `Pseudo seul dans le titre des fenêtres ${what}.`
    }
    case 'paintPortraits': {
      const what = change.paint ? 'activée' : 'désactivée'

      return `Tête de classe dans la barre des tâches ${what}.`
    }
    case 'ungroupTaskbar': {
      const what = change.ungroup ? 'activé' : 'désactivé'

      return `Un bouton par personnage dans la barre des tâches ${what}.`
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

const shortcutsBoundLine = (bindings: readonly BoundCombination[]) => {
  const parts = bindings.map((bound) => {
    return `${journalBindingLabel(bound.binding)} ${boundCombinationLabel(bound)}`
  })

  return `Raccourcis : ${parts.join(' · ')}.`
}

const journalBindingLabel = (binding: Binding) => {
  return binding.kind === 'action'
    ? strings.shortcuts.actions[binding.action].label
    : `Réponse rapide ${binding.id}`
}

const boundCombinationLabel = ({ accelerator, status }: BoundCombination) => {
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

const journalPeriod = (entries: readonly JournalEntry[]) => {
  if (entries.length === 0) {
    return 'aucune entrée'
  }

  const lastIndex = entries.length - 1

  return `${journalMoment(entries[0].at)} → ${journalMoment(entries[lastIndex].at)}`
}

export const journalTranscript = (snapshot: Snapshot) => {
  const { journal } = snapshot

  const lines = journal.map((entry) => {
    return `${journalTime(entry.at)}  ${journalLine(entry.event)}`
  })

  return [
    `Multifus ${snapshot.version} sur ${snapshot.system}`,
    `Autorisation : ${snapshot.authorization.granted ? 'accordée' : 'refusée'}, écoute ${snapshot.authorization.listening ? 'active' : 'arrêtée'}`,
    `AutoFocus : ${snapshot.autoFocusEnabled ? 'actif' : 'suspendu'}, réveil des réduites ${snapshot.wakesMinimized ? 'actif' : 'inactif'}`,
    `Déplacement rapide : ${snapshot.walk.enabled ? 'allumé' : 'éteint'}`,
    shortcutsBoundLine(boundCombinations(snapshot)),
    `Configuration : ${snapshot.config.path}`,
    `Mise à jour : ${updateLine(snapshot.update)}`,
    `Entrées en mémoire : ${journal.length}, ${journalPeriod(journal)}`,
    'Le fichier du journal sur le disque va plus loin en arrière que ces lignes.',
    '',
    ...lines
  ].join('\n')
}

type ShortcutLineParams = {
  readonly action: ShortcutAction
  readonly outcome: ShortcutOutcome
}

const shortcutLine = ({ action, outcome }: ShortcutLineParams) => {
  const { label } = strings.shortcuts.actions[action]

  switch (outcome.outcome) {
    case 'focused': {
      return `${label} : ${outcome.nickname} au premier plan.`
    }
    case 'slept': {
      return `${label} : ${outcome.nickname} mis de côté.`
    }
    case 'woke': {
      return `${label} : ${outcome.nickname} remis dans le défilement.`
    }
    case 'swapped': {
      return outcome.awake === 'male'
        ? `${label} : les hommes sont dans le défilement, les femmes de côté.`
        : `${label} : les femmes sont dans le défilement, les hommes de côté.`
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
    case 'walk': {
      return outcome.enabled ? `${label} : allumé.` : `${label} : éteint.`
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

type EventOf<Kind extends JournalEvent['kind']> = Extract<
  JournalEvent,
  { readonly kind: Kind }
>

type ComposedEventKind = Exclude<
  JournalEvent['kind'],
  DetailedEventKind | PlainEventKind
>

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

type ActionEventKind = Exclude<ComposedEventKind, RunEventKind>

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

const displayAwakeLine = (held: boolean) => {
  return held
    ? 'Écran tenu éveillé : il y a des messages privés à écouter.'
    : 'Écran relâché : plus aucun personnage relayé n’est connecté.'
}

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
      return `Envoi des messages privés activé depuis ${surfaceLabel(event.surface)}.`
    }
    case 'relayDisabled': {
      return RELAY_STOP_LINES[event.reason]
    }
    case 'walkEnabled': {
      const what = event.enabled ? 'allumé' : 'éteint'

      return `Déplacement rapide ${what} depuis ${WALK_FROM_LABELS[event.from]}.`
    }
    case 'walkIdle': {
      return WALK_IDLE_LINES[event.reason]
    }
    default: {
      return ''
    }
  }
}

export const journalLine = (event: JournalEvent) => {
  if (isDetailed(event)) {
    return `${DETAILED_LINES[event.kind]} : ${event.detail}`
  }

  if (isPlain(event)) {
    return PLAIN_LINES[event.kind]
  }

  return isRunEvent(event) ? runLine(event) : actionLine(event)
}
