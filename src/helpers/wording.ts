import type { PairingProblem } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { Binding, QuickReply, ShortcutStatus } from '@/@types/shortcuts'
import type {
  Authorization,
  ConfigProblem,
  UpdateStatus
} from '@/@types/system'
import type { LampState } from '@/components/lamp'
import { strings } from '@/constants/strings'

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
      return ''
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
      return lines.tokenBlank
    }
  }
}

const QUICK_REPLY_LABEL_LENGTH = 30

export const bindingLabel = (
  binding: Binding,
  quickReplies: readonly QuickReply[]
): string => {
  const words = strings.shortcuts.quickReplies

  if (binding.kind === 'action') {
    return `« ${strings.shortcuts.actions[binding.action].label} »`
  }

  const quickReply = quickReplies.find((candidate) => {
    return candidate.id === binding.id
  })

  if (quickReply === undefined || quickReply.text.length === 0) {
    return words.unnamed
  }

  return words.named(shorten(quickReply.text))
}

const shorten = (text: string) => {
  const letters = Array.from(text)

  if (letters.length <= QUICK_REPLY_LABEL_LENGTH) {
    return text
  }

  return `${letters.slice(0, QUICK_REPLY_LABEL_LENGTH).join('')}…`
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
    case 'pending': {
      return { tone: 'calm', text: answers.pending }
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
      return { tone: 'calm', text: answers.pending }
    }
  }
}

export const authorizationLine = (authorization: Authorization) => {
  if (!authorization.granted) {
    return strings.status.denied
  }

  return authorization.listening
    ? strings.status.listening
    : strings.status.notListening
}

export const characterState = (character: Character): LampState => {
  if (!character.online) {
    return 'offline'
  }

  return character.asleep ? 'asleep' : 'live'
}

const CHARACTER_STATE_LINES = {
  offline: strings.characters.offline,
  asleep: strings.characters.asleep,
  live: strings.characters.online
} as const satisfies Record<LampState, string>

export const characterStateLine = (character: Character) => {
  return CHARACTER_STATE_LINES[characterState(character)]
}
