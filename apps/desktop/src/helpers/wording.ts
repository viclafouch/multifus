import { i18n } from '@lingui/core'
import { msg, plural, t } from '@lingui/core/macro'
import type { PairingProblem, RelayFailure } from '@/@types/relay'
import type { Character, Color, Gender } from '@/@types/roster'
import type {
  Binding,
  QuickReply,
  ShortcutAction,
  ShortcutStatus
} from '@/@types/shortcuts'
import type { Clients, ClientsState } from '@/@types/snapshot'
import type {
  Authorization,
  ConfigProblem,
  UpdateStatus
} from '@/@types/system'
import type { LampState } from '@/components/lamp'
import { IS_APPLE } from '@/constants/keyboard'
import { CLASS_LABELS, COLOR_LABELS } from '@/constants/roster'
import { SHORTCUT_ACTIONS } from '@/constants/shortcuts'
import type { Phrase } from '@/lib/i18n'

export type TonedLine = {
  readonly tone: 'bad' | 'calm'
  readonly text: string
}

type ProblemLines = {
  readonly title: Phrase
  readonly body: Phrase
}

const CONFIG_PROBLEM_LINES = {
  malformed: {
    title: msg`Vos réglages ont été mis de côté`,
    body: msg`Le fichier n’était plus lisible. Multifus l’a gardé sous un autre nom et repart sur ses réglages d’origine.`
  },
  notSaved: {
    title: msg`Vos réglages n’ont pas été enregistrés`,
    body: msg`Ce que vous voyez à l’écran est bon, mais rien n’a été écrit sur le disque.`
  },
  notSetAside: {
    title: msg`Vos réglages illisibles sont toujours en place`,
    body: msg`Multifus n’a pas réussi à mettre le fichier de côté. Le prochain enregistrement l’écrasera. Copiez-le ailleurs si son contenu compte.`
  },
  unreadable: {
    title: msg`Vos réglages n’ont pas pu être lus`,
    body: msg`Multifus a démarré sur ses réglages d’origine. Votre fichier est toujours là, intact.`
  }
} as const satisfies Record<ConfigProblem['kind'], ProblemLines>

export const configProblemLines = (kind: ConfigProblem['kind']) => {
  const { title, body } = CONFIG_PROBLEM_LINES[kind]

  return { title: i18n._(title), body: i18n._(body) }
}

export const updateLine = (update: UpdateStatus) => {
  switch (update.kind) {
    case 'checking': {
      return t`Vérification en cours…`
    }
    case 'upToDate': {
      return t`Vous êtes à jour.`
    }
    case 'available': {
      const { version } = update

      return t`La version ${version} est prête. Multifus se relancera tout seul, sans toucher à vos clients.`
    }
    case 'installing': {
      return t`Téléchargement en cours…`
    }
    case 'failed': {
      const { detail } = update

      return t`La mise à jour a échoué : ${detail}`
    }
    default: {
      return update satisfies never
    }
  }
}

const telegramSilentLine = (detail: string) => {
  return t`Telegram n’a pas répondu. Vérifiez votre connexion (${detail}).`
}

export const pairingProblemLine = (problem: PairingProblem) => {
  switch (problem.kind) {
    case 'tokenBlank': {
      return t`Collez d’abord le code que BotFather vous a envoyé.`
    }
    case 'tokenRefused': {
      const { detail } = problem

      return t`Telegram ne reconnaît pas ce code. Recopiez-le en entier (${detail}).`
    }
    case 'noChat': {
      return t`Le code est bon. Il ne manque que l’étape 4, votre « salut » au robot.`
    }
    case 'keychain': {
      const { detail } = problem

      return t`Le code n’a pas pu être enregistré, rien n’est gardé (${detail}).`
    }
    case 'network': {
      const { detail } = problem

      return telegramSilentLine(detail)
    }
    default: {
      return problem satisfies never
    }
  }
}

export const relayFailureLine = ({ reason, detail }: RelayFailure) => {
  switch (reason) {
    case 'keychain': {
      return t`Multifus n’a pas retrouvé le code de votre robot (${detail}).`
    }
    case 'telegram': {
      return t`Telegram a refusé la demande (${detail}).`
    }
    case 'network': {
      return telegramSilentLine(detail)
    }
    default: {
      return reason satisfies never
    }
  }
}

const QUICK_REPLY_LABEL_LENGTH = 30

