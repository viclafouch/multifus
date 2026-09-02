import type { PairingProblem } from '@/@types/relay'
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
import { strings } from '@/constants/strings'
import { matchIsPlural } from '@/helpers/format'

export type TonedLine = {
  readonly tone: 'bad' | 'calm'
  readonly text: string
}

export const CONFIG_PROBLEM_LINES = {
  malformed: {
    title: strings.config.malformedTitle,
    body: strings.config.malformedBody
  },
  notSaved: {
    title: strings.config.notSavedTitle,
    body: strings.config.notSavedBody
  },
  notSetAside: {
    title: strings.config.notSetAsideTitle,
    body: strings.config.notSetAsideBody
  },
  unreadable: {
    title: strings.config.unreadableTitle,
    body: strings.config.unreadableBody
  }
} as const satisfies Record<
  ConfigProblem['kind'],
  { readonly title: string; readonly body: string }
>

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
      return update satisfies never
    }
  }
}

export const pairingProblemLine = (problem: PairingProblem) => {
  const { problem: lines } = strings.relay

  switch (problem.kind) {
    case 'tokenBlank': {
      return lines.tokenBlank
    }
    case 'tokenRefused': {
      return lines.tokenRefused(problem.detail)
    }
    case 'noChat': {
      return lines.noChat
    }
    case 'keychain': {
      return lines.keychain(problem.detail)
    }
    case 'network': {
      return lines.network(problem.detail)
    }
    default: {
      return problem satisfies never
    }
  }
}

const QUICK_REPLY_LABEL_LENGTH = 30

export const bindingLabel = (
  binding: Binding,
  quickReplies: readonly QuickReply[]
): string => {
  const words = strings.quickReplies

  if (binding.kind === 'action') {
    return `« ${strings.shortcuts.actions[binding.action].label} »`
  }

  if (binding.kind === 'character') {
    return strings.shortcuts.characterNamed(binding.nickname)
  }

  const quickReply = quickReplies.find((candidate) => {
    return candidate.id === binding.id
  })

  if (quickReply === undefined || quickReply.text.length === 0) {
    return words.unnamed
  }

  return words.named(shorten(quickReply.text))
}

export const quickReplyEditLabel = (quickReply: QuickReply, rank: number) => {
  const words = strings.quickReplies

  return quickReply.text.length === 0
    ? words.edit(rank)
    : words.editNamed(rank, shorten(quickReply.text))
}

const shorten = (text: string) => {
  const letters = Array.from(text)

  if (letters.length <= QUICK_REPLY_LABEL_LENGTH) {
    return text
  }

  return `${letters.slice(0, QUICK_REPLY_LABEL_LENGTH).join('')}…`
}

export const shortcutUndoLabel = (action: ShortcutAction) => {
  return strings.shortcuts.undoLabel(strings.shortcuts.actions[action].label)
}

export const shortcutStatusLine = (
  status: ShortcutStatus,
  quickReplies: readonly QuickReply[]
): TonedLine | null => {
  const answers = strings.shortcuts.status

  switch (status.kind) {
    case 'registered': {
      return null
    }
    case 'unbound': {
      return { tone: 'calm', text: answers.unbound }
    }
    case 'invalid': {
      return { tone: 'bad', text: answers.invalid }
    }
    case 'refused': {
      return { tone: 'bad', text: answers.refused }
    }
    case 'duplicate': {
      return {
        tone: 'bad',
        text: answers.duplicate(bindingLabel(status.binding, quickReplies))
      }
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
    return strings.status.denied
  }

  return authorization.listening
    ? strings.status.listening
    : strings.status.notListening
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

export const clientsLines = (clients: Clients) => {
  const words = strings.settings.clients
  const state = clientsState(clients)

  return {
    state,
    badge:
      state === 'small' ? words.badge.small(clients.small) : words.badge[state],
    body: words.body[state]
  }
}

export const characterState = (character: Character): LampState => {
  if (!character.online) {
    return 'offline'
  }

  return character.excluded ? 'excluded' : 'live'
}

const CHARACTER_STATE_LINES = {
  offline: strings.characters.offline,
  excluded: strings.characters.excluded,
  live: strings.characters.online
} as const satisfies Record<LampState, string>

export const characterStateLine = (character: Character) => {
  return CHARACTER_STATE_LINES[characterState(character)]
}

export const characterPresence = (character: Character): LampState => {
  return character.online ? 'live' : 'offline'
}

const characterPresenceLine = (character: Character) => {
  return CHARACTER_STATE_LINES[characterPresence(character)]
}

const SEPARATOR = ' · '

const prefixed = (prefix: string, line: string) => {
  return `${prefix}${SEPARATOR}${line}`
}

const classPrefixed = (character: Character, line: string) => {
  if (character.class === null) {
    return line
  }

  return prefixed(strings.characters.classes[character.class], line)
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

const MISSING_PART_LINES = {
  class: strings.characters.classMissing,
  gender: strings.characters.genderMissing
} as const satisfies Record<MissingPart, string>

const MISSING_PART_LABELS = {
  class: strings.characters.classPick,
  gender: strings.characters.genderPick
} as const satisfies Record<MissingPart, (nickname: string) => string>

export const characterSubLine = (character: Character) => {
  const missing = missingPart(character)
  const state = characterStateLine(character)

  if (missing === null) {
    return classPrefixed(character, state)
  }

  return prefixed(MISSING_PART_LINES[missing], state)
}

export const characterMarksLabel = (character: Character) => {
  const missing = missingPart(character)

  if (missing === null) {
    return strings.characters.characterChange(character.nickname)
  }

  return MISSING_PART_LABELS[missing](character.nickname)
}

export const characterMarksTooltip = (character: Character) => {
  const missing = missingPart(character)

  if (missing === null) {
    return strings.characters.characterChangeShort
  }

  return MISSING_PART_LABELS[missing](character.nickname)
}

export const colorReadout = (color: Color | null, holder: string | null) => {
  if (color === null) {
    return strings.characters.colorNone
  }

  const label = strings.characters.colors[color]

  return holder === null
    ? label
    : prefixed(label, strings.characters.colorTakenBy(holder))
}

export const dialogNote = (paintPortraits: boolean) => {
  if (IS_APPLE) {
    return strings.characters.dialogWindowKeepsIcon
  }

  if (!paintPortraits) {
    return strings.characters.dialogPortraitOff
  }

  return null
}

export const characterPresenceSubLine = (character: Character) => {
  return classPrefixed(character, characterPresenceLine(character))
}

const MISSING_GENDER_NAMED = 2

const NAMES = new Intl.ListFormat('fr-FR', {
  style: 'long',
  type: 'conjunction'
})

export const missingGenderLine = (nicknames: readonly string[]) => {
  if (nicknames.length === 0) {
    return null
  }

  const named = nicknames.slice(0, MISSING_GENDER_NAMED)
  const rest = nicknames.length - named.length
  const others = matchIsPlural(rest) ? `${rest} autres` : `${rest} autre`
  const parts = rest === 0 ? named : [...named, others]

  return strings.characters.missingGender(
    NAMES.format(parts),
    !matchIsPlural(nicknames.length)
  )
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
    return strings.characters.emptyGroupLabel[gender]
  }

  return isIncluded
    ? strings.characters.excludeGroupLabel[gender]
    : strings.characters.includeGroupLabel[gender]
}
