/**
 * Each union of the domain, and the French phrase it is worth. The journal keeps
 * its own, in `helpers/journal.ts`.
 */

import type { PairingProblem } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { ShortcutStatus } from '@/@types/shortcuts'
import type {
  Authorization,
  ConfigProblem,
  UpdateStatus
} from '@/@types/system'
import { strings } from '@/constants/strings'

/** A sentence and the weight it carries, which is what colours it. */
export type TonedLine = {
  readonly tone: 'bad' | 'calm'
  readonly text: string
}

/**
 * One entry per way the file can let multifus down. A table and not a switch, so
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

/** What the system answered about a combination, in French. */
export const shortcutStatusLine = (status: ShortcutStatus): TonedLine => {
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
      const { label } = strings.shortcuts.actions[status.action]

      return { tone: 'bad', text: answers.duplicate(label) }
    }
    default: {
      return { tone: 'calm', text: answers.pending }
    }
  }
}

/** Whether multifus is hearing the system, which is the fact the rail carries. */
export const authorizationLine = (authorization: Authorization) => {
  if (!authorization.granted) {
    return strings.status.denied
  }

  return authorization.listening
    ? strings.status.listening
    : strings.status.notListening
}

/** Where a character stands: offline, asleep, or in the cycle. */
export const characterStateLine = (character: Character) => {
  if (!character.online) {
    return strings.characters.offline
  }

  return character.asleep
    ? strings.characters.asleep
    : strings.characters.inCycle
}