export const bindingLabel = (
  binding: Binding,
  quickReplies: readonly QuickReply[]
): string => {
  if (binding.kind === 'action') {
    const label = i18n._(SHORTCUT_ACTIONS[binding.action].label)

    return t`« ${label} »`
  }

  if (binding.kind === 'character') {
    const { nickname } = binding

    return t`« ${nickname} »`
  }

  const quickReply = quickReplies.find((candidate) => {
    return candidate.id === binding.id
  })

  if (quickReply === undefined || quickReply.text.length === 0) {
    return t`une réponse sans texte`
  }

  const text = shorten(quickReply.text)

  return t`la réponse « ${text} »`
}

export const quickReplyEditLabel = (quickReply: QuickReply, rank: number) => {
  if (quickReply.text.length === 0) {
    return t`Modifier les touches de la réponse ${rank}`
  }

  const text = shorten(quickReply.text)

  return t`Modifier les touches de la réponse ${rank}, « ${text} »`
}

const shorten = (text: string) => {
  const letters = Array.from(text)

  if (letters.length <= QUICK_REPLY_LABEL_LENGTH) {
    return text
  }

  return `${letters.slice(0, QUICK_REPLY_LABEL_LENGTH).join('')}…`
}

export const shortcutActionLabel = (action: ShortcutAction) => {
  return i18n._(SHORTCUT_ACTIONS[action].label)
}

export const shortcutUndoLabel = (action: ShortcutAction) => {
  const label = shortcutActionLabel(action)

  return t`Remettre les touches d’avant pour ${label}`
}

export const shortcutStatusLine = (
  status: ShortcutStatus,
  quickReplies: readonly QuickReply[]
): TonedLine | null => {
  switch (status.kind) {
    case 'registered': {
      return null
    }
    case 'unbound': {
      return { tone: 'calm', text: t`Sans touches, il ne se passera rien.` }
    }
    case 'invalid': {
      return {
        tone: 'bad',
        text: t`Ces touches ne peuvent pas servir de raccourci.`
      }
    }
    case 'refused': {
      return {
        tone: 'bad',
        text: t`Refusé : un autre logiciel utilise déjà ces touches.`
      }
    }
    case 'duplicate': {
      const label = bindingLabel(status.binding, quickReplies)

      return { tone: 'bad', text: t`Déjà pris par ${label}.` }
    }
    default: {
      return status satisfies never
    }
  }
}

export const characterShortcutStatusLine = (
  status: ShortcutStatus,
  quickReplies: readonly QuickReply[]
): TonedLine | null => {
  return status.kind === 'unbound'
    ? null
    : shortcutStatusLine(status, quickReplies)
}

export const authorizationLine = (authorization: Authorization) => {
  if (!authorization.granted) {
    return t`Autorisation manquante`
  }

  return authorization.listening ? t`À l’écoute du jeu` : t`Écoute interrompue`
}

const clientsState = ({ open, small, readable }: Clients): ClientsState => {
  if (!readable) {
    return 'unreadable'
  }

  if (open === 0) {
    return 'none'
  }

  return small === 0 ? 'maximized' : 'small'
}

const clientsBadge = (state: ClientsState, small: number) => {
  switch (state) {
    case 'small': {
      return plural(small, {
        one: '# client en petit',
        other: '# clients en petit'
      })
    }
    case 'maximized': {
      return t`Tout est agrandi`
    }
    case 'none': {
      return t`Aucun client ouvert`
    }
    case 'unreadable': {
      return t`Fenêtres illisibles`
    }
    default: {
      return state satisfies never
    }
  }
}

const clientsBody = (state: ClientsState) => {
  switch (state) {
    case 'small': {
      return t`Un client ouvert avant Multifus garde sa petite taille.`
    }
    case 'maximized': {
      return t`Vos clients Dofus Retro couvrent déjà tout leur écran.`
    }
    case 'none': {
      return t`Aucune fenêtre de Dofus Retro n’est ouverte en ce moment.`
    }
    case 'unreadable': {
      return t`Multifus ne peut pas lire les fenêtres du jeu.`
    }
    default: {
      return state satisfies never
    }
  }
}

export const clientsLines = (clients: Clients) => {
  const state = clientsState(clients)

  return {
    state,
    badge: clientsBadge(state, clients.small),
    body: clientsBody(state)
  }
}

export const characterState = (character: Character): LampState => {
  if (!character.online) {
    return 'offline'
  }

  return character.excluded ? 'excluded' : 'live'
}

