/**
 * Each union of the domain, and the French phrase it is worth. The journal keeps
 * its own, in `helpers/journal.ts`.
 */

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

/** A sentence and the weight it carries, which is what colours it. */
export type TonedLine = {
  readonly tone: 'bad' | 'calm'
  readonly text: string
}

/**
 * One entry per way the file can let Multifus down. A table and not a switch, so
 * a fifth kind added on the Rust side fails to compile instead of going silent.
 */
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

/**
 * Where the update got to. A sentence and not a badge: every other state of this
 * window is said in French.
 */
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

/** Why a pairing did not go through, put into words. */
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

/** How much of a quick reply's text is enough to tell it from its neighbours. */
const QUICK_REPLY_LABEL_LENGTH = 30

/**
 * What a combination fires, named the way the screen names it, quotes included.
 * A quick reply has no name of its own, so it is named by the head of its text.
 */
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

/**
 * The head of a line. `Array.from` walks code points, where a `slice` on the
 * string would split an accent in two.
 */
const shorten = (text: string) => {
  const letters = Array.from(text)

  if (letters.length <= QUICK_REPLY_LABEL_LENGTH) {
    return text
  }

  return `${letters.slice(0, QUICK_REPLY_LABEL_LENGTH).join('')}…`
}

/**
 * What the system answered about a combination, in French. The quick replies come
 * along because a doublon names whichever binding holds the keys.
 */
export const shortcutStatusLine = (
  status: ShortcutStatus,
  quickReplies: readonly QuickReply[]
): TonedLine => {
  const answers = strings.shortcuts.status

  switch (status.kind) {
    case 'registered': {
      return { tone: 'calm', text: answers.registered }
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

/** Whether Multifus is hearing the system, which is the fact the rail carries. */
export const authorizationLine = (authorization: Authorization) => {
  if (!authorization.granted) {
    return strings.status.denied
  }

  return authorization.listening
    ? strings.status.listening
    : strings.status.notListening
}

/** The ochre goes to a character connected and in the cycle, and to it alone. */
export const characterState = (character: Character): LampState => {
  if (!character.online) {
    return 'offline'
  }

  return character.asleep ? 'asleep' : 'live'
}

/** One phrase per lamp, so the light and the word beside it cannot disagree. */
const CHARACTER_STATE_LINES = {
  offline: strings.characters.offline,
  asleep: strings.characters.asleep,
  live: strings.characters.inCycle
} as const satisfies Record<LampState, string>

/** Where a character stands: offline, asleep, or in the cycle. */
export const characterStateLine = (character: Character) => {
  return CHARACTER_STATE_LINES[characterState(character)]
}
