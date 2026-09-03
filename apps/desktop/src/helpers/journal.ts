import { i18n } from '@lingui/core'
import { plural, t } from '@lingui/core/macro'
import type {
  CharacterShortcutOutcome,
  JournalEntry,
  JournalEvent,
  MaximizeAllOutcome,
  NotificationOutcome,
  QuickReplyFailure,
  RosterChange,
  SettingChange,
  ShortcutOutcome,
  TrayOutcome,
  WheelOutcome
} from '@/@types/journal'
import type { NotificationKind } from '@/@types/notification'
import type { RelayFailure } from '@/@types/relay'
import type {
  BoundCombination,
  QuickReply,
  ShortcutAction
} from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import type { Surface } from '@/@types/system'
import type { JournalTone } from '@/constants/journal'
import {
  DEAD_SHORTCUT_STATUSES,
  DETAILED_LINES,
  GENDER_GROUP_LINES,
  MAXIMIZE_ALL_TONES,
  NOTICE_LINES,
  QUICK_REPLY_FAILURE_TONES,
  PLAIN_LINES,
  SURFACE_LABELS,
  WALK_FROM_LABELS,
  WALK_IDLE_LINES,
  WALK_IDLE_TONES,
  RELAY_STOP_LINES,
  SHORTCUT_TONES,
  TONES,
  TRAY_TONES,
  WHEEL_TONES,
  WORK_LABELS
} from '@/constants/journal'
import { LANGUAGE_LABELS } from '@/constants/language'
import { NOTIFICATION_LABELS } from '@/constants/notification'
import { CLASS_LABELS, COLOR_LABELS } from '@/constants/roster'
import { focusDuration } from '@/helpers/format'
import {
  bindingLabel,
  shortcutActionLabel,
  updateLine
} from '@/helpers/wording'