const lampLine = (state: LampState) => {
  switch (state) {
    case 'offline': {
      return t`Déconnecté`
    }
    case 'excluded': {
      return t`Exclu`
    }
    case 'live': {
      return t`Connecté`
    }
    default: {
      return state satisfies never
    }
  }
}

export const characterStateLine = (character: Character) => {
  return lampLine(characterState(character))
}

export const characterPresence = (character: Character): LampState => {
  return character.online ? 'live' : 'offline'
}

const SEPARATOR = ' · '

const prefixed = (prefix: string, line: string) => {
  return `${prefix}${SEPARATOR}${line}`
}

const classPrefixed = (character: Character, line: string) => {
  if (character.class === null) {
    return line
  }

  return prefixed(i18n._(CLASS_LABELS[character.class]), line)
}

type MissingPart = 'class' | 'gender'

const missingPart = (character: Character): MissingPart | null => {
  if (character.class === null) {
    return 'class'
  }

  if (character.gender === null) {
    return 'gender'
  }

  return null
}

const missingPartLine = (missing: MissingPart) => {
  return missing === 'class' ? t`Classe à choisir` : t`Sexe à choisir`
}

const missingPartLabel = (missing: MissingPart, nickname: string) => {
  return missing === 'class'
    ? t`Choisir la classe de ${nickname}`
    : t`Choisir le sexe de ${nickname}`
}

export const characterSubLine = (character: Character) => {
  const missing = missingPart(character)
  const state = characterStateLine(character)

  if (missing === null) {
    return classPrefixed(character, state)
  }

  return prefixed(missingPartLine(missing), state)
}

export const characterMarksLabel = (character: Character) => {
  const missing = missingPart(character)
  const { nickname } = character

  if (missing === null) {
    return t`Changer la classe, le sexe ou la couleur de ${nickname}`
  }

  return missingPartLabel(missing, nickname)
}

export const characterMarksTooltip = (character: Character) => {
  const missing = missingPart(character)

  if (missing === null) {
    return t`Modifier`
  }

  return missingPartLabel(missing, character.nickname)
}

export const colorReadout = (color: Color | null, holder: string | null) => {
  if (color === null) {
    return t`Aucune couleur`
  }

  const label = i18n._(COLOR_LABELS[color])

  return holder === null ? label : prefixed(label, t`déjà pris par ${holder}`)
}

export const dialogNote = (paintPortraits: boolean) => {
  if (IS_APPLE) {
    return t`Sur macOS, la tête reste ici : le client garde son logo Dofus.`
  }

  if (!paintPortraits) {
    return t`La tête de classe est coupée dans les Paramètres : le client garde son logo Dofus.`
  }

  return null
}

export const characterPresenceSubLine = (character: Character) => {
  return classPrefixed(character, lampLine(characterPresence(character)))
}

const MISSING_GENDER_NAMED = 2

export const missingGenderLine = (nicknames: readonly string[]) => {
  if (nicknames.length === 0) {
    return null
  }

  const named = nicknames.slice(0, MISSING_GENDER_NAMED)
  const rest = nicknames.length - named.length
  const others = plural(rest, { one: '# autre', other: '# autres' })
  const parts = rest === 0 ? named : [...named, others]
  const names = new Intl.ListFormat(i18n.locale, {
    style: 'long',
    type: 'conjunction'
  }).format(parts)

  return nicknames.length === 1
    ? t`${names} n’a pas de sexe : il ne bougera pas.`
    : t`${names} n’ont pas de sexe : ils ne bougeront pas.`
}

export const genderGroupLabel = (gender: Gender) => {
  return gender === 'male'
    ? t`Hommes dans le défilement et l’AutoFocus`
    : t`Femmes dans le défilement et l’AutoFocus`
}

type GenderGroupHintParams = {
  readonly gender: Gender
  readonly isEmpty: boolean
  readonly isIncluded: boolean
}

export const genderGroupHint = ({
  gender,
  isEmpty,
  isIncluded
}: GenderGroupHintParams) => {
  if (isEmpty) {
    return gender === 'male'
      ? t`Aucun homme connecté`
      : t`Aucune femme connectée`
  }

  if (isIncluded) {
    return gender === 'male'
      ? t`Exclure tous les hommes`
      : t`Exclure toutes les femmes`
  }

  return gender === 'male'
    ? t`Réintégrer tous les hommes`
    : t`Réintégrer toutes les femmes`
}