export const journalTime = (milliseconds: number) => {
  return new Date(milliseconds).toLocaleTimeString(i18n.locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const journalMoment = (milliseconds: number) => {
  return new Date(milliseconds).toLocaleString(i18n.locale, {
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

  if (event.kind === 'shortcut' || event.kind === 'characterShortcut') {
    return SHORTCUT_TONES[event.outcome.outcome]
  }

  if (event.kind === 'quickReplyFailed') {
    return QUICK_REPLY_FAILURE_TONES[event.reason.reason]
  }

  if (event.kind === 'maximizeAll') {
    return MAXIMIZE_ALL_TONES[event.outcome.outcome]
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

  if (event.kind === 'wheelPicked') {
    return WHEEL_TONES[event.outcome.outcome]
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

const startedLine = ({
  version,
  system,
  launch
}: Extract<JournalEvent, { kind: 'started' }>) => {
  return launch === 'session'
    ? t`Multifus ${version} a démarré sur ${system}, au démarrage de la session.`
    : t`Multifus ${version} a démarré sur ${system}, lancé à la main.`
}

const configLoadFailedLine = ({
  detail,
  quarantined
}: Extract<JournalEvent, { kind: 'configLoadFailed' }>) => {
  if (quarantined === null) {
    return t`Configuration non chargée, Multifus est reparti sur ses réglages par défaut (${detail}). Rien n’a été déplacé.`
  }

  return t`Configuration non chargée, Multifus est reparti sur ses réglages par défaut (${detail}). Fichier mis de côté : ${quarantined}`
}

const authorizationRequestedLine = ({
  failure,
  granted
}: Extract<JournalEvent, { kind: 'authorizationRequested' }>) => {
  if (failure !== null) {
    return t`Autorisation demandée : le système n’a pas pu répondre (${failure}).`
  }

  return granted
    ? t`Autorisation demandée : accordée.`
    : t`Autorisation demandée : pas encore accordée, ce qui est normal dans la seconde qui suit.`
}

const relayFailedLine = ({ reason, detail }: RelayFailure) => {
  switch (reason) {
    case 'keychain': {
      return t`Messages privés : le trousseau du système a refusé le code du robot (${detail}).`
    }
    case 'telegram': {
      return t`Messages privés : Telegram a refusé la requête (${detail}).`
    }
    case 'network': {
      return t`Messages privés : Telegram n’a pas répondu (${detail}).`
    }
    default: {
      return reason satisfies never
    }
  }
}

const quickReplyFailedLine = (failure: QuickReplyFailure) => {
  switch (failure.reason) {
    case 'outsideGame': {
      return t`Réponse rapide ignorée : aucune fenêtre Dofus au premier plan.`
    }
    case 'foregroundUnknown': {
      const { detail } = failure

      return t`Réponse rapide ignorée : impossible de savoir quelle fenêtre est au premier plan (${detail}).`
    }
    case 'gone': {
      return t`Réponse rapide introuvable : elle a été retirée entre l’appui et le collage.`
    }
    case 'clipboardRefused': {
      const { detail } = failure

      return t`Réponse rapide non collée : le presse-papiers a refusé le texte (${detail}).`
    }
    case 'pasteRefused': {
      const { detail } = failure

      return t`Réponse rapide non collée : le système a refusé la combinaison de collage (${detail}).`
    }
    case 'clipboardNotGivenBack': {
      const { detail } = failure

      return t`Réponse rapide collée, mais le presse-papiers d’avant n’a pas pu être rendu (${detail}).`
    }
    default: {
      return failure satisfies never
    }
  }
}

type MaximizeAllLineParams = {
  readonly from: Surface
  readonly outcome: MaximizeAllOutcome
}

const maximizeAllLine = ({ from, outcome }: MaximizeAllLineParams) => {
  const surface = i18n._(SURFACE_LABELS[from])

  switch (outcome.outcome) {
    case 'asked': {
      return plural(outcome.windows, {
        one: `Agrandir les fenêtres, depuis ${surface} : demandé à un client.`,
        other: `Agrandir les fenêtres, depuis ${surface} : demandé à # clients.`
      })
    }
    case 'nothingMoved': {
      return t`Agrandir les fenêtres, depuis ${surface} : aucun client n’a accepté.`
    }
    case 'noClient': {
      return t`Agrandir les fenêtres, depuis ${surface} : aucun client Dofus ouvert.`
    }
    case 'denied': {
      return t`Agrandir les fenêtres, depuis ${surface} : l’autorisation manque.`
    }
    case 'refused': {
      const { detail } = outcome

      return t`Agrandir les fenêtres, depuis ${surface} : lecture des fenêtres impossible (${detail}).`
    }
    default: {
      return outcome satisfies never
    }
  }
}

const rosterLine = (change: RosterChange) => {
  switch (change.kind) {
    case 'excluded': {
      const { nickname } = change

      return t`${nickname} exclu.`
    }
    case 'included': {
      const { nickname } = change

      return t`${nickname} réintégré.`
    }
    case 'genderExcluded': {
      const lines = GENDER_GROUP_LINES[change.gender]

      return i18n._(change.excluded ? lines.excluded : lines.included)
    }
    case 'genderAssigned': {
      const { nickname, gender } = change

      if (gender === null) {
        return t`Sexe retiré à ${nickname}.`
      }

      return gender === 'male'
        ? t`${nickname} est assigné comme homme.`
        : t`${nickname} est assigné comme femme.`
    }
    case 'classAssigned': {
      const { nickname } = change

      if (change.class === null) {
        return t`Classe retirée à ${nickname}.`
      }

      const label = i18n._(CLASS_LABELS[change.class])

      return t`${nickname} est assigné comme ${label}.`
    }
    case 'colorAssigned': {
      const { nickname, color } = change

      if (color === null) {
        return t`Couleur retirée à ${nickname}.`
      }

      const label = i18n._(COLOR_LABELS[color])

      return t`${nickname} est marqué en ${label}.`
    }
    case 'reordered': {
      if (change.order.length === 0) {
        return t`Ordre du défilement modifié, roster vide.`
      }

      const order = change.order.join(', ')

      return t`Ordre du défilement : ${order}.`
    }
    case 'main': {
      const { nickname } = change

      return change.main
        ? t`${nickname} devient votre personnage principal.`
        : t`${nickname} n’est plus votre personnage principal.`
    }
    case 'removed': {
      const { nickname } = change

      return t`${nickname} retiré du roster.`
    }
    case 'relayed': {
      const { nickname } = change

      return change.relayed
        ? t`${nickname} est relayé.`
        : t`${nickname} n’est plus relayé.`
    }
    default: {
      return change satisfies never
    }
  }
}

const settingLine = (change: SettingChange) => {
  switch (change.kind) {
    case 'autoFocusEnabled': {
      const surface = i18n._(SURFACE_LABELS[change.from])

      return change.enabled
        ? t`AutoFocus activé depuis ${surface}.`
        : t`AutoFocus désactivé depuis ${surface}.`
    }
    case 'autoFocusKind': {
      const label = i18n._(NOTIFICATION_LABELS[change.notificationKind].label)

      return change.enabled
        ? t`AutoFocus, type ${label} activé.`
        : t`AutoFocus, type ${label} désactivé.`
    }
    case 'wakesMinimized': {
      const surface = i18n._(SURFACE_LABELS[change.from])

      return change.wakes
        ? t`Réveil des fenêtres réduites activé depuis ${surface}.`
        : t`Réveil des fenêtres réduites désactivé depuis ${surface}.`
    }
    case 'maximizeOnLaunch': {
      return change.maximize
        ? t`Agrandissement des fenêtres au lancement activé.`
        : t`Agrandissement des fenêtres au lancement désactivé.`
    }
    case 'shortTitles': {
      return change.short
        ? t`Pseudo seul dans le titre des fenêtres activé.`
        : t`Pseudo seul dans le titre des fenêtres désactivé.`
    }
    case 'paintPortraits': {
      return change.paint
        ? t`Tête de classe dans la barre des tâches activée.`
        : t`Tête de classe dans la barre des tâches désactivée.`
    }
    case 'ungroupTaskbar': {
      return change.ungroup
        ? t`Un bouton par personnage dans la barre des tâches activé.`
        : t`Un bouton par personnage dans la barre des tâches désactivé.`
    }
    case 'relayBody': {
      return change.sendBody
        ? t`Envoi du texte des messages privés activé.`
        : t`Envoi du texte des messages privés désactivé.`
    }
    case 'language': {
      const label = LANGUAGE_LABELS[change.language]

      return t`Langue de Multifus : ${label}.`
    }
    default: {
      return change satisfies never
    }
  }
}

const shortcutsBoundLine = (
  bindings: readonly BoundCombination[],
  quickReplies: readonly QuickReply[]
) => {
  const bound = bindings
    .map((binding) => {
      return `${bindingLabel(binding.binding, quickReplies)} ${boundCombinationLabel(binding, quickReplies)}`
    })
    .join(' · ')

  return t`Raccourcis : ${bound}.`
}

const boundCombinationLabel = (
  { accelerator, status }: BoundCombination,
  quickReplies: readonly QuickReply[]
) => {
  const combination = accelerator ?? t`aucune combinaison`

  switch (status.kind) {
    case 'registered': {
      return combination
    }
    case 'unbound': {
      return t`non attribué`
    }
    case 'invalid': {
      const { detail } = status

      return t`${combination} illisible (${detail})`
    }
    case 'duplicate': {
      const label = bindingLabel(status.binding, quickReplies)

      return t`${combination} en doublon avec ${label}, donc inerte`
    }
    case 'refused': {
      const { detail } = status

      return t`${combination} refusé (${detail})`
    }
    default: {
      return status satisfies never
    }
  }
}

const boundCombinations = (snapshot: Snapshot): readonly BoundCombination[] => {
  const actions = snapshot.shortcuts.map(({ action, accelerator, status }) => {
    return { binding: { kind: 'action', action }, accelerator, status } as const
  })

  const characters = snapshot.characters
    .filter((character) => {
      return character.shortcut !== null
    })
    .map(({ nickname, shortcut, shortcutStatus }) => {
      return {
        binding: { kind: 'character', nickname },
        accelerator: shortcut,
        status: shortcutStatus
      } as const
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

  return [...actions, ...characters, ...quickReplies]
}

const journalPeriod = (entries: readonly JournalEntry[]) => {
  if (entries.length === 0) {
    return t`aucune entrée`
  }

  const lastIndex = entries.length - 1

  return `${journalMoment(entries[0].at)} → ${journalMoment(entries[lastIndex].at)}`
}

export const journalTranscript = (snapshot: Snapshot) => {
  const { journal } = snapshot

  const lines = journal.map((entry) => {
    return `${journalTime(entry.at)}  ${journalLine(entry.event, snapshot.quickReplies)}`
  })

  const { version, system } = snapshot
  const granted = snapshot.authorization.granted ? t`accordée` : t`refusée`
  const listening = snapshot.authorization.listening ? t`active` : t`arrêtée`
  const active = t`actif`
  const autoFocus = snapshot.autoFocusEnabled ? active : t`suspendu`
  const minimized = snapshot.wakesMinimized ? active : t`inactif`
  const walk = snapshot.walk.enabled ? t`allumé` : t`éteint`
  const { path } = snapshot.config
  const update = updateLine(snapshot.update)
  const kept = journal.length
  const period = journalPeriod(journal)

  return [
    t`Multifus ${version} sur ${system}`,
    t`Autorisation : ${granted}, écoute ${listening}`,
    t`AutoFocus : ${autoFocus}, réveil des réduites ${minimized}`,
    t`Déplacement rapide : ${walk}`,
    shortcutsBoundLine(boundCombinations(snapshot), snapshot.quickReplies),
    t`Configuration : ${path}`,
    t`Mise à jour : ${update}`,
    t`Entrées en mémoire : ${kept}, ${period}`,
    t`Le fichier du journal sur le disque va plus loin en arrière que ces lignes.`,
    '',
    ...lines
  ].join('\n')
}

type ShortcutLineParams = {
  readonly action: ShortcutAction
  readonly outcome: ShortcutOutcome
}

const shortcutLine = ({ action, outcome }: ShortcutLineParams) => {
  const label = shortcutActionLabel(action)

  switch (outcome.outcome) {
    case 'focused': {
      const { nickname } = outcome

      return t`${label} : ${nickname} au premier plan.`
    }
    case 'excluded': {
      const { nickname } = outcome

      return t`${label} : ${nickname} exclu.`
    }
    case 'included': {
      const { nickname } = outcome

      return t`${label} : ${nickname} réintégré.`
    }
    case 'outsideGame': {
      return t`${label} : ignoré, aucune fenêtre Dofus au premier plan.`
    }
    case 'notInRoster': {
      const { nickname } = outcome

      return t`${label} : ${nickname} n’est pas encore dans le roster.`
    }
    case 'nobodyInCycle': {
      return t`${label} : personne dans le défilement.`
    }
    case 'noMain': {
      return t`${label} : vous n’en avez pas encore choisi un.`
    }
    case 'alreadyThere': {
      const { nickname } = outcome

      return t`${label} : vous êtes déjà sur ${nickname}.`
    }
    case 'noWindow': {
      const { nickname } = outcome

      return t`${label} : la fenêtre de ${nickname} a disparu.`
    }
    case 'focusFailed': {
      const { nickname, detail } = outcome

      return t`${label} : le système a refusé de ramener ${nickname} au premier plan (${detail}).`
    }
    case 'foregroundUnknown': {
      const { detail } = outcome

      return t`${label} : impossible de savoir quelle fenêtre est au premier plan (${detail}).`
    }
    default: {
      return outcome satisfies never
    }
  }
}

const wheelLine = (outcome: WheelOutcome) => {
  switch (outcome.outcome) {
    case 'focused': {
      const { nickname } = outcome

      return t`La roue a ramené ${nickname} devant.`
    }
    case 'noWindow': {
      const { nickname } = outcome

      return t`La roue : la fenêtre de ${nickname} a disparu.`
    }
    case 'focusFailed': {
      const { nickname, detail } = outcome

      return t`La roue : le système a refusé de ramener ${nickname} devant (${detail}).`
    }
    default: {
      return outcome satisfies never
    }
  }
}

type CharacterShortcutLineParams = {
  readonly nickname: string
  readonly outcome: CharacterShortcutOutcome
}

const characterShortcutLine = ({
  nickname,
  outcome
}: CharacterShortcutLineParams) => {
  switch (outcome.outcome) {
    case 'focused': {
      return t`Raccourci de ${nickname} : sa fenêtre passe au premier plan.`
    }
    case 'alreadyThere': {
      return t`Raccourci de ${nickname} : vous y êtes déjà.`
    }
    case 'notInRoster': {
      return t`Raccourci de ${nickname} : il n’est plus dans le roster.`
    }
    case 'noWindow': {
      return t`Raccourci de ${nickname} : sa fenêtre a disparu.`
    }
    case 'outsideGame': {
      return t`Raccourci de ${nickname} : ignoré, aucune fenêtre Dofus au premier plan.`
    }
    case 'focusFailed': {
      const { detail } = outcome

      return t`Raccourci de ${nickname} : le système a refusé de le ramener au premier plan (${detail}).`
    }
    case 'foregroundUnknown': {
      const { detail } = outcome

      return t`Raccourci de ${nickname} : impossible de savoir quelle fenêtre est au premier plan (${detail}).`
    }
    default: {
      return outcome satisfies never
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
      return t`Barre système : ${nickname} au premier plan.`
    }
    case 'noWindow': {
      return t`Barre système : la fenêtre de ${nickname} a disparu.`
    }
    case 'focusFailed': {
      const { detail } = outcome

      return t`Barre système : le système a refusé de ramener ${nickname} au premier plan (${detail}).`
    }
    default: {
      return outcome satisfies never
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
  const subject = notificationSubject(nickname, notificationKind)

  switch (outcome.outcome) {
    case 'focused': {
      const took = focusDuration(outcome.focusMicros)

      return t`${subject} : fenêtre ramenée au premier plan en ${took}.`
    }
    case 'kindDisabled': {
      return t`${subject} : ce type est désactivé, rien n’a été fait.`
    }
    case 'kindUnknown': {
      return t`${subject} : type non reconnu, rien n’a été fait.`
    }
    case 'noWindow': {
      return t`${subject} : aucune fenêtre à ramener.`
    }
    case 'excluded': {
      return t`${subject} : personnage exclu, sa fenêtre reste où elle est.`
    }
    case 'leftMinimized': {
      return t`${subject} : fenêtre réduite, laissée où elle est.`
    }
    case 'bodyUnread': {
      return t`${subject} : corps de la notification illisible, rien n’a été fait.`
    }
    case 'focusFailed': {
      const { detail } = outcome

      return t`${subject} : le système a refusé le passage au premier plan (${detail}).`
    }
    default: {
      return outcome satisfies never
    }
  }
}

const notificationSubject = (
  nickname: string,
  notificationKind: NotificationKind | null
) => {
  if (notificationKind === null) {
    return t`Notification pour ${nickname}`
  }

  const label = i18n._(NOTIFICATION_LABELS[notificationKind].label)

  return t`${label} pour ${nickname}`
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

const runLine = (
  event: EventOf<RunEventKind>,
  quickReplies: readonly QuickReply[]
) => {
  switch (event.kind) {
    case 'started': {
      return startedLine(event)
    }
    case 'configLoadFailed': {
      return configLoadFailedLine(event)
    }
    case 'authorization': {
      return event.granted
        ? t`Autorisation accordée : les fenêtres sont lisibles.`
        : t`Autorisation refusée : les fenêtres ne peuvent pas être lues.`
    }
    case 'characterOnline': {
      const { nickname } = event

      return t`${nickname} est connecté.`
    }
    case 'characterOffline': {
      const { nickname } = event

      return t`${nickname} n’est plus connecté.`
    }
    case 'notification': {
      return notificationLine(event)
    }
    case 'shortcutsBound': {
      return shortcutsBoundLine(event.bindings, quickReplies)
    }
    case 'startAtLoginReconciled': {
      return event.enabled
        ? t`Démarrage avec la session actif, enregistrement réécrit.`
        : t`Démarrage avec la session inactif, aucun enregistrement.`
    }
    case 'updateAvailable': {
      const { version } = event

      return t`La version ${version} est disponible.`
    }
    case 'panicked': {
      const work = i18n._(WORK_LABELS[event.work])

      return t`${work} a échoué brutalement, et a repris.`
    }
    case 'relayFailed': {
      return relayFailedLine(event.reason)
    }
    case 'relaySent': {
      const { nickname } = event

      return t`${nickname} : message privé relayé sur le téléphone.`
    }
    case 'relayNoticeSent': {
      return i18n._(NOTICE_LINES[event.case])
    }
    case 'displayAwake': {
      return displayAwakeLine(event.held)
    }
    default: {
      return event satisfies never
    }
  }
}

const displayAwakeLine = (held: boolean) => {
  return held
    ? t`Écran tenu éveillé : il y a des messages privés à écouter.`
    : t`Écran relâché : plus aucun personnage relayé n’est connecté.`
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
    case 'characterShortcut': {
      return characterShortcutLine(event)
    }
    case 'maximizeAll': {
      return maximizeAllLine(event)
    }
    case 'quickReplyPasted': {
      const { excerpt } = event

      return t`Réponse rapide collée dans le jeu : « ${excerpt} »`
    }
    case 'quickReplyFailed': {
      return quickReplyFailedLine(event.reason)
    }
    case 'trayFocus': {
      return trayLine(event)
    }
    case 'relayEnabled': {
      const surface = i18n._(SURFACE_LABELS[event.surface])

      return t`Envoi des messages privés activé depuis ${surface}.`
    }
    case 'relayDisabled': {
      return i18n._(RELAY_STOP_LINES[event.reason])
    }
    case 'walkEnabled': {
      const from = i18n._(WALK_FROM_LABELS[event.from])

      return event.enabled
        ? t`Déplacement rapide allumé depuis ${from}.`
        : t`Déplacement rapide éteint depuis ${from}.`
    }
    case 'walkIdle': {
      return i18n._(WALK_IDLE_LINES[event.reason])
    }
    case 'wheelPicked': {
      return wheelLine(event.outcome)
    }
    default: {
      return event satisfies never
    }
  }
}

export const journalLine = (
  event: JournalEvent,
  quickReplies: readonly QuickReply[]
) => {
  if (isDetailed(event)) {
    const subject = i18n._(DETAILED_LINES[event.kind])
    const { detail } = event

    return t`${subject} : ${detail}`
  }

  if (isPlain(event)) {
    return i18n._(PLAIN_LINES[event.kind])
  }

  return isRunEvent(event) ? runLine(event, quickReplies) : actionLine(event)
}
